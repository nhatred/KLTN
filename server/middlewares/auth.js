import { clerkClient, requireAuth as clerkRequireAuth } from "@clerk/express";
import User from "../models/User.js";

// Theo dõi thời gian log cuối cùng cho mỗi endpoint
const lastLoggedTime = new Map();
const LOG_INTERVAL = 60000; // 1 phút

// Middleware dùng để xác thực access token từ Clerk
export const verifyToken = async (req, res, next) => {
  try {
    // Lấy userId từ req.auth (đã được Clerk verify)
    const { userId } = req.auth;

    // Thêm logging chi tiết hơn
    if (!userId && !req.headers["x-periodic-request"]) {
      const endpoint = `${req.method}:${req.path}`;
      const currentTime = Date.now();
      const lastLogged = lastLoggedTime.get(endpoint) || 0;

      // Chỉ log nếu đã qua khoảng thời gian LOG_INTERVAL
      if (currentTime - lastLogged >= LOG_INTERVAL) {
        console.log("Authentication failed - Debug info:", {
          headers: req.headers,
          authPresent: !!req.auth,
          authContent: req.auth,
          url: req.url,
          method: req.method,
          timestamp: new Date().toISOString(),
        });
        lastLoggedTime.set(endpoint, currentTime);
      }

      return res.status(401).json({
        success: false,
        message: "Unauthorized - No user ID found",
      });
    }

    // Set userId vào request
    req.userId = userId;
    req.isAuthenticated = true;

    next();
  } catch (error) {
    // Chỉ log lỗi không phải từ request định kỳ
    if (!req.headers["x-periodic-request"]) {
      const endpoint = `${req.method}:${req.path}`;
      const currentTime = Date.now();
      const lastLogged = lastLoggedTime.get(endpoint) || 0;

      // Chỉ log lỗi nếu đã qua khoảng thời gian LOG_INTERVAL
      if (currentTime - lastLogged >= LOG_INTERVAL) {
        console.error("Auth middleware error:", {
          error: error.message,
          stack: error.stack,
          headers: req.headers,
          url: req.url,
          method: req.method,
          timestamp: new Date().toISOString(),
        });
        lastLoggedTime.set(endpoint, currentTime);
      }
    }
    return res.status(401).json({
      success: false,
      message: "Unauthorized - Invalid token",
    });
  }
};

// Middleware to verify JWT token from Clerk
export const requireAuth = clerkRequireAuth();

// Middleware to check if user is admin
export const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.auth.userId;

    // Get user from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);

    // Get user from database
    const user = await User.findById(userId);

    // Check if user exists and has admin role in both Clerk and database
    if (
      !user ||
      user.role !== "admin" ||
      !clerkUser.publicMetadata?.role === "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    next();
  } catch (error) {
    console.error("Error checking admin status:", error);
    res.status(500).json({
      success: false,
      message: "Error checking admin status",
      error: error.message,
    });
  }
};

// Middleware to check if user is teacher or admin
export const requireTeacherOrAdmin = async (req, res, next) => {
  try {
    const userId = req.auth.userId;

    // Get user from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);

    // Get user from database
    const user = await User.findById(userId);

    // Check if user exists and has appropriate role in both Clerk and database
    const clerkRole = clerkUser.publicMetadata?.role;
    if (
      !user ||
      (user.role !== "teacher" && user.role !== "admin") ||
      (clerkRole !== "teacher" && clerkRole !== "admin")
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Teacher or admin privileges required.",
      });
    }

    next();
  } catch (error) {
    console.error("Error checking user role:", error);
    res.status(500).json({
      success: false,
      message: "Error checking user role",
      error: error.message,
    });
  }
};

export default verifyToken;
