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
import { protectCreator, checkQuizOwnership } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Quiz session management routes - must be before parameterized routes
router.post("/session/complete", completeQuizSession);
router.post("/session", saveQuizSession);
router.get("/session", getQuizSession);

// Save quiz results route - does not require authentication
router.post("/results", saveQuizResults);

// Create a new quiz
router.post("/", upload.single("imageUrl"), protectCreator, createQuiz);
router.get("/", getAllQuiz);

// User specific routes
router.get("/user/:userId", getUserQuizzes);
router.get("/history/:userId", getUserQuizHistory);

// Quiz management routes
router.get("/:id", getQuizById);
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

export default router;
