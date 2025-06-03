import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { type } from "os";
import Question from "./Question.js";

const quizRoomSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: (v) => /^[A-Z0-9]{6}$/.test(v),
        message: (props) =>
          `${props.value} không phải mã phòng hợp lệ (6 ký tự A-Z, 0-9)`,
      },
    },
    roomName: { type: String, require: true },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
    host: { type: String, ref: "User", required: true },
    startTime: { type: Date },
    isActive: { type: Boolean, default: false },
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Participant" },
    ],
    questionOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Thời lượng phải là số nguyên (phút)",
      },
    },
    perQuestionTime: { type: Number, min: 1, default: null },
    endTime: { type: Date },
    status: {
      type: String,
      enum: ["scheduled", "active", "completed", "cancelled"],
      default: "scheduled",
    },
    autoStart: { type: Boolean, default: false },
    lastActivationCheck: { type: Date, default: null },
    // startNow: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    virtuals: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Số giây còn lại khi phòng kết thúc
quizRoomSchema.virtual("timeRemaining").get(function () {
  if (!this.isActive || !this.endTime) return 0;
  return Math.max(0, this.endTime - new Date());
});

// quizRoomSchema.pre("save", function (next) {
//   if (
//     this.isNew ||
//     (this.isModified("startTime") && !this.isModified("status")) ||
//     (this.isModified("durationMinutes") && !this.isModified("status"))
//   ) {
//     if (this.startNow) {
//       this.status = "active";
//       this.isActive = true;
//       const now = new Date();
//       this.startTime = now;
//       this.endTime = new Date(now.getTime() + this.durationMinutes * 60000);
//     } else if (this.startTime  this.durationMinutes) {
//       this.status = "scheduled";
//       this.isActive = false;
//       this.endTime = new Date(
//         new Date(this.startTime).getTime() + this.durationMinutes * 60000
//       );
//     }
//   }
//   next();
// });
// Đã thay đổi như dưới
quizRoomSchema.pre("save", function (next) {
  if (this.isModified("startTime") || this.isModified("durationMinutes")) {
    if (this.startTime && this.durationMinutes) {
      this.endTime = new Date(
        this.startTime.getTime() + this.durationMinutes * 60000
      );
    }
  }
  next();
});

// Tự động bật phòng
quizRoomSchema.statics.autoActivateRooms = async function () {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 300000);

  const roomsToActivate = await this.find({
    status: "scheduled",
    autoStart: true,
    startNow: false,
    startTime: { $lte: now },
    $or: [
      { lastActivationCheck: { $exists: false } },
      { lastActivationCheck: { $lt: fiveMinutesAgo } },
      { lastActivationCheck: null },
    ],
  });

  const activationPromises = roomsToActivate.map(async (room) => {
    try {
      room.status = "active";
      room.isActive = true;
      room.lastActivationCheck = now;
      if (!room.endTime) {
        room.endTime = new Date(
          room.startTime.getTime() + room.durationMinutes * 60000
        );
      }
      await room.save();
      return room;
    } catch (err) {
      console.error(`Lỗi kích hoạt phòng ${room.roomCode}:`, err);
      return null;
    }
  });

  const activatedRooms = (await Promise.all(activationPromises)).filter(
    Boolean
  );
  return activatedRooms;
};

// Tự động tắt phòng
quizRoomSchema.statics.autoCompleteRooms = async function () {
  const now = new Date();
  const roomsToComplete = await this.find({
    status: "active",
    isActive: true,
    endTime: { $ne: null, $lte: now },
  });

  const updatePromises = roomsToComplete.map(async (room) => {
    room.status = "completed";
    room.isActive = false;
    await room.save();
    return { success: true, room };
  });

  await Promise.all(updatePromises);
  return roomsToComplete;
};

