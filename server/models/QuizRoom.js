import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const quizRoomSchema = new mongoose.Schema(
  {
     roomCode: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: (v) => /^[A-Z0-9]{6}$/.test(v),
        message: props => `${props.value} không phải mã phòng hợp lệ (6 ký tự A-Z, 0-9)`
      }
    },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    host: { type: String, ref: "User", required: true },
    startTime: { type: Date },
    isActive: { type: Boolean, default: true },
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Participant" },
    ],
    questionOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }], // Shuffled question IDs
    // Tổng thời lượng
    durationMinutes: { type: Number, required: true, min: 1, validate: { validator: Number.isInteger, message: 'Thời lượng phải là số nguyên (phút)' } },
    endTime: { type: Date },
    status: { type: String, enum: ['scheduled', 'active', 'completed', 'cancelled'], default: 'scheduled' },
    autoStart: { type: Boolean, default: false },
    // Biết lần gần nhất hệ thống đã kiểm tra phòng này => Tránh kiểm tra cùng một phòng nhiều lần trong thời gian ngắn.
    lastActivationCheck: { type: Date, default: null }
  },
  {
    timestamps: true,
    virtuals: true, 
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v; //Loại bỏ trường __v là trường mặc định của Mongoose để versioning
        return ret;
      }
    },
    toObject: { virtuals: true }
   }
);

// Số giây còn lại khi phòng kết thúc
quizRoomSchema.virtual('timeRemaining').get(function() {
  if (!this.isActive || !this.endTime) return 0;
  return Math.max(0, this.endTime - new Date());
});

quizRoomSchema.pre('save', function(next) {
  if ((this.isModified('startTime') || this.isModified('durationMinutes'))) {
    if (this.startTime && this.durationMinutes) {
      this.endTime = new Date(
        this.startTime.getTime() + this.durationMinutes * 60000
      );
    }
  }
  next();
});

// Tự động bật phòng
quizRoomSchema.statics.autoActivateRooms = async function() {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 300000); // 5 phút trước

  // Lấy ds rôm phù hợp hoặc chưa dc kiểm tra hoặc 5 trước
  const roomsToActivate = await this.find({
    status: 'scheduled',
    autoStart: true,
    startTime: { $lte: now },
    $or: [
      { lastActivationCheck: { $exists: false } },
      { lastActivationCheck: { $lt: fiveMinutesAgo } },
      { lastActivationCheck: null }
    ]
  });

  const activationPromises = roomsToActivate.map(async (room) => {
    try {
      room.status = 'active';
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

  const activatedRooms = (await Promise.all(activationPromises)).filter(Boolean);
  return activatedRooms
};

// Tự động tắt phòng
quizRoomSchema.statics.autoCompleteRooms = async function() {
  const now = new Date();
  const roomsToComplete = await this.find({
    status: 'active',
    isActive: true,
    endTime: { $ne: null, $lte: now } // không null và nho hơn hoặc bằng 
  });

  const updatePromises = roomsToComplete.map(async (room) => {
    room.status = 'completed';
    room.isActive = false;
    await room.save();
    return { success: true, room };
  });

  await Promise.all(updatePromises);
  return roomsToComplete;
};

// Mở phòng thủ công
quizRoomSchema.methods.startRoom = async function() {
  if (this.status !== 'scheduled') {
    throw new Error(`Không thể bắt đầu phòng ở trạng thái ${this.status}`);
  }

  const now = new Date();
  this.startTime = now;
  this.endTime = new Date(now.getTime() + this.durationMinutes * 60000);
  this.status = 'active';
  this.isActive = true;
  this.lastActivationCheck = now;

  return this.save();
};

// Đóng thủ công
quizRoomSchema.methods.completeRoom = async function() {
  if (this.status !== 'active') {
    throw new Error(`Không thể kết thúc phòng ở trạng thái ${this.status}`);
  }

  const now = new Date().toISOString();
  this.status = 'completed';
  this.endTime = now;
  this.isActive = false;
  await this.save();
  console.log()
  return {
    endTime: this.endTime,
    status: this.status
  };
};

// Plugins
quizRoomSchema.plugin(mongoosePaginate);
// Indexes
quizRoomSchema.index({ status: 1, autoStart: 1, startTime: 1 });

const QuizRoom = mongoose.model("QuizRoom", quizRoomSchema);
export default QuizRoom;