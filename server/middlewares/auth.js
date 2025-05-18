import { clerkClient } from '@clerk/express';

// Middleware dùng để xác thực access token từ Clerk
export const verifyToken = async (req, res, next) => {
    try {
        // Log headers để debug
        console.log('Request headers:', req.headers);
        
        // Lấy userId từ req.auth (đã được Clerk verify)
        const { userId } = req.auth;
        console.log('Auth middleware debug:', {
            userId,
            auth: req.auth,
            headers: req.headers
        });

        if (!userId) {
            console.log('No userId found in req.auth');
            return res.status(401).json({ 
                success: false,
                message: 'Unauthorized - No user ID found' 
            });
        }

        // Set userId vào request
        req.userId = userId;
        req.isAuthenticated = true;

        // Log để debug
        console.log('Request after auth:', {
            userId: req.userId,
            auth: req.auth,
            headers: req.headers
        });

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({ 
            success: false,
            message: 'Unauthorized - Invalid token' 
        });
    }
};

export default verifyToken;
