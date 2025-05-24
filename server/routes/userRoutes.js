import express from "express";
const router = express.Router();
import { verifyToken } from "../middlewares/auth.js";
import {
  getUsers,
  getUserById,
  getUsersByIds,
  createUser,
} from "../controllers/userController.js";

router.get("/", verifyToken, getUsers);
router.get("/:userId", verifyToken, getUserById);
router.post("/batch", verifyToken, getUsersByIds);
router.post("/", verifyToken, createUser);

export default router;
