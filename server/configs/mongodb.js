import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("📡 Đang kết nối đến MongoDB...");
    console.log("🔐 MONGODB_URI:", process.env.MONGODB_URI);

    await mongoose.connect(`${process.env.MONGODB_URI}/squizz`);
    console.log("✅ Kết nối MongoDB thành công!");

    mongoose.connection.on("connected", () => {
      console.log("🔌 Mongoose đã kết nối");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ Mongoose báo lỗi:", err);
    });
  } catch (error) {
    console.error("❌ Lỗi khi kết nối MongoDB:", error);
    throw error; // ném lỗi để hàm gọi nó biết
  }
};

export default connectDB;
