import express from "express";
import {
  getAllExamSets,
  getExamSetById,
  createExamSet,
  updateExamSet,
  deleteExamSet,
  generateExam,
} from "../controllers/examSetController.js";
import { verifyToken } from "../middlewares/auth.js";

const router = express.Router();

// Tất cả các routes đều yêu cầu xác thực
router.use(verifyToken);

// Lấy tất cả bộ đề
router.get("/", getAllExamSets);

// Lấy một bộ đề theo ID
router.get("/:id", getExamSetById);

// Tạo bộ đề mới
router.post("/", createExamSet);

// Cập nhật bộ đề
router.put("/:id", updateExamSet);

// Xóa bộ đề
router.delete("/:id", deleteExamSet);

// Tạo đề thi tự động
router.post("/:id/generate", generateExam);

export default router;
