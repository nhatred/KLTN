import mongoose from "mongoose";

const participantSchema = new mongoose.Schema({
  quizRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "QuizRoom",
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true
  },
  user: { 
    type: String, 
    ref: "User",
    required: true
  }, // For logged in users with Clerk
  temporaryUsername: { type: String }, // For non-logged in users
  isLoggedIn: { type: Boolean, default: false },
  score: { type: Number, default: 0 },
  deviceId: { type: String }, // Device identifier for tracking sessions
  submissions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Submission" }],
  joinedAt: { type: Date, default: Date.now },
});

// Add indexes for better query performance
participantSchema.index({ user: 1, isLoggedIn: 1 });
participantSchema.index({ quiz: 1 });
participantSchema.index({ joinedAt: -1 });

const Participant = mongoose.model("Participant", participantSchema);
export default Participant;