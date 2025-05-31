import express from "express";
import upload from "../configs/multer.js";
import {
  createQuiz,
  getAllQuiz,
  getQuizById,
  getUserQuizzes,
  updateQuiz,
  updateQuizQuestions,
  deleteQuiz,
  saveQuizResults,
  getUserQuizHistory,
  saveQuizSession,
  getQuizSession,
  completeQuizSession,
  getUserExams,
  getQuizDetails,
} from "../controllers/quizController.js";

const router = express.Router();
// Tạo quizz
router.post("/", upload.single("imageUrl"), createQuiz);
// Lấy tất cả các quizz của user
router.get("/user/:userId", getUserQuizzes);
router.get("/user-exams/:userId", getUserExams);

// Quiz session management routes - must be before parameterized routes
router.post("/session/complete", completeQuizSession);
router.post("/session", saveQuizSession);
router.get("/session", getQuizSession);

// Save quiz results route - does not require authentication
router.post("/results", saveQuizResults);

// Create a new quiz

router.get("/", getAllQuiz);

// User specific routes
router.get("/history/:userId", getUserQuizHistory);

// Quiz management routes
router.get("/:id", getQuizById);
router.patch("/:quizId/questions", updateQuizQuestions);
router.put(
  "/:id",
  upload.single("imageUrl"),
  (req, res, next) => {
    console.log("Processing quiz update request for ID:", req.params.id);
    console.log("File upload processed:", req.file);
    next();
  },
  updateQuiz
);
router.delete("/:id", deleteQuiz);
// Lấy thông tin một quizz để tạo phòng
router.get("/quizuser/:id", getQuizDetails);

export default router;
