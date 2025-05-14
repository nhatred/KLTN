import Question from "../models/Question.js";
import Quiz from "../models/Quiz.js";
import { v2 as cloudinary } from "cloudinary";

async function createQuiz(req, res) {
  try {
    const userId = req.auth.userId;
    const quizData = req.body;
    const imageFile = req.file;
    // Cần Thêm chức năng giảm kích thước hình ảnh (Ảnh lớn hơn 20mb sẽ lỗi)
    if (!imageFile) {
      return res.json({ success: false, message: "Image Quiz not attached" });
    }
    quizData.creator = userId;

    try {
      try {
        console.log("Uploading image to Cloudinary:", imageFile);
        const imageUpload = await cloudinary.uploader.upload(imageFile.path);

        // Lấy URL của ảnh từ kết quả upload
        quizData.imageUrl = imageUpload.secure_url;
      } catch (cloudinaryError) {
        console.log("Image Quiz Error: ", cloudinaryError.message);
        return res.json({
          success: false,
          message: "Error uploading image: " + cloudinaryError.message,
        });
      }
      const newQuiz = await Quiz.create(quizData);
      res.json({
        success: true,
        message: "Quiz Added Success!",
        _id: newQuiz._id,
      });
    } catch (error) {
      console.log("Error Create New Quiz" + error);
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
}

async function getAllQuiz(req, res) {
  try {
    const quizzes = await Quiz.find();
    const quizzesWithQuestions = await Promise.all(
      quizzes.map(async (quiz) => {
        const questions = await Question.find({ quizId: quiz._id });
        return {
          ...quiz.toObject(),
          questions,
        };
      })
    );
    res.json(quizzesWithQuestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Trong controllers/quizController.js
async function updateQuizQuestions(req, res) {
  try {
    const { quizId } = req.params;
    const { questionIds } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Cập nhật danh sách câu hỏi
    quiz.questions = questionIds;
    await quiz.save();

    res.json({
      success: true,
      message: "Quiz updated with questions",
      quiz,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update quiz",
      error: error.message,
    });
  }
}

async function getUserQuizzes(req, res) {
  try {
    const { userId } = req.params;

    const quizzes = await Quiz.find({ creator: userId });

    // Tùy chọn: Thêm câu hỏi cho mỗi quiz
    const quizzesWithQuestions = await Promise.all(
      quizzes.map(async (quiz) => {
        const questions = await Question.find({ quizId: quiz._id });
        return {
          ...quiz.toObject(),
          questions,
        };
      })
    );

    res.json(quizzesWithQuestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Get quiz by ID
const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate("questions")
      .lean();

    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    res.json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// New function to update quiz
async function updateQuiz(req, res) {
  try {
    console.log("Updating quiz:", req.params.id);
    console.log("Update data:", req.body);

    // Check authentication
    if (!req.auth || !req.auth.userId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const userId = req.auth.userId;
    const quizId = req.params.id;
    const updateData = req.body;
    const imageFile = req.file;

    // Validate required fields
    if (!updateData.name || !updateData.topic || !updateData.difficulty) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: name, topic, and difficulty are required",
      });
    }

    // Find the quiz
    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res
        .status(404)
        .json({ success: false, message: "Quiz not found" });
    }

    // Check if user is the creator
    if (quiz.creator.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this quiz",
      });
    }

    try {
      // Update basic quiz information
      quiz.name = updateData.name;
      quiz.topic = updateData.topic;
      quiz.difficulty = updateData.difficulty;
      quiz.isPublic = updateData.isPublic || quiz.isPublic;
      quiz.timePerQuestion =
        Number(updateData.timePerQuestion) || quiz.timePerQuestion;
      quiz.scorePerQuestion =
        Number(updateData.scorePerQuestion) || quiz.scorePerQuestion;

      // Handle image update if a new image is provided
      if (imageFile) {
        try {
          console.log("Uploading new image to Cloudinary");

          // Upload new image
          const uploadResult = await cloudinary.uploader.upload(
            imageFile.path,
            {
              resource_type: "image",
              folder: "quiz_images",
              transformation: [{ width: 1000, crop: "limit" }],
            }
          );

          // Update the image URL
          quiz.imageUrl = uploadResult.secure_url;
          console.log(
            "New image uploaded successfully:",
            uploadResult.secure_url
          );
        } catch (cloudinaryError) {
          console.error("Failed to upload new image:", cloudinaryError);
          return res.status(500).json({
            success: false,
            message: "Error uploading new image: " + cloudinaryError.message,
          });
        }
      }

      // Save the updated quiz
      await quiz.save();
      console.log("Quiz updated successfully");

      res.status(200).json({
        success: true,
        message: "Quiz updated successfully",
        quiz: quiz,
      });
    } catch (saveError) {
      console.error("Error saving quiz:", saveError);
      return res.status(500).json({
        success: false,
        message: "Failed to save quiz updates: " + saveError.message,
      });
    }
  } catch (error) {
    console.error("Quiz update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update quiz: " + error.message,
    });
  }
}

async function deleteQuiz(req, res) {
  try {
    const userId = req.auth.userId;
    const quizId = req.params.id;

    // Find the quiz
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Check if user is the creator
    if (quiz.creator.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this quiz",
      });
    }

    // Delete all questions associated with this quiz
    await Question.deleteMany({ quizId: quizId });

    // Delete the quiz
    await Quiz.findByIdAndDelete(quizId);

    res.json({
      success: true,
      message: "Quiz and associated questions deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete quiz: " + error.message,
    });
  }
}

export {
  createQuiz,
  getQuizById,
  getAllQuiz,
  updateQuizQuestions,
  getUserQuizzes,
  updateQuiz,
  deleteQuiz,
};

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
