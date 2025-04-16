import mongoose from "mongoose";
import User from "./models/User.js"; // điều chỉnh nếu cần
import dotenv from "dotenv";
dotenv.config();

console.log("📡 Đang kết nối đến MongoDB...");
console.log("🔐 MONGODB_URI:", process.env.MONGODB_URI);

const run = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/squizz`);
    console.log("✅ Kết nối MongoDB thành công!");

    const userData = {
      _id: "user_test123", // Đảm bảo _id là String
      email: "test@example.com",
      name: "Test User",
      imageUrl: "https://example.com/image.jpg",
    };

    console.log("📤 Đang tạo user...");
    const createdUser = await User.create(userData);
    console.log("✅ Đã tạo user:", createdUser);

    process.exit(0); // Đảm bảo quá trình kết thúc bình thường
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1); // Nếu có lỗi, kết thúc quá trình với mã lỗi
  }
};

run();
