import mongoose from "mongoose";

const examSetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    subject: { type: String, required: true },
    grade: { type: String, required: true },
    description: { type: String },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    createdBy: { type: String, required: true }, // Clerk user ID
  },
  { timestamps: true }
);

const ExamSet = mongoose.model("ExamSet", examSetSchema);

export default ExamSet;
