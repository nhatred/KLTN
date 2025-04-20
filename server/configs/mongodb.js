import mongoose from "mongoose";
const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("Database Connected");
    });
    await mongoose.connect(
      `mongodb+srv://xblacksoul:xblacksoul1276@cluster0.ebs0etv.mongodb.net/squizz`
    );
  } catch (error) {
    console.error("Lỗi khi kết nối MongoDB:", error);
    throw error;
  }
};

export default connectDB;
