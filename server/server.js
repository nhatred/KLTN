import express from "express";
import cors from "cors";
import "dotenv/config";
import { createServer } from "http";
import { Server } from "socket.io";

import connectDB from "./configs/mongodb.js";
import connectCloudinary from "./configs/cloudinary.js";

import { clerkWebhooks } from "./controllers/webhooks.js";
import { clerkMiddleware } from "@clerk/express";

import quizRoutes from "./routes/quiz.js";
import questionRoutes from "./routes/questions.js";
import examSetRoutes from "./routes/examSet.js";
import QuizRoomRoutes from "./routes/quizRoom.js";
import participantRoutes from "./routes/participant.js";
import userRoutes from "./routes/userRoutes.js";
import submissionRoutes from "./routes/submission.js";

import setupQuizSocket from "./ultil/socketIO.js";
import startCronJobs from "./ultil/cron.js";


const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],
  },
});

const startServer = async () => {
  try {
    await connectDB();
    await connectCloudinary();

    app.use(cors());
    app.use(express.json());
    app.use(clerkMiddleware());

    // Attach io to app
    app.set("io", io);

    // API routes
    app.get("/", (req, res) => {
      res.send("API working");
    });
    app.post("/clerk", clerkWebhooks);
    app.use("/api/users", userRoutes);
    app.use("/api/quiz", quizRoutes);
    app.use("/api/question", questionRoutes);
    app.use("/api/quizRoom", QuizRoomRoutes);
    app.use("/api/examSets", examSetRoutes);
    app.use("/api/participant", participantRoutes);
    app.use("/api/submission", submissionRoutes);

    // Setup socket and cron
    setupQuizSocket(io);
    startCronJobs(io);

    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1); 
  }
};

startServer();
