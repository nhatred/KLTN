import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
  {
    creator: {
      type: String,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    topic: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    imageUrl: {
      type: String,
    },
    isPublic: { type: String },
    timePerQuestion: { type: Number }, // in seconds
    scorePerQuestion: { type: Number },
    // questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    questions: [],
    totalPlays: { type: Number, default: 0 },
    quizRatings: [
      { userId: { type: String }, rating: { type: Number, min: 1, max: 5 } },
    ],
  },
  { timestamps: true }
);

const Quiz = mongoose.model("Quiz", quizSchema);
export default Quiz;
