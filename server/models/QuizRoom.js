import mongoose from "mongoose";

const quizRoomSchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true, unique: true, length: 6 },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    startTime: { type: Date },
    isActive: { type: Boolean, default: true },
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Participant" },
    ],
    questionOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }], // Shuffled question IDs
  },
  { timestamps: true }
);

const QuizRoom = mongoose.model("QuizRoom", quizRoomSchema);
export default QuizRoom;
