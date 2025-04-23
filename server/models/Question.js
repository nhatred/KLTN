import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    questionText: { type: String, required: true },
    questionType: {
      type: String,
      enum: [
        "multipleChoices",
        "fillInBlank",
        "paragraph",
        "dragAndDrop",
        "dropdown",
      ],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
    },
    // For multiple choice and dropdown
    options: [
      {
        type: String,
        required: function () {
          return (
            this.questionType === "multipleChoices" ||
            this.questionType === "dropdown"
          );
        },
      },
    ],
    // For drag and drop
    dragDropPairs: [
      {
        draggable: { type: String },
        dropZone: { type: String },
      },
    ],
    // Store correct answer based on question type
    answers: [
      {
        text: { type: String, required: true },
        isCorrect: { type: Boolean, required: true },
      },
    ],
  },
  { timestamps: true }
);

const Question = mongoose.model("Question", questionSchema);
export default Question;
