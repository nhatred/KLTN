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
    isPublic: { type: Boolean, default: false },
    timePerQuestion: { type: Number }, // in seconds
    scorePerQuestion: { type: Number },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    totalPlays: { type: Number, default: 0 },
    // Mở rộng
    quizRatings: [
      { userId: { type: String }, rating: { type: Number, min: 1, max: 5 } },
    ],
    questionBankQueries: [
      {
        examSetId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamSet', required: true},
        difficulty: { type: String, enum: ['easy', 'medium', 'hard']},
        limit: { type: Number , require: true},
      },
    ],
    isExam: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

quizSchema.virtual("questionCount").get(function () {
  return this.questions?.length || 0;
});

const Quiz = mongoose.model("Quiz", quizSchema);
export default Quiz;
