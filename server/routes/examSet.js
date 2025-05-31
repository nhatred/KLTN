import express from "express";
import {
  getExamSetById,
  createExamSet,
  updateExamSet,
  deleteExamSet,
  generateExam,
  getExamSetsByUserId,
  getAllExamSets,
} from "../controllers/examSetController.js";
import { verifyToken } from "../middlewares/auth.js";

const router = express.Router();

router.use(verifyToken);

// Tạo bộ đề mới
router.post("/", createExamSet);
// Xóa bộ đề
router.delete("/:id", deleteExamSet);
// Lấy tất cả bộ đề cảu user
router.get("/", getAllExamSets);
// Lấy bộ đề của một user cụ thể
router.get("/user/:userId", getExamSetsByUserId);
// Lấy một bộ đề theo ID
router.get("/:id", getExamSetById);
// Cập nhật bộ đề
router.put("/:id", updateExamSet);

// Tạo đề thi tự động
router.post("/:id/generate", generateExam);

export default router;
