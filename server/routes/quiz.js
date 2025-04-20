import express from "express";
import { createQuiz } from "../controllers/quizController.js";

const router = express.Router();

// Create a new quiz
router.post("/add-quiz", createQuiz);

export default router;
