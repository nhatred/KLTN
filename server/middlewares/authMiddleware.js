import { clerkClient } from "@clerk/express";

export const protectCreator = async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    await clerkClient.users.getUser(userId);
    next();
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
