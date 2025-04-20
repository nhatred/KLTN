import Quiz from "../models/Quiz.js";

export async function createQuiz(req, res) {
  try {
    const userId = req.auth.userId;
    const quizData = req.body;
    quizData.creator = userId;
    const newQuiz = await Quiz.create(quizData);
    await newQuiz.save();

    res.json({ success: true, message: "Quiz Add" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
}

// export default { createQuiz };
// // Create a new quiz
// const createQuiz = async (req, res) => {
//   try {
//     const {
//       name,
//       topic,
//       difficulty,
//       isPublic,
//       timePerQuestion,
//       scorePerQuestion,
//       creator,
//     } = req.body;

//     const newQuiz = new Quiz({
//       name,
//       topic,
//       difficulty,
//       isPublic: isPublic !== undefined ? isPublic : true,
//       timePerQuestion,
//       scorePerQuestion,
//       creator,
//       questions: [],
//     });

//     const savedQuiz = await newQuiz.save();

//     res.status(201).json(savedQuiz);
//   } catch (error) {
//     console.error("Error creating quiz:", error);
//     res
//       .status(500)
//       .json({ message: "Failed to create quiz", error: error.message });
//   }
// };

// // Get quiz by ID
// const getQuizById = async (req, res) => {
//   try {
//     const quiz = await Quiz.findById(req.params.id).populate("questions");
//     if (!quiz) {
//       return res.status(404).json({ message: "Quiz not found" });
//     }
//     res.status(200).json(quiz);
//   } catch (error) {
//     console.error("Error fetching quiz:", error);
//     res
//       .status(500)
//       .json({ message: "Failed to fetch quiz", error: error.message });
//   }
// };

// // Add question to quiz
// const addQuestionToQuiz = async (req, res) => {
//   try {
//     const quizId = req.params.id;
//     const quiz = await Quiz.findById(quizId);

//     if (!quiz) {
//       return res.status(404).json({ message: "Quiz not found" });
//     }

//     const {
//       questionText,
//       questionType,
//       options,
//       correctAnswer,
//       timePerQuestion,
//       scorePerQuestion,
//     } = req.body;

//     // Create new question
//     const newQuestion = new Question({
//       quizId,
//       questionText,
//       questionType,
//       options: options.map((option) => option.text),
//       correctAnswer: options
//         .filter((option) => option.isCorrect)
//         .map((option) => option.text),
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     });

//     const savedQuestion = await newQuestion.save();

//     // Add question to quiz's questions array
//     quiz.questions.push(savedQuestion._id);

//     // Update quiz with time and score per question if provided
//     if (timePerQuestion) quiz.timePerQuestion = timePerQuestion;
//     if (scorePerQuestion) quiz.scorePerQuestion = scorePerQuestion;

//     await quiz.save();

//     res.status(201).json(savedQuestion);
//   } catch (error) {
//     console.error("Error adding question to quiz:", error);
//     res
//       .status(500)
//       .json({ message: "Failed to add question", error: error.message });
//   }
// };

// export default { createQuiz, getQuizById, addQuestionToQuiz };
