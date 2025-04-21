import express from "express";
import upload from "../configs/multer.js";
import { createQuiz } from "../controllers/quizController.js";
import { protectCreator } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Create a new quiz

router.post("/", upload.single("imageUrl"), protectCreator, createQuiz);

export default router;
