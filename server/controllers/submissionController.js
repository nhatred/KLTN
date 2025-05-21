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

// Đánh giá câu trả lời (True => 1, false => 0)
async function _evaluateAnswer(question, userAnswer) {
  let isCorrect = false;
  let score = 0;

  switch (question.questionType) {
    case "multipleChoices":
    case "dropdown":
      // Đối với câu hỏi chọn đáp án
      const correctAnswers = question.answers
        .filter((a) => a.isCorrect)
        .map((a) => a.text);

      isCorrect = correctAnswers.includes(userAnswer);
      score = isCorrect ? 1 : 0;
      break;

    case "fillInBlank":
      // Đối với điền vào chỗ trống
      isCorrect = question.answers.some(
        (a) => a.text.toLowerCase() === userAnswer.toLowerCase()
      );
      score = isCorrect ? 1 : 0;
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
        userAnswer.some(
          (ua) =>
            ua.draggable === pair.draggable && ua.dropZone === pair.dropZone
        )
      );
      score = isCorrect ? 1 : 0;
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

export { submitAnswer, _evaluateAnswer, syncSubmissions };
