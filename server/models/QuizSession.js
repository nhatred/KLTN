import mongoose from "mongoose";

const quizSessionSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true
  },
  user: {
    type: String,
    ref: "User"
  },
  temporaryUsername: { 
    type: String 
  },
  isLoggedIn: { 
    type: Boolean, 
    default: false 
  },
  currentQuestion: {
    type: Number,
    default: 0
  },
  timeLeft: {
    type: Number
  },
  score: {
    type: Number,
    default: 0
  },
  userAnswers: [{
    questionIndex: Number,
    questionId: String,
    userAnswer: Number,
    correct: Boolean,
    score: Number,
    timeToAnswer: Number
  }],
  deviceId: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active'
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 60 * 1000) // 30 phút tính từ thời điểm tạo
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Tự động cập nhật updatedAt khi cập nhật session
quizSessionSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: new Date() });
});

// Index để tự động xóa sessions hết hạn
quizSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const QuizSession = mongoose.model("QuizSession", quizSessionSchema);
export default QuizSession; 