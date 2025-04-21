import express from "express";
import multer from "multer";
import { createQuiz } from "../controllers/quizController.js";
import { protectCreator } from "../middlewares/authMiddleware.js";

const router = express.Router();

const upload = multer();
// Create a new quiz
// router.post("/add-quiz", createQuiz);
router.post("/", upload.single("image"), protectCreator, createQuiz);

export default router;
