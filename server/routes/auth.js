import express from 'express';
import authController from '../controllers/AuthController.js';
import verifyToken from '../middlewares/auth.js';

const router = express.Router();

// @route POST api/auth/register
    // Đây là endpoint API.
    // Method: POST
    // URL: /api/auth/register
    // => Đây là đường dẫn để người dùng đăng ký.

// @desc Register user
    // Mô tả ngắn cho route này:
    // → Dùng để đăng ký tài khoản người dùng.

// @access Public
    // Quyền truy cập của route:
    // Public = ai cũng có thể truy cập (không cần đăng nhập)
    // Có thể có Private, nghĩa là phải có token hoặc login mới dùng được
// router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/register', authController.register)
router.get('/', verifyToken, authController.home);

export default router;