// Mở phòng thủ công
quizRoomSchema.methods.startRoom = async function () {
  console.log("Starting room method called with status:", this.status);

  if (this.status !== "scheduled") {
    throw new Error(`Không thể bắt đầu phòng ở trạng thái ${this.status}`);
  }

  // Populate quiz data first
  await this.populate({
    path: "quiz",
    select: "questions questionBankQueries isExam",
  });

  console.log("Quiz data:", {
    isExam: this.quiz.isExam,
    hasQuestions: this.quiz.questions?.length > 0,
    hasQueries: this.quiz.questionBankQueries?.length > 0,
  });

  // Generate questions if not already done
  if (!this.questionOrder || this.questionOrder.length === 0) {
    if (this.quiz.isExam && this.quiz.questionBankQueries?.length > 0) {
      console.log("Generating questions from question bank");
      const allQuestions = [];

      // Process each query in sequence
      for (const criteria of this.quiz.questionBankQueries) {
        const { examSetId, difficulty, limit } = criteria;
        console.log("Processing query:", { examSetId, difficulty, limit });

        // Build filter for question search
        const filter = { examSetId: new mongoose.Types.ObjectId(examSetId) };
        if (difficulty) filter.difficulty = difficulty;

        // Fetch matching questions
        const questions = await Question.find(filter);
        console.log(
          `Found ${questions.length} matching questions for bank ${examSetId}`
        );

        if (questions.length === 0) {
          console.warn(`No questions found for criteria:`, criteria);
          continue;
        }

        // Take required number of questions
        const selected = questions.slice(0, limit);
        allQuestions.push(...selected);
      }

      if (allQuestions.length === 0) {
        throw new Error("Không thể tạo câu hỏi từ ngân hàng câu hỏi");
      }

      this.questionOrder = allQuestions.map((q) => q._id);
      console.log(
        `Generated ${this.questionOrder.length} questions from banks`
      );
    } else if (this.quiz.questions?.length > 0) {
      console.log("Using questions directly from quiz");
      this.questionOrder = this.quiz.questions;
      console.log(`Added ${this.questionOrder.length} questions from quiz`);
    } else {
      throw new Error("Không có câu hỏi cho phòng thi");
    }
  }

  if (!this.questionOrder || this.questionOrder.length === 0) {
    throw new Error("Không thể tạo câu hỏi cho phòng thi");
  }

  // Populate participants to get their IDs
  await this.populate("participants");

  // For each participant, generate a random question order and save it
  const participantUpdates = this.participants.map(async (participantId) => {
    try {
      // Get the participant
      const participant = await mongoose
        .model("Participant")
        .findById(participantId);
      if (!participant) {
        console.warn(`Participant ${participantId} not found`);
        return;
      }

      // Create a copy of the questions array for this participant
      const participantQuestions = [...this.questionOrder];

      // Shuffle the questions using Fisher-Yates algorithm
      for (let i = participantQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [participantQuestions[i], participantQuestions[j]] = [
          participantQuestions[j],
          participantQuestions[i],
        ];
      }

      // Update participant's remaining questions with their shuffled order
      participant.remainingQuestions = participantQuestions;
      participant.answeredQuestions = []; // Reset answered questions

      // Save the participant
      await participant.save();

      console.log(`Updated question order for participant ${participantId}`);
    } catch (error) {
      console.error(`Error updating participant ${participantId}:`, error);
    }
  });

  // Wait for all participant updates to complete
  await Promise.all(participantUpdates);

  const now = new Date();
  this.startTime = now;
  this.endTime = new Date(now.getTime() + this.durationMinutes * 60000);
  this.status = "active";
  this.isActive = true;
  this.lastActivationCheck = now;

  console.log("Room state before save:", {
    status: this.status,
    isActive: this.isActive,
    startTime: this.startTime,
    endTime: this.endTime,
    questionCount: this.questionOrder.length,
  });

  const savedRoom = await this.save();
  console.log(
    "Room saved successfully with",
    savedRoom.questionOrder.length,
    "questions"
  );

  return savedRoom;
};

// Đóng thủ công
quizRoomSchema.methods.completeRoom = async function () {
  if (this.status !== "active") {
    throw new Error(`Không thể kết thúc phòng ở trạng thái ${this.status}`);
  }

  const now = new Date().toISOString();
  this.status = "completed";
  this.endTime = now;
  this.isActive = false;
  await this.save();
  console.log();
  return {
    endTime: this.endTime,
    status: this.status,
  };
};

// Plugins
quizRoomSchema.plugin(mongoosePaginate);
// Indexes
quizRoomSchema.index({ status: 1, autoStart: 1, startTime: 1 });

const QuizRoom = mongoose.model("QuizRoom", quizRoomSchema);
export default QuizRoom;
