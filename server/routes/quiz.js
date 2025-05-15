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
  completeQuizSession
} from "../controllers/quizController.js";
import { protectCreator } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Create a new quiz

router.post("/", upload.single("imageUrl"), protectCreator, createQuiz);
router.get("/", getAllQuiz);
router.get("/:id", getQuizById);

router.get("/user/:userId", getUserQuizzes);

// Get user's quiz history (lấy lịch sử làm quiz của người dùng)
router.get("/history/:userId", getUserQuizHistory);

// Quiz session management routes
router.post("/session", saveQuizSession);
router.get("/session", getQuizSession);
router.post("/session/complete", completeQuizSession);

router.patch("/:quizId/questions", protectCreator, updateQuizQuestions);
router.put(
  "/:id",
  upload.single("imageUrl"),
  (req, res, next) => {
    console.log("Processing quiz update request for ID:", req.params.id);
    console.log("File upload processed:", req.file);
    next();
  },
  protectCreator,
  updateQuiz
);

router.delete("/:id", protectCreator, deleteQuiz);

// Save quiz results route - does not require authentication
router.post("/results", saveQuizResults);

export default router;
