import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    imageUrl: { type: String, required: true },

    createdQuizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Quiz" }],
    recentlyJoinedQuizzes: [
      {
        quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    participations: [
      { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Participant" 
      }
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;