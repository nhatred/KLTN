import mongoose from "mongoose";

const participantSchema = new mongoose.Schema({
  quizRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "QuizRoom",
    required: true,
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Optional - for logged in users
  temporaryUsername: { type: String }, // For non-logged in users
  isLoggedIn: { type: Boolean, default: false },
  score: { type: Number, default: 0 },
  submissions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Submission" }],
  joinedAt: { type: Date, default: Date.now },
});

const Participant = mongoose.model("Participant", participantSchema);
export default Participant;
