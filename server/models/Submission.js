import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
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
      ref: "Quiz",
    },
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    answer: { type: mongoose.Schema.Types.Mixed, required: true }, // User's answer (format depends on question type)
    answerId: { type: String }, // Store the selected answer ID for multiple choice
    isCorrect: { type: Boolean, required: true },
    score: { type: Number, required: true, default: 0 },
    timeToAnswer: { type: Number }, // in seconds
    questionType: {
      type: String,
      enum: [
        "multipleChoices",
        "fillInBlank",
        "paragraph",
        "dragAndDrop",
        "dropdown",
      ],
    },
    // Thời gian client gửi câu trả lời
    clientTimestamp: { type: Date },
    // Trạng thái submission
    status: {
      type: String,
      enum: ["draft", "final"],
      default: "draft",
    },
    // Đánh dấu đã đồng bộ với server
    isSynced: { type: Boolean, default: false },
    // Lưu lịch sử các lần thay đổi đáp án
    answerHistory: [
      {
        answer: { type: mongoose.Schema.Types.Mixed },
        answerId: { type: String },
        isCorrect: { type: Boolean },
        score: { type: Number },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index cho việc tìm kiếm submission
submissionSchema.index({ participant: 1, question: 1 });
submissionSchema.index({ quizRoom: 1, status: 1 });

const Submission = mongoose.model("Submission", submissionSchema);
export default Submission;
