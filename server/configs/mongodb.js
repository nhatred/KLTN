import mongoose from "mongoose";

const connectDB = async () => {
  mongoose.connection.on("connected", () => {
    console.log("Database connected");
  });
  console.log("🚀 Bắt đầu kết nối MongoDB...");
  await mongoose.connect(`${process.env.MONGODB_URI}/squizz`);
  console.log("✅ Kết nối MongoDB thành công!");
};

export default connectDB;
