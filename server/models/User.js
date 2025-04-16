import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    imageUrl: { type: String, required: true },

    // Lịch sử làm bài
    // quizHistory: [
    //   {
    //     quizId: {
    //       type: mongoose.Schema.Types.ObjectId,
    //       ref: "Quiz",
    //     },
    //     score: Number,
    //     correctAnswers: Number,
    //     rank: Number,
    //     submittedAt: {
    //       type: Date,
    //       default: Date.now,
    //     },
    //   },
    // ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
