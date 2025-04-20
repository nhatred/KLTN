import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Participant",
    required: true,
  },
  quizRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "QuizRoom",
    required: true,
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true,
  },
  answer: { type: mongoose.Schema.Types.Mixed, required: true }, // User's answer (format depends on question type)
  isCorrect: { type: Boolean, required: true },
  score: { type: Number, required: true },
  timeToAnswer: { type: Number }, // in seconds
  submittedAt: { type: Date, default: Date.now },
});

const Submission = mongoose.model("Submission", submissionSchema);
export default Submission;
