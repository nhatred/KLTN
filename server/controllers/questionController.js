// controllers/questionController.js
import Question from "../models/Question.js";
import Quiz from "../models/Quiz.js";

const createQuestion = async (req, res) => {
  try {
    const questionData = req.body.questions;
    const quizId = questionData[0].quizId;

    // Validate if quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Tạo tất cả câu hỏi và thu thập ID
    const createdQuestions = [];
    const questionIds = [];

    for (const question of questionData) {
      const newQuestion = await Question.create(question);
      createdQuestions.push(newQuestion);
      questionIds.push(newQuestion._id);
    }

    // Cập nhật Quiz với các ID câu hỏi mới
    quiz.questions = [...quiz.questions, ...questionIds];
    await quiz.save();

    res.json({
      success: true,
      message: "Questions Added Successfully!",
      questions: createdQuestions,
      questionIds: questionIds,
    });
  } catch (error) {
    console.error("Error creating question:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create question",
      error: error.message,
    });
  }
};

async function getQuestionByQuizId(req, res) {
  try {
    const { quizId } = req.params;

    // Kiểm tra quiz tồn tại
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Tìm tất cả câu hỏi có quizId tương ứng
    const questions = await Question.find({ quizId: quizId });

    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export default { createQuestion, getQuestionByQuizId };
