import Participant from "../models/Participant.js";
import QuizRoom from "../models/QuizRoom.js";
import Question from "../models/Question.js";
import mongoose from "mongoose";
import fetch from "node-fetch";

// format lại cho phần câu hỏi còn lại
async function _formatQuestion(question) {
  try {
    console.log("Formatting question:", question);

    // Basic question data
    const formatted = {
      _id: question._id,
      questionText: question.questionText,
      questionType: question.questionType,
      difficulty: question.difficulty,
      options: question.options,
      answers:
        question.answers?.map((answer) => ({
          text: answer.text,
          isCorrect: false, // Hide correct answers for security
        })) || [],
      dragDropPairs: question.dragDropPairs,
      imageUrl: question.imageUrl,
      explanation: question.explanation,
      category: question.category,
      subCategory: question.subCategory,
      tags: question.tags,
    };

    // Handle specific question types
    if (
      question.questionType === "multipleChoices" ||
      question.questionType === "dropdown"
    ) {
      formatted.options = question.options?.map((opt) => ({ text: opt })) || [];
    }

    console.log("Formatted question result:", formatted);
    return formatted;
  } catch (error) {
    console.error("Error formatting question:", error);
    // Return a minimal safe version if error occurs
    return {
      _id: question._id,
      questionText: question.questionText || "Error loading question",
      answers: [],
    };
  }
}

// Tham gia phong thi
async function joinRoom(socket, data) {
  try {
    const { roomCode, temporaryUsername, user, deviceInfo } = data;
    console.log("Join room request:", {
      roomCode,
      userId: user?._id,
      userName: user?.name,
      deviceInfo,
    });

    // Tìm phòng thi và lấy thông tin quiz
    const room = await QuizRoom.findOne({ roomCode }).populate("quiz");
    if (!room) {
      console.log("Room not found:", roomCode);
      throw new Error("Phòng thi không tồn tại hoặc chưa mở");
    }

    console.log("Found room:", {
      roomId: room._id,
      quizId: room.quiz?._id,
      participantCount: room.participants?.length,
    });

    const quiz = room.quiz;

    // Kiểm tra người chơi đã tham gia chưa
    let participant;
    const participantQuery = user?._id
      ? { quizRoom: room._id, user: user._id }
      : { quizRoom: room._id, temporaryUsername };

    console.log(
      "Looking for existing participant with query:",
      participantQuery
    );

    participant = await Participant.findOne(participantQuery)
      .populate("remainingQuestions")
      .populate("answeredQuestions.questionId");

    if (participant) {
      console.log("Found existing participant:", {
        participantId: participant._id,
        remainingQuestions: participant.remainingQuestions?.length,
        answeredQuestions: participant.answeredQuestions?.length,
        userId: participant.user,
      });

      // Đảm bảo chúng ta có câu hỏi để trả về
      const questions = [
        ...participant.remainingQuestions,
        ...(participant.answeredQuestions || []).map((a) => a.questionId),
      ];

      console.log("Returning existing questions:", {
        total: questions.length,
        remaining: participant.remainingQuestions.length,
        answered: participant.answeredQuestions.length,
      });

      return {
        success: true,
        participant,
        remainingQuestions: questions.map((q) => _formatQuestion(q)),
        answeredQuestions: participant.answeredQuestions.map(
          (a) => a.questionId
        ),
        endTime: room.endTime,
        timeRemaining: room.timeRemaining,
        progress: {
          answered: participant.answeredQuestions.length,
          total: questions.length,
        },
      };
    }

    console.log("No existing participant found, creating new one...");

    // Nếu chưa tham gia, tạo bộ câu hỏi mới
    if (!quiz.questionBankQueries || quiz.questionBankQueries.length === 0) {
      console.log("Quiz has no question bank queries");
      throw new Error("Quiz không có tiêu chí ngân hàng câu hỏi");
    }

    const allQuestions = [];
    console.log("Processing question bank queries:", quiz.questionBankQueries);

    for (const criteria of quiz.questionBankQueries) {
      const { questionBankId, difficulty, limit } = criteria;
      console.log("Processing criteria:", {
        bankId: questionBankId,
        difficulty,
        limit,
      });

      const filter = {
        examId: new mongoose.Types.ObjectId(questionBankId.toString()),
      };
      if (Array.isArray(difficulty) && difficulty.length > 0) {
        filter.difficulty = { $in: difficulty };
      }

      const matched = await Question.find(filter);
      console.log(
        `Found ${matched.length} matching questions for bank ${questionBankId}`
      );

      const shuffled = matched.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, limit);
      console.log(
        `Selected ${selected.length} questions from bank ${questionBankId}`
      );

      allQuestions.push(...selected);
    }

    const questions = allQuestions.sort(() => 0.5 - Math.random());
    console.log(`Final question set has ${questions.length} questions`);

    // Tạo participant mới với bộ câu hỏi đã trộn
    const newParticipant = {
      quizRoom: room._id,
      user: user?._id,
      userNameId: user?.userName,
      temporaryUsername:
        temporaryUsername || `Guest_${Math.random().toString(36).substr(2, 9)}`,
      isLoggedIn: !!user,
      deviceInfo,
      connectionId: socket.id,
      remainingQuestions: questions.map((q) => q._id),
      answeredQuestions: [],
    };

    console.log("Creating new participant:", {
      userId: newParticipant.user,
      questionCount: newParticipant.remainingQuestions.length,
    });

    participant = await Participant.create(newParticipant);

    // Đảm bảo người chơi nằm trong danh sách participants của room
    if (!room.participants.includes(participant._id)) {
      console.log("Adding participant to room's participant list");
      room.participants.push(participant._id);
      await room.save();
    }

    console.log("Successfully created new participant:", {
      participantId: participant._id,
      questionCount: questions.length,
    });

    return {
      success: true,
      participant,
      remainingQuestions: questions.map((q) => _formatQuestion(q)),
      answeredQuestions: [],
      endTime: room.endTime,
      timeRemaining: room.timeRemaining,
      progress: {
        answered: 0,
        total: questions.length,
      },
    };
  } catch (error) {
    console.error("Error in joinRoom:", error);
    return {
      success: false,
      message: error.message,
    };
  }
}

