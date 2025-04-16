import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}`);
    mongoose.connection.on("connected", () => {
      console.log("🔌 Mongoose đã kết nối");
    });
  } catch (error) {
    console.error("Lỗi khi kết nối MongoDB:", error);
    throw error;
  }
};

export default connectDB;
