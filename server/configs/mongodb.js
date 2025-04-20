import mongoose from "mongoose";
const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("Database Connected");
    });
    await mongoose.connect(`${process.env.MONGODB_URI}/squizz`);
  } catch (error) {
    console.error("Lỗi khi kết nối MongoDB:", error);
    throw error;
  }
};

export default connectDB;
