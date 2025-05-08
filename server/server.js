import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/mongodb.js";
import { clerkWebhooks } from "./controllers/webhooks.js";
import { clerkMiddleware } from "@clerk/express";
import quizRoutes from "./routes/quiz.js";
import questionRoutes from "./routes/questions.js";
import connectCloudinary from "./configs/cloudinary.js";

const app = express();

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`PORT running at ${PORT}`);
});
