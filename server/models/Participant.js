import mongoose from "mongoose";

const participantSchema = new mongoose.Schema(
  {
    quizRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuizRoom",
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
    },
    // questionOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    user: {
      type: String, // Keep as String for Clerk user IDs
      // required: true,
    },
    temporaryUsername: { type: String }, // For non-logged in users
    isLoggedIn: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now },

    submissions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Submission" }],
    //câu hỏi hiện tại mà người tham gia đang làm
    // currentQuestionIndex: { type: Number, default: 0 },
    //ds câu chưa hoàn thành
    remainingQuestions: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
    ],
    //ds câu đã hoàn thành
    answeredQuestions: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
        },
        submissionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Submission",
        },
      },
    ],
    // Lưu ID kết nối socket
    connectionId: { type: String },
    // Lưu trữ thời gian lần cuối hoạt động
    lastActive: { type: Date, default: Date.now },
    // Lưu thông tin thiết bị
    deviceInfo: { type: Object },

    // Trạng thái của participant
    status: {
      type: String,
      enum: ["active", "completed", "abandoned"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better query performance
participantSchema.index({ user: 1, isLoggedIn: 1 });
participantSchema.index({ quiz: 1 });
participantSchema.index({ joinedAt: -1 });

const Participant = mongoose.model("Participant", participantSchema);
export default Participant;
