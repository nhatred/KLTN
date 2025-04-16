import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    avatar: { type: String, required: true },

    // Thông tin tùy chọn
    fullName: { type: String, trim: true },

    // Lịch sử làm bài
    quizHistory: [
      {
        quizId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Quiz",
        },
        score: Number,
        correctAnswers: Number,
        submittedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Xác thực
    isVerified: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
