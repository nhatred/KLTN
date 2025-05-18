import QuizRoom from '../models/QuizRoom.js'

const roomHostMiddleware = async (req, res, next) => {
  try {
    const room = await QuizRoom.findOne({ roomCode: req.params.code });
    
    if (!room) {
      return res.status(404).json({ message: 'Không tìm thấy phòng thi' });
    }

    if (room.host.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Bạn không phải host của phòng này' });
    }

    req.room = room; // Gắn room vào request để sử dụng trong controller
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default roomHostMiddleware;