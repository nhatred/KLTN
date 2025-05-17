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

export const checkQuizOwnership = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    if (quiz.creator !== req.auth.userId) {
      return res.status(403).json({ message: 'Unauthorized to edit this quiz' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};