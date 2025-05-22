import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/mongodb.js";
import { clerkWebhooks } from "./controllers/webhooks.js";
import quizRoutes from "./routes/quiz.js";
import questionRoutes from "./routes/questions.js";
import examSetRoutes from "./routes/examSetRoutes.js";
import connectCloudinary from "./configs/cloudinary.js";
import QuizRoomRoutes from "./routes/quizRoom.js";
import { createServer } from "http";
import { Server } from "socket.io";
import setupQuizSocket from "./ultil/socketIO.js";
import startCronJobs from "./ultil/cron.js";
import { clerkMiddleware } from "@clerk/express";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

await connectDB();
await connectCloudinary();

app.use(cors());
app.use(clerkMiddleware());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API working");
});
app.post("/clerk", clerkWebhooks);
app.use("/api/quiz", quizRoutes);
app.use("/api/question", questionRoutes);
app.use("/api/quizRoom", QuizRoomRoutes);
app.use("/api/examSets", examSetRoutes);

// Setup Socket.IO
setupQuizSocket(io);
startCronJobs(io);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running at ${PORT}`);
});
