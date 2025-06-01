import express from "express";
import {
  getUsers,
  getUserById,
  getUsersByIds,
  updateUserRole,
  deleteUser,
} from "../controllers/userController.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";

const router = express.Router();

// Public routes
router.get("/:userId", requireAuth, getUserById);
router.post("/batch", requireAuth, getUsersByIds);

// Admin only routes
router.get("/", requireAuth, requireAdmin, getUsers);
router.patch("/:userId/role", requireAuth, requireAdmin, updateUserRole);
router.delete("/:userId", requireAuth, requireAdmin, deleteUser);

export default router;
