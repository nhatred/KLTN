import Submission from "../models/Submission.js";
import Participant from "../models/Participant.js";
import Question from "../models/Question.js";

// Xử lý nộp bài cho một câu hỏi
async function submitAnswer(socket, data) {
  try {
    const { participantId, questionId, answer, clientTimestamp } = data;

    const participant = await Participant.findById(participantId).populate(
      "quizRoom"
    );
    if (!participant) throw new Error("Người tham gia không tồn tại");

    // Kiểm tra câu hỏi có trong remainingQuestions không
    const questionExists = participant.remainingQuestions.some((q) =>
      q.equals(questionId)
    );
    if (!questionExists) {
      throw new Error("Câu hỏi không hợp lệ hoặc đã được làm");
    }

    const question = await Question.findById(questionId);
    if (!question) throw new Error("Câu hỏi không tồn tại");

    // Tính điểm
    const { isCorrect, score } = await _evaluateAnswer(question, answer);

    // Tạo submission
    const submission = new Submission({
      participant: participant._id,
      quizRoom: participant.quizRoom._id,
      question: question._id,
      questionType: question.questionType,
      answer,
      isCorrect,
      score,
      timeToAnswer: (new Date() - new Date(clientTimestamp)) / 1000,
      clientTimestamp,
    });

    await submission.save();

    // Xóa câu hỏi khỏi remaining và thêm vào answered
    participant.remainingQuestions = participant.remainingQuestions.filter(
      (q) => !q.equals(questionId)
    );

    participant.answeredQuestions.push({
      questionId: question._id,
      submissionId: submission._id,
    });

    participant.score += score;
    participant.lastActive = new Date();
    await participant.save();

    // Lấy danh sách câu hỏi còn lại
    const remainingQuestions = await Question.find({
      _id: { $in: participant.remainingQuestions },
    });

    // Gửi sự kiện cập nhật về client
    socket.broadcast
      .to(`participant_${participant._id}`)
      .emit("questionsUpdate", {
        remaining: remainingQuestions.map((q) => ({
          _id: q._id,
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options,
          difficulty: q.difficulty,
        })),
        answered: participant.answeredQuestions.map((aq) => aq.questionId),
        progress: {
          answered: participant.answeredQuestions.length,
          total:
            participant.answeredQuestions.length +
            participant.remainingQuestions.length,
        },
        currentQuestion: remainingQuestions[0] || null,
      });

    socket.emit("questionsUpdate", {
      remaining: remainingQuestions.map((q) => ({
        _id: q._id,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options,
        difficulty: q.difficulty,
      })),
      answered: participant.answeredQuestions.map((aq) => aq.questionId),
      progress: {
        answered: participant.answeredQuestions.length,
        total:
          participant.answeredQuestions.length +
          participant.remainingQuestions.length,
      },
      currentQuestion: remainingQuestions[0] || null,
    });
    return { success: true };
  } catch (error) {
    console.error("Lỗi khi nộp bài:", error);
    return { success: false, message: error.message };
  }
}

// Đánh giá câu trả lời
async function _evaluateAnswer(question, userAnswerId) {
  let isCorrect = false;
  let score = 0;

  switch (question.questionType) {
    case "multipleChoices":
    case "dropdown":
      // Đối với câu hỏi chọn đáp án, so sánh theo ID
      const correctAnswer = question.answers.find((a) => a.isCorrect);
      isCorrect =
        correctAnswer && correctAnswer._id.toString() === userAnswerId;
      score = isCorrect ? question.scorePerQuestion || 1 : 0;
      break;

    case "fillInBlank":
      // Đối với điền vào chỗ trống
      isCorrect = question.answers.some(
        (a) => a.text.toLowerCase() === userAnswerId.toLowerCase()
      );
      score = isCorrect ? question.scorePerQuestion || 1 : 0;
      break;

    case "paragraph":
      // Đối với câu hỏi tự luận (chưa chấm điểm tự động)
      isCorrect = false;
      score = 0;
      break;

    case "dragAndDrop":
      // Đối với kéo thả
      const correctPairs = question.dragDropPairs;
      isCorrect = correctPairs.every((pair) =>
        userAnswerId.some(
          (ua) =>
            ua.draggable === pair.draggable && ua.dropZone === pair.dropZone
        )
      );
      score = isCorrect ? question.scorePerQuestion || 1 : 0;
      break;

    default:
      throw new Error("Loại câu hỏi không được hỗ trợ");
  }

  return { isCorrect, score };
}

