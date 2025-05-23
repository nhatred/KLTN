import Participant from "../models/Participant.js";
import QuizRoom from "../models/QuizRoom.js";
import Question from "../models/Question.js";
import Quiz from "../models/Quiz.js";
import fetch from "node-fetch";

// Tham gia phong thi
async function joinRoom(socket, data) {
  console.log("=== START JOIN ROOM ===");
  try {
    const { roomCode, temporaryUsername, userId, deviceInfo } = data;

    console.log("Joining room with data:", {
      roomCode,
      userId,
      temporaryUsername,
    });

    // Tìm phòng thi và populate quiz với questions
    const room = await QuizRoom.findOne({ roomCode }).populate({
      path: "quiz",
      populate: {
        path: "questions",
      },
    });

    if (!room) {
      throw new Error("Phòng thi không tồn tại");
    }

    console.log("Found room:", {
      roomId: room._id,
      roomCode: room.roomCode,
      status: room.status,
      quiz: room.quiz,
      id: room.id,
    });

    // Kiểm tra quiz từ room đã được populate
    if (!room.quiz) {
      console.log("Quiz not found in room, trying to find quiz directly");
      // Thử tìm quiz trực tiếp từ id của room
      const quiz = await Quiz.findById(room.id);
      if (!quiz) {
        console.log(
          "Quiz still not found. Room details:",
          JSON.stringify(room, null, 2)
        );
        throw new Error("Không tìm thấy bài thi");
      }
      room.quiz = quiz;
    }

    console.log("Found quiz:", {
      quizId: room.quiz._id,
      questionsCount: room.quiz.questions?.length,
      questions: room.quiz.questions,
    });

    // Kiểm tra người dùng đã tham gia chưa
    let participant;

    if (userId) {
      participant = await Participant.findOne({
        quizRoom: room._id,
        user: userId,
      });
    } else {
      participant = await Participant.findOne({
        quizRoom: room._id,
        temporaryUsername,
      });
    }

    // Tạo mới nếu chưa tham gia
    if (!participant) {
      // Xáo trộn câu hỏi
      const shuffledQuestions = [...room.quiz.questions].sort(
        () => 0.5 - Math.random()
      );

      // Tạo participant mới với đầy đủ thông tin
      const participantData = {
        quizRoom: room._id,
        quiz: room.quiz._id,
        user: userId || "anonymous",
        temporaryUsername,
        isLoggedIn: !!userId,
        deviceInfo,
        connectionId: socket.id,
        remainingQuestions: shuffledQuestions,
        answeredQuestions: [],
      };

      console.log("Creating new participant with data:", {
        ...participantData,
        quizId: participantData.quiz?.toString(),
        quizRoomId: participantData.quizRoom?.toString(),
        userId: participantData.user,
      });

      // Tạo và lưu participant
      try {
        participant = await Participant.create(participantData);
        console.log("Participant created successfully:", {
          participantId: participant._id,
          quizId: participant.quiz?.toString(),
          quizRoomId: participant.quizRoom?.toString(),
          userId: participant.user,
        });
      } catch (createError) {
        console.error("Error creating participant:", createError);
        throw new Error("Lỗi khi tạo người tham gia: " + createError.message);
      }
    } else {
      // Cập nhật thông tin nếu đã tham gia
      participant.connectionId = socket.id;
      participant.lastActive = new Date();
      participant.deviceInfo = deviceInfo;
      await participant.save();
    }

    // Thêm vào phòng nếu chưa có
    if (!room.participants.includes(participant._id)) {
      room.participants.push(participant._id);
      await room.save();
    }

    // Lấy danh sách câu hỏi chưa làm
    const remainingQuestions = await Question.find({
      _id: { $in: participant.remainingQuestions },
    });

    // Lấy danh sách câu hỏi đã làm (chỉ ID)
    const answeredQuestionIds = participant.answeredQuestions.map(
      (q) => q.questionId
    );

    let userInfo = {
      _id: userId || "anonymous",
      name: temporaryUsername || "Anonymous",
      imageUrl:
        "https://images.unsplash.com/photo-1574232877776-2024ccf7c09e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fHVzZXJ8ZW58MHx8MHx8fDA%3D",
    };

    // Lấy thông tin user từ Clerk nếu có userId
    if (userId && userId !== "anonymous") {
      try {
        const clerkApiUrl =
          process.env.CLERK_API_URL || "https://api.clerk.com/v1";
        const userResponse = await fetch(`${clerkApiUrl}/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          userInfo = {
            _id: userId,
            name: `${userData.first_name} ${userData.last_name}`,
            imageUrl: userData.image_url,
          };
        }
      } catch (error) {
        console.error("Error fetching user data from Clerk:", error);
      }
    }

    // Thêm thông tin user vào participant
    participant = {
      ...participant.toObject(),
      user: userInfo,
    };

    console.log("=== END JOIN ROOM ===");
    return {
      success: true,
      participant,
      remainingQuestions: remainingQuestions.map((q) => _formatQuestion(q)),
      answeredQuestions: answeredQuestionIds,
      endTime: room.endTime,
      timeRemaining: room.timeRemaining,
      progress: {
        answered: participant.answeredQuestions.length,
        total: room.quiz.questions.length,
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
