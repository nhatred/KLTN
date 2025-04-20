// controllers/questionController.js
import Question from "../models/Question.js";
import Quiz from "../models/Quiz.js";

const createQuestion = async (req, res) => {
  try {
    const {
      quizId,
      questionText,
      questionType,
      options,
      timePerQuestion,
      scorePerQuestion,
    } = req.body;

    // Validate if quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Format options and correct answers based on question type
    let formattedOptions = [];
    let formattedCorrectAnswer = [];

    if (questionType === "multipleChoices") {
      formattedOptions = options.map((option) => option.text);
      formattedCorrectAnswer = options
        .filter((option) => option.isCorrect)
        .map((option) => option.text);
    }
    // Handle other question types here...

    // Create new question
    const newQuestion = new Question({
      quizId,
      questionText,
      questionType,
      options: formattedOptions,
      correctAnswer: formattedCorrectAnswer,
    });

    const savedQuestion = await newQuestion.save();

    // Add question to quiz's questions array
    quiz.questions.push(savedQuestion._id);

    // Update quiz with time and score per question if provided
    if (timePerQuestion) quiz.timePerQuestion = timePerQuestion;
    if (scorePerQuestion) quiz.scorePerQuestion = scorePerQuestion;

    await quiz.save();

    res.status(201).json(savedQuestion);
  } catch (error) {
    console.error("Error creating question:", error);
    res
      .status(500)
      .json({ message: "Failed to create question", error: error.message });
  }
};

export default { createQuestion };
