import express from "express";
import verifyToken from "../middlewares/auth.js";
import {
  createRoom,
  startRoom,
  endRoom,
  getRoomByCode,
  getRoomById,
  getRoomsByHost,
  updateRoomScheduled,
  updateRoomActive,
  deleteRoom,
  getQuizRoomEndTime,
  getRoomResults,
  _calculateQuestionStats,
  getUserQuizRoomHistory,
} from "../controllers/QuizRoomController.js";
import { protectCreator } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Tạo phòng thi từ một quiz
router.post("/", verifyToken, protectCreator, createRoom);
// Bắt đầu phòng thi thủ công
router.post("/:id/start", verifyToken, startRoom);
// Lấy thông tin phòng bằng mã phòng (public)
router.get("/code/:roomCode", getRoomByCode);
// // Lấy thông tin chi tiết phòng (cho host)
router.get("/:id", verifyToken, getRoomById);
// Lấy danh sách phòng của host (có phân trang)
router.get("/host/:hostId", getRoomsByHost);
// Cập nhật thông tin phòng
router.put("/:id", verifyToken, updateRoomScheduled);
// Kết thúc phòng thi sớm
router.post("/:id/end", verifyToken, endRoom);
// Xóa phòng thi
router.delete("/:id", verifyToken, deleteRoom);
// Lấy kết quả phòng thi (leaderboard và thống kê)
router.get("/:id/results", verifyToken, getRoomResults);
// Lấy lịch sử phòng thi của người dùng
router.get("/history/:userId", verifyToken, getUserQuizRoomHistory);

export default router;
