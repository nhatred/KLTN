import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { auth } from "@clerk/nextjs";
import quizRoutes from "./routes/quizRoutes.js";
import examSetRoutes from "./routes/examSetRoutes.js";
import quizRoomRoutes from "./routes/quizRoomRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/quiz", quizRoutes);
app.use("/api/examSets", examSetRoutes);
app.use("/api/quizRooms", quizRoomRoutes);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server is running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
