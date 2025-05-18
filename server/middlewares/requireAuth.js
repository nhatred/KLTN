// middleware/requireAuth.js

const requireAuth = (req, res, next) => {
    if (!req.isAuthenticated) {
        // Nếu chưa xác thực, chặn lại
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Nếu đã xác thực thì cho đi tiếp
    next();
};

export default requireAuth;
