import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamSet",
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
    },
    timePerQuestion: { type: Number },
    scorePerQuestion: { type: Number },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
    },

    // Nhieu lua chon hoac kieu tha xuong
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

    // Keo tha
    dragDropPairs: [
      {
        draggable: { type: String },
        dropZone: { type: String },
      },
    ],
    // Luu tru cac dap an voi kieu cau hoi
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
