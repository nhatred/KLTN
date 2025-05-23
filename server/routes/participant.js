import express from "express";
import {
  getParticipantStatus,
  _formatQuestion,
} from "../controllers/participantController.js";
import verifyToken from "../middlewares/auth.js";
import requireAuth from "../middlewares/requireAuth.js";

const router = express.Router();

// Lấy thông tin người tham gia
// router.get('/:id', verifyToken, requireAuth, getParticipant);

// Tham gia phòng thi (tạo mới hoặc lấy thông tin cũ)
// router.post('/join', joinRoom);

// Lấy danh sách người tham gia trong phòng
// router.get('/room/:roomId', verifyToken, requireAuth, getRoomParticipants);

// Cập nhật thông tin người tham gia (khi reconnect)
// router.put('/:id', verifyToken, requireAuth, updateParticipant);

// Rời phòng thi
// router.delete('/:id', verifyToken, requireAuth, leaveRoom);

// Lấy trạng thái hiện tại của người tham gia
router.get("/:id/status", verifyToken, requireAuth, getParticipantStatus);

export default router;
