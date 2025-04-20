import express from "express";
import questionController from "../controllers/questionController.js"; // Bỏ comment

const router = express.Router();

router.post("/", questionController.createQuestion); // Bỏ comment

export default router;