// Đồng bộ bài làm khi kết nối lại
async function syncSubmissions(participantId) {
  try {
    const participant = await Participant.findById(participantId)
      .populate("submissions")
      .populate("quizRoom");

    if (!participant) {
      throw new Error("Người tham gia không tồn tại");
    }

    // Lấy các câu hỏi đã hoàn thành
    const completedQuestions = participant.completedQuestions
      .filter((q) => q.submitted)
      .map((q) => q.questionId);

    // Lấy câu hỏi hiện tại
    const currentQuestion =
      participant.completedQuestions[participant.currentQuestionIndex]
        .questionId;

    return {
      success: true,
      data: {
        completedQuestions,
        currentQuestion,
        progress: {
          current: participant.currentQuestionIndex + 1,
          total: participant.completedQuestions.length,
        },
        roomStatus: participant.quizRoom.status,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
}

// Add new submitAnswerRoom function
async function submitAnswerRoom(socket, data) {
  try {
    const { userId, roomId, questionId, answerId, clientTimestamp } = data;

    console.log("Processing answer submission:", {
      userId,
      roomId,
      questionId,
      answerId,
      clientTimestamp,
    });

    // Find participant by userId and roomId
    const participant = await Participant.findOne({
      user: userId,
      quizRoom: roomId,
    })
      .populate("quizRoom")
      .populate({
        path: "remainingQuestions",
        select:
          "_id questionText questionType answers options difficulty scorePerQuestion",
      });

    if (!participant) {
      throw new Error("Không tìm thấy thông tin người tham gia");
    }

    console.log("Found participant:", {
      participantId: participant._id,
      remainingQuestions: participant.remainingQuestions?.length,
    });

    // Kiểm tra câu hỏi có trong remainingQuestions không
    const question = participant.remainingQuestions.find(
      (q) => q._id.toString() === questionId
    );
    if (!question) {
      throw new Error("Câu hỏi không hợp lệ hoặc đã được làm");
    }

    console.log("Found question:", {
      questionId: question._id,
      type: question.questionType,
      answers: question.answers?.length,
    });

    // Tính điểm
    const { isCorrect, score } = await _evaluateAnswer(question, answerId);

    console.log("Evaluated answer:", { isCorrect, score });

    // Tạo submission
    const submission = new Submission({
      participant: participant._id,
      quizRoom: participant.quizRoom._id,
      question: question._id,
      questionType: question.questionType,
      answerId,
      answer:
        question.answers.find((a) => a._id.toString() === answerId)?.text || "",
      isCorrect,
      score,
      timeToAnswer: (new Date() - new Date(clientTimestamp)) / 1000,
      clientTimestamp,
    });

    await submission.save();
    console.log("Saved submission:", submission._id);

    // Xóa câu hỏi khỏi remaining và thêm vào answered
    participant.remainingQuestions = participant.remainingQuestions.filter(
      (q) => q._id.toString() !== questionId
    );

    participant.answeredQuestions.push({
      questionId: question._id,
      submissionId: submission._id,
      answerId: answerId,
    });

    participant.score += score;
    participant.lastActive = new Date();
    await participant.save();

    // Lấy danh sách câu hỏi còn lại với đầy đủ thông tin
    const remainingQuestions = participant.remainingQuestions.map((q) => ({
      _id: q._id,
      questionText: q.questionText,
      questionType: q.questionType,
      options: q.options,
      difficulty: q.difficulty,
      answers: q.answers.map((a) => ({
        _id: a._id,
        text: a.text,
        isCorrect: false, // Hide correct answers
      })),
    }));

    const updateData = {
      remaining: remainingQuestions,
      answered: participant.answeredQuestions.map((aq) => ({
        questionId: aq.questionId,
        answerId: aq.answerId,
      })),
      progress: {
        answered: participant.answeredQuestions.length,
        total: participant.answeredQuestions.length + remainingQuestions.length,
        score: participant.score,
      },
      currentQuestion: remainingQuestions[0] || null,
      lastSubmission: {
        questionId,
        isCorrect,
        score,
      },
    };

    // Gửi sự kiện cập nhật về client
    socket.broadcast
      .to(`participant_${participant._id}`)
      .emit("questionsUpdate", updateData);
    socket.emit("questionsUpdate", updateData);

    return {
      success: true,
      data: updateData,
    };
  } catch (error) {
    console.error("Lỗi khi nộp bài:", error);
    return { success: false, message: error.message };
  }
}

// Add saveParticipationResult function
async function saveParticipationResult(req, res) {
  try {
    console.log("Received participation data:", req.body);
    const { roomId, userId, score, answers, stats } = req.body;

    if (!roomId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: roomId and userId",
      });
    }

    // Find participant
    const participant = await Participant.findOne({
      user: userId,
      quizRoom: roomId,
    });

    if (!participant) {
      console.log("Participant not found for:", { userId, roomId });
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin người tham gia",
      });
    }

    console.log("Found participant:", participant._id);

    // Update participant's score and stats
    participant.score = score;
    participant.finalAnswers = answers;
    participant.stats = stats;
    participant.completedAt = new Date();
    participant.status = "completed";

    await participant.save();
    console.log("Saved participant results:", {
      participantId: participant._id,
      score,
      stats,
    });

    // Return success response
    return res.json({
      success: true,
      data: {
        participantId: participant._id,
        score,
        stats,
      },
    });
  } catch (error) {
    console.error("Error saving participation result:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi lưu kết quả tham gia",
    });
  }
}

export const getSubmissionsByParticipant = async (req, res) => {
  try {
    const { participantId } = req.params;

    const submissions = await Submission.find({ participant: participantId })
      .populate("question", "questionText answers")
      .sort({ createdAt: 1 })
      .lean();

    res.json({
      success: true,
      submissions,
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch submissions",
    });
  }
};

export {
  submitAnswer,
  submitAnswerRoom,
  _evaluateAnswer,
  syncSubmissions,
  saveParticipationResult,
};
