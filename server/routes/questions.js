import express from "express";
import questionController from "../controllers/questionController.js"; // Bỏ comment

const router = express.Router();

router.post("/", questionController.createQuestion);
router.get("/quiz/:quizId", questionController.getQuestionByQuizId);

export default router;
