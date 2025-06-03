import Participant from "../models/Participant.js";
import QuizRoom from "../models/QuizRoom.js";
import Question from "../models/Question.js";
import mongoose from "mongoose";
import fetch from "node-fetch";
import Submission from "../models/Submission.js";

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
    const room = await QuizRoom.findOne({ roomCode })
      .populate("quiz")
      .populate({
        path: "questionOrder",
        model: "Question",
        select:
          "_id questionText questionType timePerQuestion scorePerQuestion difficulty options dragDropPairs answers",
      });

    if (!room) {
      console.log("Room not found:", roomCode);
      throw new Error("Phòng thi không tồn tại hoặc chưa mở");
    }

    // Kiểm tra người chơi đã tham gia chưa
    let participant;
    let participantQuery;

    if (user?._id) {
      // Nếu có user ID, tìm theo user ID và trạng thái
      participantQuery = {
        quizRoom: room._id,
        user: user._id,
        status: { $ne: "completed" }, // Không lấy participant đã hoàn thành
      };
    } else if (temporaryUsername) {
      // Nếu không có user ID nhưng có temporary username, tìm theo temporary username
      participantQuery = {
        quizRoom: room._id,
        temporaryUsername,
        isLoggedIn: false,
        status: { $ne: "completed" }, // Không lấy participant đã hoàn thành
      };
    } else {
      throw new Error("Thiếu thông tin người dùng");
    }

    // Tìm participant và populate submissions
    participant = await Participant.findOne(participantQuery).populate({
      path: "answeredQuestions.submissionId",
      model: "Submission",
      select: "answer answerId isCorrect score status",
    });

    // Nếu không tìm thấy participant hoạt động, kiểm tra xem có participant cũ không
    if (!participant) {
      const oldParticipant = await Participant.findOne({
        quizRoom: room._id,
        $or: [{ user: user?._id }, { temporaryUsername, isLoggedIn: false }],
        status: "completed",
      });

      if (oldParticipant) {
        // Nếu có participant cũ đã hoàn thành, tạo participant mới
        console.log("Found completed participant, creating new one");
      }
    }

    if (participant) {
      console.log("Found existing participant:", {
        participantId: participant._id,
        remainingQuestions: participant.remainingQuestions?.length,
        answeredQuestions: participant.answeredQuestions?.length,
      });

      // Cập nhật thông tin kết nối mới
      participant.connectionId = socket.id;
      participant.lastActive = new Date();
      participant.deviceInfo = deviceInfo;

      // Lấy submissions hiện có
      const submissions = await Submission.find({
        participant: participant._id,
      }).sort({ createdAt: -1 });

      // Tạo map câu hỏi đã trả lời và trạng thái
      const questionAnswerMap = new Map();
      submissions.forEach((sub) => {
        if (
          !questionAnswerMap.has(sub.question.toString()) ||
          sub.status === "final"
        ) {
          questionAnswerMap.set(sub.question.toString(), {
            answerId: sub.answerId,
            isCorrect: sub.isCorrect,
            score: sub.score,
            status: sub.status,
          });
        }
      });

      // Lấy chi tiết câu hỏi theo thứ tự đã lưu trong participant.remainingQuestions
      const questions = await Question.find({
        _id: { $in: participant.remainingQuestions },
      });

      // Sắp xếp câu hỏi theo thứ tự đã lưu
      const orderedQuestions = participant.remainingQuestions
        .map((qId) =>
          questions.find((q) => q._id.toString() === qId.toString())
        )
        .filter(Boolean);

      // Phân loại câu hỏi thành remaining và answered dựa trên submissions
      const remainingQuestions = orderedQuestions.filter((q) => {
        const answer = questionAnswerMap.get(q._id.toString());
        return !answer || answer.status !== "final";
      });

      // Cập nhật remainingQuestions của participant
      participant.remainingQuestions = remainingQuestions.map((q) => q._id);
      await participant.save();

      // Format câu hỏi để trả về
      const formattedQuestions = remainingQuestions.map((q) => {
        // Lấy submission cho câu hỏi này nếu có
        const answer = questionAnswerMap.get(q._id.toString());

        return {
          _id: q._id,
          questionText: q.questionText,
          questionType: q.questionType,
          timePerQuestion: q.timePerQuestion,
          scorePerQuestion: q.scorePerQuestion,
          difficulty: q.difficulty,
          options:
            q.questionType === "multipleChoices" ||
            q.questionType === "dropdown"
              ? q.answers.map((a) => ({
                  _id: a._id,
                  text: a.text,
                  isCorrect: false, // Hide correct answers
                }))
              : q.options || [],
          dragDropPairs: q.dragDropPairs || [],
          answers:
            q.answers?.map((a) => ({
              _id: a._id,
              text: a.text,
              isCorrect: false, // Hide correct answers
            })) || [],
          selectedAnswerId: answer?.answerId || null, // Thêm selectedAnswerId
          submission: answer
            ? {
                isCorrect: answer.isCorrect,
                score: answer.score,
                status: answer.status,
              }
            : null,
        };
      });

      return {
        success: true,
        participant,
        remainingQuestions: formattedQuestions,
        answeredQuestions: participant.answeredQuestions,
        endTime: room.endTime,
        timeRemaining: room.timeRemaining,
        progress: {
          answered: participant.answeredQuestions.length,
          total: room.questionOrder.length,
          score: participant.score || 0,
        },
        submissions: Array.from(questionAnswerMap.entries()).map(
          ([questionId, data]) => ({
            questionId,
            ...data,
          })
        ),
      };
    }

    // Nếu không tìm thấy participant, tạo mới
    console.log("Creating new participant");

    // Tạo bản sao và trộn câu hỏi cho participant mới
    const shuffledQuestions = [...room.questionOrder];
    for (let i = shuffledQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledQuestions[i], shuffledQuestions[j]] = [
        shuffledQuestions[j],
        shuffledQuestions[i],
      ];
    }

    const newParticipant = {
      quizRoom: room._id,
      user: user?._id,
      userNameId: user?.userName,
      temporaryUsername:
        temporaryUsername || `Guest_${Math.random().toString(36).substr(2, 9)}`,
      isLoggedIn: !!user,
      deviceInfo,
      connectionId: socket.id,
      remainingQuestions: shuffledQuestions.map((q) => q._id), // Sử dụng thứ tự câu hỏi đã trộn
      answeredQuestions: [],
      score: 0,
      status: "active", // Thêm trạng thái mặc định
    };

    participant = await Participant.create(newParticipant);

    // Thêm participant vào room nếu chưa có
    if (!room.participants.includes(participant._id)) {
      room.participants.push(participant._id);
      await room.save();
    }

    // Format câu hỏi cho participant mới theo thứ tự đã trộn
    const formattedQuestions = shuffledQuestions.map((q) => ({
      _id: q._id,
      questionText: q.questionText,
      questionType: q.questionType,
      timePerQuestion: q.timePerQuestion,
      scorePerQuestion: q.scorePerQuestion,
      difficulty: q.difficulty,
      options:
        q.questionType === "multipleChoices" || q.questionType === "dropdown"
          ? q.answers.map((a) => ({
              _id: a._id,
              text: a.text,
              isCorrect: false,
            }))
          : q.options || [],
      dragDropPairs: q.dragDropPairs || [],
      answers:
        q.answers?.map((a) => ({
          _id: a._id,
          text: a.text,
          isCorrect: false,
        })) || [],
    }));

    return {
      success: true,
      participant,
      remainingQuestions: formattedQuestions,
      answeredQuestions: [],
      endTime: room.endTime,
      timeRemaining: room.timeRemaining,
      progress: {
        answered: 0,
        total: formattedQuestions.length,
        score: 0,
      },
      submissions: [],
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

// Update getParticipantStatusByUserId function
export const getParticipantStatusByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { roomId } = req.query;

    console.log(
      `Getting participant status for user ${userId} in room ${roomId}`
    );

    // Lấy thông tin room
    const room = await QuizRoom.findById(roomId);
    if (!room) {
      console.log("Room not found");
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // Tìm participant và populate submissions
    const participant = await Participant.findOne({
      quizRoom: roomId,
      user: userId,
    }).populate({
      path: "answeredQuestions.submissionId",
      model: "Submission",
      select: "answer answerId isCorrect score status",
    });

    if (!participant) {
      console.log("Participant not found");
      return res.status(404).json({
        success: false,
        message: "Participant not found",
      });
    }

    // Lấy submissions
    const submissions = await Submission.find({
      participant: participant._id,
    }).sort({ createdAt: -1 });

    // Tạo map câu hỏi đã trả lời và trạng thái
    const questionAnswerMap = new Map();
    submissions.forEach((sub) => {
      if (
        !questionAnswerMap.has(sub.question.toString()) ||
        sub.status === "final"
      ) {
        questionAnswerMap.set(sub.question.toString(), {
          answerId: sub.answerId,
          isCorrect: sub.isCorrect,
          score: sub.score,
          status: sub.status,
        });
      }
    });

    // Lấy chi tiết câu hỏi theo thứ tự đã lưu trong participant.remainingQuestions
    const questions = await Question.find({
      _id: {
        $in: [
          ...participant.remainingQuestions,
          ...participant.answeredQuestions.map((aq) => aq.questionId),
        ],
      },
    });

    // Sắp xếp câu hỏi theo thứ tự đã lưu
    const orderedQuestions = participant.remainingQuestions
      .map((qId) => questions.find((q) => q._id.toString() === qId.toString()))
      .filter(Boolean);

    // Format câu hỏi để trả về
    const formattedQuestions = orderedQuestions.map((q) => {
      const answer = questionAnswerMap.get(q._id.toString());
      return {
        _id: q._id,
        questionText: q.questionText,
        questionType: q.questionType,
        timePerQuestion: q.timePerQuestion,
        scorePerQuestion: q.scorePerQuestion,
        difficulty: q.difficulty,
        options:
          q.questionType === "multipleChoices" || q.questionType === "dropdown"
            ? q.answers.map((a) => ({
                _id: a._id,
                text: a.text,
                isCorrect: false,
              }))
            : q.options || [],
        dragDropPairs: q.dragDropPairs || [],
        answers:
          q.answers?.map((a) => ({
            _id: a._id,
            text: a.text,
            isCorrect: false,
          })) || [],
        selectedAnswerId: answer?.answerId || null,
        submission: answer
          ? {
              isCorrect: answer.isCorrect,
              score: answer.score,
              status: answer.status,
            }
          : null,
      };
    });

    // Format answered questions với submission data
    const formattedAnsweredQuestions = participant.answeredQuestions
      .filter((aq) => {
        const submission = questionAnswerMap.get(aq.questionId.toString());
        return submission && submission.status === "final";
      })
      .map((aq) => {
        const submission = questionAnswerMap.get(aq.questionId.toString());
        const question = questions.find(
          (q) => q._id.toString() === aq.questionId.toString()
        );

        return {
          questionId: aq.questionId,
          submissionId: aq.submissionId,
          answerId: submission.answerId,
          isCorrect: submission.isCorrect,
          score: submission.score,
          questionData: question
            ? {
                questionText: question.questionText,
                questionType: question.questionType,
                options:
                  question.questionType === "multipleChoices" ||
                  question.questionType === "dropdown"
                    ? question.answers.map((a) => ({
                        _id: a._id,
                        text: a.text,
                        isCorrect: false,
                      }))
                    : question.options || [],
                answers:
                  question.answers?.map((a) => ({
                    _id: a._id,
                    text: a.text,
                    isCorrect: false,
                  })) || [],
              }
            : null,
        };
      });

    // Tính lại tổng điểm từ submissions
    const totalScore = submissions
      .filter((s) => s.status === "final")
      .reduce((sum, s) => sum + (s.score || 0), 0);

    return res.json({
      success: true,
      data: {
        remainingQuestions: formattedQuestions,
        answeredQuestions: formattedAnsweredQuestions,
        progress: {
          answered: formattedAnsweredQuestions.length,
          total: questions.length,
          score: totalScore,
        },
        isCompleted: formattedAnsweredQuestions.length === questions.length,
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
