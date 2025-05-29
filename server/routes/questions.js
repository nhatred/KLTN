import express from "express";
import questionController from "../controllers/questionController.js"; // Bỏ comment
import { verifyToken } from "../middlewares/auth.js";

const router = express.Router();
router.use(verifyToken);
router.post("/", questionController.createQuestion);
router.get("/quiz/:id", questionController.getQuestionByQuizId);
router.delete("/:id", questionController.deleteQuestion);
router.put("/:id", questionController.updateQuestion);

export default router;
