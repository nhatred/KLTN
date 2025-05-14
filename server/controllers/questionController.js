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

    // Delete all existing questions for this quiz
    await Question.deleteMany({ quizId: quizId });

    // Create new questions
    const createdQuestions = [];
    const questionIds = [];

    for (const question of questionData) {
      const newQuestion = await Question.create(question);
      createdQuestions.push(newQuestion);
      questionIds.push(newQuestion._id);
    }

    // Update Quiz with new question IDs (replace instead of append)
    quiz.questions = questionIds;
    await quiz.save();

    res.json({
      success: true,
      message: "Questions Updated Successfully!",
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

async function deleteQuestionsByQuizId(req, res) {
  try {
    const { quizId } = req.params;

    // Kiểm tra quiz tồn tại
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Xóa tất cả câu hỏi của quiz
    await Question.deleteMany({ quizId: quizId });

    // Xóa danh sách câu hỏi trong quiz
    quiz.questions = [];
    await quiz.save();

    res.json({
      success: true,
      message: "Questions deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting questions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete questions",
      error: error.message,
    });
  }
}

export default { createQuestion, getQuestionByQuizId, deleteQuestionsByQuizId };
