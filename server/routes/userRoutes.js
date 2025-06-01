import express from "express";
const router = express.Router();
import { verifyToken } from "../middlewares/auth.js";
import {
  getUsers,
  getUserById,
  getUsersByIds,
  createUser,
  updateUserRole,
  deleteUser,
} from "../controllers/userController.js";

router.get("/", verifyToken, getUsers);
router.get("/:userId", verifyToken, getUserById);
router.post("/batch", verifyToken, getUsersByIds);
router.post("/", verifyToken, createUser);
router.patch("/:userId/role", verifyToken, updateUserRole);
router.delete("/:userId", verifyToken, deleteUser);

export default router;