// Xử lý khi người dùng mất kết nối
async function handleDisconnect(connectionId) {
  try {
    const participant = await Participant.findOne({ connectionId });
    if (participant) {
      participant.connectionId = null;
      participant.lastActive = new Date();
      await participant.save();
    }
    return true;
  } catch (error) {
    // console.error("Lỗi khi xử lý ngắt kết nối:", error);
    return false;
  }
}

// Lấy thông tin khi reload lại trang
async function getParticipantStatus(participantId) {
  try {
    const participant = await Participant.findById(participantId)
      .populate("remainingQuestions")
      .populate("answeredQuestions.questionId");

    if (!participant) {
      throw new Error("Người tham gia không tồn tại");
    }

    return {
      success: true,
      data: {
        quizRoom: participant.quizRoom,
        currentQuestion:
          participant.remainingQuestions[0] ||
          participant.answeredQuestions[
            participant.answeredQuestions.length - 1
          ]?.questionId,
        remainingQuestions: participant.remainingQuestions,
        answeredQuestions: participant.answeredQuestions.map(
          (aq) => aq.questionId
        ),
        progress: {
          answered: participant.answeredQuestions.length,
          total:
            participant.answeredQuestions.length +
            participant.remainingQuestions.length,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
}

export const getUserInfo = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const clerkApiUrl = process.env.CLERK_API_URL || "https://api.clerk.com/v1";
    const response = await fetch(`${clerkApiUrl}/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user data: ${response.statusText}`);
    }

    const userData = await response.json();

    res.json({
      success: true,
      data: {
        _id: userId,
        name: `${userData.first_name} ${userData.last_name}`,
        imageUrl: userData.image_url,
      },
    });
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user information",
      error: error.message,
    });
  }
};

// Update getParticipantStatusByUserId to return full question data
export const getParticipantStatusByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { roomId } = req.query;

    if (!userId || !roomId) {
      return res.status(400).json({
        success: false,
        message: "Both userId and roomId are required",
      });
    }

    console.log(
      `Getting participant status for user ${userId} in room ${roomId}`
    );

    const participant = await Participant.findOne({
      quizRoom: roomId,
      user: userId,
    })
      .populate({
        path: "remainingQuestions",
        model: "Question",
        select:
          "_id questionText questionType timePerQuestion scorePerQuestion difficulty options dragDropPairs answers",
      })
      .populate({
        path: "answeredQuestions.questionId",
        model: "Question",
        select:
          "_id questionText questionType timePerQuestion scorePerQuestion difficulty options dragDropPairs answers",
      });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "Participant not found",
      });
    }

    console.log("Found participant with questions:", {
      remainingCount: participant.remainingQuestions?.length,
      answeredCount: participant.answeredQuestions?.length,
      sampleQuestion: JSON.stringify(
        participant.remainingQuestions[0],
        null,
        2
      ),
    });

    // Combine remaining and answered questions to maintain order
    const allQuestions = [
      ...participant.remainingQuestions,
      ...(participant.answeredQuestions || []).map((a) => a.questionId),
    ].filter((q) => q); // Filter out any null/undefined questions

    // Format all questions to hide answers
    const formattedQuestions = allQuestions
      .map((q) => {
        if (!q) {
          console.warn("Encountered null/undefined question while formatting");
          return null;
        }

        // For multiple choice questions, use answers array as options
        let options = [];
        if (
          q.questionType === "multipleChoices" ||
          q.questionType === "dropdown"
        ) {
          options = q.answers.map((answer) => ({
            _id: answer._id,
            text: answer.text,
            isCorrect: answer.isCorrect, // Keep isCorrect for answer validation
          }));
        } else {
          options = q.options || [];
        }

        const formatted = {
          _id: q._id,
          questionText: q.questionText,
          questionType: q.questionType,
          timePerQuestion: q.timePerQuestion,
          scorePerQuestion: q.scorePerQuestion,
          difficulty: q.difficulty,
          options: options,
          dragDropPairs: q.dragDropPairs || [],
          answers:
            q.answers?.map((a) => ({
              _id: a._id,
              text: a.text,
              isCorrect: a.isCorrect, // Keep isCorrect for answer validation
            })) || [],
        };

        return formatted;
      })
      .filter((q) => q); // Remove any null results

    console.log("Formatted questions sample:", {
      count: formattedQuestions.length,
      firstQuestion: JSON.stringify(formattedQuestions[0], null, 2),
    });

    return res.json({
      success: true,
      data: {
        remainingQuestions: formattedQuestions,
        answeredQuestions: participant.answeredQuestions.map(
          (a) => a.questionId
        ),
        progress: {
          answered: participant.answeredQuestions.length,
          total: allQuestions.length,
        },
      },
    });
  } catch (error) {
    console.error("Error getting participant status:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export { joinRoom, handleDisconnect, getParticipantStatus, _formatQuestion };
