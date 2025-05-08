import express from "express";
import upload from "../configs/multer.js";
import {
  createQuiz,
  getAllQuiz,
  getQuizById,
  getUserQuizzes,
  updateQuiz,
  updateQuizQuestions,
} from "../controllers/quizController.js";
import { protectCreator } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Create a new quiz

router.post("/", upload.single("imageUrl"), protectCreator, createQuiz);
router.get("/", getAllQuiz);
router.get("/:id", getQuizById);

router.get("/user/:userId", getUserQuizzes);

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

export default router;
