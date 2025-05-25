import express from "express";
import {
  getParticipantStatus,
  _formatQuestion,
  joinRoom,
  getUserInfo,
  getParticipantStatusByUserId,
} from "../controllers/participantController.js";
import { verifyToken } from "../middlewares/auth.js";

const router = express.Router();

// Tham gia phòng thi (tạo mới hoặc lấy thông tin cũ)
router.post("/join", verifyToken, joinRoom);

// Lấy trạng thái hiện tại của người tham gia
router.get("/:id/status", verifyToken, getParticipantStatus);

// Lấy thông tin người dùng từ Clerk
router.get("/user/:userId", verifyToken, getUserInfo);

// Lấy trạng thái người tham gia theo userId
router.get("/status/:userId", verifyToken, getParticipantStatusByUserId);

export default router;
