import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Participant",
    required: true,
    index: true,
  },
  quizRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "QuizRoom",
    index: true,
  },
  // user: {
  //   type: String,
  //   ref: "User"
  // },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz"
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true,
  },
  answer: { type: mongoose.Schema.Types.Mixed, required: true }, // User's answer (format depends on question type)
  isCorrect: { type: Boolean, required: true },
  score: { type: Number, required: true, default: 0 },
  timeToAnswer: { type: Number }, // in seconds
  questionType: { type: String, enum: ["multipleChoices", "fillInBlank", "paragraph", "dragAndDrop", "dropdown"] },
  // Thời gian client gửi câu trả lời
  clientTimestamp: { type: Date },
  // Đánh dấu đã đồng bộ với server
  isSynced: { type: Boolean, default: false }
}, {
  timestamps: true
});

const Submission = mongoose.model("Submission", submissionSchema);
export default Submission;