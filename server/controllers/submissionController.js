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
    const {
      userId,
      roomId,
      questionId,
      answerId,
      clientTimestamp,
      isLastQuestion,
    } = data;

    console.log("Processing answer submission:", {
      userId,
      roomId,
      questionId,
      answerId,
      clientTimestamp,
      isLastQuestion,
    });

    // Tìm participant hiện có
    const participant = await Participant.findOne({
      user: userId,
      quizRoom: roomId,
    }).populate("quizRoom");

    if (!participant) {
      throw new Error("Không tìm thấy thông tin người tham gia");
    }

    // Cập nhật thời gian hoạt động
    participant.lastActive = new Date();

    // Tìm submission hiện có hoặc tạo mới
    let submission = await Submission.findOne({
      participant: participant._id,
      question: questionId,
    });

    // Tính điểm cho câu trả lời
    const question = await Question.findById(questionId);
    if (!question) {
      throw new Error("Không tìm thấy câu hỏi");
    }

    const { isCorrect, score } = await _evaluateAnswer(question, answerId);

    if (submission) {
      // Nếu submission đã tồn tại, lưu vào lịch sử và cập nhật
      submission.answerHistory.push({
        answer: submission.answer,
        answerId: submission.answerId,
        isCorrect: submission.isCorrect,
        score: submission.score,
        timestamp: submission.updatedAt,
      });

      submission.answer =
        question.answers.find((a) => a._id.toString() === answerId)?.text || "";
      submission.answerId = answerId;
      submission.isCorrect = isCorrect;
      submission.score = score;
      submission.timeToAnswer = (new Date() - new Date(clientTimestamp)) / 1000;
      submission.clientTimestamp = clientTimestamp;
      submission.status = isLastQuestion ? "final" : "draft";
    } else {
      // Tạo submission mới
      submission = new Submission({
        participant: participant._id,
        quizRoom: participant.quizRoom._id,
        question: questionId,
        questionType: question.questionType,
        answerId,
        answer:
          question.answers.find((a) => a._id.toString() === answerId)?.text ||
          "",
        isCorrect,
        score,
        timeToAnswer: (new Date() - new Date(clientTimestamp)) / 1000,
        clientTimestamp,
        status: isLastQuestion ? "final" : "draft",
      });
    }

    await submission.save();
    console.log("Saved/Updated submission:", submission._id);

    // Cập nhật participant
    const answerIndex = participant.answeredQuestions.findIndex(
      (aq) => aq.questionId.toString() === questionId
    );

    if (answerIndex >= 0) {
      // Cập nhật câu trả lời hiện có
      participant.answeredQuestions[answerIndex] = {
        questionId: question._id,
        submissionId: submission._id,
        answerId: answerId,
      };
    } else {
      // Thêm câu trả lời mới
      participant.answeredQuestions.push({
        questionId: question._id,
        submissionId: submission._id,
        answerId: answerId,
      });
    }

    // Chỉ cập nhật remainingQuestions khi là submission cuối cùng
    if (isLastQuestion) {
      participant.remainingQuestions = [];
    }

    // Tính lại tổng điểm từ tất cả submissions
    const allSubmissions = await Submission.find({
      participant: participant._id,
      status: isLastQuestion ? "final" : { $in: ["draft", "final"] },
    });

    participant.score = allSubmissions.reduce(
      (total, sub) => total + (sub.score || 0),
      0
    );
    console.log("Updated participant score:", participant.score);

    await participant.save();

    // Lấy chi tiết câu hỏi theo thứ tự đã lưu trong participant.remainingQuestions
    const questions = await Question.find({
      _id: { $in: participant.remainingQuestions },
    });

    // Sắp xếp câu hỏi theo thứ tự đã lưu trong participant.remainingQuestions
    const orderedQuestions = participant.remainingQuestions
      .map((qId) => questions.find((q) => q._id.toString() === qId.toString()))
      .filter(Boolean);

    // Format câu hỏi với đáp án đã chọn
    const formattedQuestions = orderedQuestions.map((q) => {
      const answeredQuestion = participant.answeredQuestions.find(
        (aq) => aq.questionId.toString() === q._id.toString()
      );

      return {
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
        selectedAnswerId: answeredQuestion?.answerId || null,
      };
    });

    const updateData = {
      remaining: formattedQuestions,
      answered: participant.answeredQuestions.map((aq) => ({
        questionId: aq.questionId,
        answerId: aq.answerId,
      })),
      progress: {
        answered: participant.answeredQuestions.length,
        total:
          participant.remainingQuestions.length +
          participant.answeredQuestions.length,
        score: participant.score,
      },
      currentQuestion: formattedQuestions[0] || null,
      lastSubmission: {
        questionId,
        isCorrect,
        score,
        isLastQuestion,
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

// Hàm tính lại điểm của participant
async function recalculateParticipantScore(participantId) {
  const submissions = await Submission.find({
    participant: participantId,
    status: "final",
  });

  return submissions.reduce((total, sub) => total + (sub.score || 0), 0);
}

// Hàm lưu kết quả cuối cùng
async function saveParticipationResult(req, res) {
  try {
    console.log("Saving final participation result:", req.body);
    const { roomId, userId } = req.body;

    if (!roomId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: roomId and userId",
      });
    }

    // Tìm participant hiện có
    const participant = await Participant.findOne({
      user: userId,
      quizRoom: roomId,
      status: "active", // Chỉ cập nhật participant đang hoạt động
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message:
          "Không tìm thấy thông tin người tham gia hoặc bài thi đã hoàn thành",
      });
    }

    // Đánh dấu tất cả submissions là final
    await Submission.updateMany(
      { participant: participant._id, status: "draft" },
      { status: "final" }
    );

    // Tính lại điểm cuối cùng
    participant.score = await recalculateParticipantScore(participant._id);
    participant.completedAt = new Date();
    participant.status = "completed"; // Cập nhật trạng thái thành completed

    await participant.save();

    return res.json({
      success: true,
      data: {
        participantId: participant._id,
        score: participant.score,
      },
    });
  } catch (error) {
    console.error("Error saving final result:", error);
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

// Lấy kết quả bài thi
export const getQuizResults = async (req, res) => {
  try {
    const { roomId, userId } = req.query;

    if (!roomId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Missing roomId or userId",
      });
    }

    // Tìm participant
    const participant = await Participant.findOne({
      quizRoom: roomId,
      user: userId,
    }).populate("answeredQuestions.submissionId");

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "Participant not found",
      });
    }

    // Lấy tất cả submissions của participant
    const submissions = await Submission.find({
      participant: participant._id,
      quizRoom: roomId,
    }).populate("question");

    // Tính toán thống kê
    const totalQuestions =
      participant.answeredQuestions.length +
      participant.remainingQuestions.length;
    const answeredQuestions = submissions.length;
    const correctAnswers = submissions.filter((s) => s.isCorrect).length;
    const incorrectAnswers = answeredQuestions - correctAnswers;
    const correctPercentage = Math.round(
      (correctAnswers / totalQuestions) * 100
    );

    // Format kết quả từng câu
    const answers = submissions.map((submission) => ({
      questionId: submission.question._id,
      userAnswer: submission.answer,
      correctAnswer:
        submission.question.answers.find((a) => a.isCorrect)?.text || "",
      isCorrect: submission.isCorrect,
      question: submission.question.questionText,
    }));

    return res.json({
      success: true,
      data: {
        score: participant.score,
        totalQuestions,
        stats: {
          correctAnswers,
          incorrectAnswers,
          correctPercentage,
        },
        answers,
      },
    });
  } catch (error) {
    console.error("Error getting quiz results:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
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
