import express from "express";
import {
  submitAnswer,
  syncSubmissions,
  saveParticipationResult,
  getSubmissionsByParticipant,
} from "../controllers/submissionController.js";
import { verifyToken } from "../middlewares/auth.js";
import requireAuth from "../middlewares/requireAuth.js";

const router = express.Router();

// Nộp bài cho một câu hỏi
router.post("/", verifyToken, submitAnswer);

// Lưu kết quả tham gia bài thi
router.post("/participation", verifyToken, saveParticipationResult);

// Lấy tất cả bài nộp của người tham gia
router.get(
  "/participant/:participantId",
  verifyToken,
  getSubmissionsByParticipant
);

// Lấy bài nộp cụ thể
// router.get('/:id', verifyToken,requireAuth, getSubmission);

// Lấy kết quả bài làm (sau khi phòng đóng)
// router.get('/participant/:participantId/results', verifyToken,requireAuth, getParticipantResults);

// Đồng bộ bài làm khi reconnect
router.post("/sync", verifyToken, syncSubmissions);

export default router;
