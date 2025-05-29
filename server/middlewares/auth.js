import { clerkClient } from "@clerk/express";

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

export default verifyToken;
