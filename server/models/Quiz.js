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
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    totalPlays: { type: Number, default: 0 },
    quizRatings: [
      { userId: { type: String }, rating: { type: Number, min: 1, max: 5 } },
    ],
    questionBankQueries: [
      {
        questionBankId: { type: String },
        difficulty: { type: [String] },
        limit: { type: Number },
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
