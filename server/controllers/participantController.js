import Participant from "../models/Participant.js";
import QuizRoom from "../models/QuizRoom.js";
import Question from "../models/Question.js";
import mongoose from "mongoose";
import Quiz from "../models/Quiz.js";
import fetch from "node-fetch";

// Tham gia phong thi
async function joinRoom(socket, data) {
  try {
    const { roomCode, temporaryUsername, user, deviceInfo } = data;

    // Tìm phòng thi và lấy thông tin quiz
    const room = await QuizRoom.findOne({ roomCode }).populate("quiz");
    if (!room) {
      throw new Error("Phòng thi không tồn tại hoặc chưa mở");
    }

    const quiz = room.quiz;

    // Kiểm tra người chơi đã tham gia chưa
    let participant;
    if (user?._id) {
      participant = await Participant.findOne({
        quizRoom: room._id,
        user: user._id,
      });
    } else {
      participant = await Participant.findOne({
        quizRoom: room._id,
        temporaryUsername,
      });
    }

    // Nếu chưa tham gia, tạo mới
    if (!participant) {
      let questions = [];

      if (!quiz.questionBankQueries || quiz.questionBankQueries.length === 0) {
        throw new Error("Quiz không có tiêu chí ngân hàng câu hỏi");
      }

      const allQuestions = [];
      let a = 0;

      for (const criteria of quiz.questionBankQueries) {
        const { questionBankId, difficulty, limit } = criteria;

        const filter = {
          questionBankId: new mongoose.Types.ObjectId(questionBankId),
        };
        if (Array.isArray(difficulty) && difficulty.length > 0) {
          filter.difficulty = { $in: difficulty };
        }
        console.log(`filter: ${(a = a + 1)}`, filter);
        const matched = await Question.find(filter);
        const shuffled = matched.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, limit);

        allQuestions.push(...selected);
      }

      const shuffledAll = allQuestions.sort(() => 0.5 - Math.random());
      questions = shuffledAll;

      // Tạo participant mới
      participant = new Participant({
        quizRoom: room._id,
        user: user?._id,
        userNameId: user?.userName,
        temporaryUsername,
        isLoggedIn: !!user,
        deviceInfo,
        connectionId: socket.id,
        remainingQuestions: questions.map((q) => q._id),
        answeredQuestions: [],
      });
    } else {
      // Nếu đã tham gia, chỉ cập nhật thông tin kết nối
      participant.connectionId = socket.id;
      participant.lastActive = new Date();
      participant.deviceInfo = deviceInfo;
    }

    await participant.save();

    // Đảm bảo người chơi nằm trong danh sách participants
    if (!room.participants.includes(participant._id)) {
      room.participants.push(participant._id);
      await room.save();
    }

    // Lấy danh sách câu hỏi chưa làm
    const remainingQuestions = await Question.find({
      _id: { $in: participant.remainingQuestions },
    });

    const answeredQuestionIds = participant.answeredQuestions.map(
      (q) => q.questionId
    );

    return {
      success: true,
      participant,
      remainingQuestions: remainingQuestions.map((q) =>
        this._formatQuestion(q)
      ),
      answeredQuestions: answeredQuestionIds,
      endTime: room.endTime,
      timeRemaining: room.timeRemaining,
      progress: {
        answered: participant.answeredQuestions.length,
        total: participant.remainingQuestions.length,
      },
    };
  } catch (error) {
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
    console.error("Lỗi khi xử lý ngắt kết nối:", error);
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

// format lại cho phần câu hỏi còn lại
async function _formatQuestion(question) {
  const formatted = {
    _id: question._id,
    questionText: question.questionText,
    questionType: question.questionType,
    difficulty: question.difficulty,
    options: question.options,
    dragDropPairs: question.dragDropPairs,
  };

  // Ẩn đáp án đúng
  if (
    question.questionType === "multipleChoices" ||
    question.questionType === "dropdown"
  ) {
    formatted.options = question.options.map((opt) => ({ text: opt }));
  }

  return formatted;
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

export { joinRoom, handleDisconnect, getParticipantStatus, _formatQuestion };
