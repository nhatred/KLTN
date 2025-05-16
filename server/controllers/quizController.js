import Question from "../models/Question.js";
import Quiz from "../models/Quiz.js";
import { v2 as cloudinary } from "cloudinary";
import Participant from "../models/Participant.js";
import Submission from "../models/Submission.js";
import mongoose from "mongoose";
import User from "../models/User.js";
import QuizSession from "../models/QuizSession.js";

async function createQuiz(req, res) {
  try {
    const userId = req.auth.userId;
    const quizData = req.body;
    const imageFile = req.file;
    // Cần Thêm chức năng giảm kích thước hình ảnh (Ảnh lớn hơn 20mb sẽ lỗi)
    if (!imageFile) {
      return res.json({ success: false, message: "Image Quiz not attached" });
    }
    quizData.creator = userId;

    try {
      try {
        console.log("Uploading image to Cloudinary:", imageFile);
        const imageUpload = await cloudinary.uploader.upload(imageFile.path);

        // Lấy URL của ảnh từ kết quả upload
        quizData.imageUrl = imageUpload.secure_url;
      } catch (cloudinaryError) {
        console.log("Image Quiz Error: ", cloudinaryError.message);
        return res.json({
          success: false,
          message: "Error uploading image: " + cloudinaryError.message,
        });
      }
      const newQuiz = await Quiz.create(quizData);
      res.json({
        success: true,
        message: "Quiz Added Success!",
        _id: newQuiz._id,
      });
    } catch (error) {
      console.log("Error Create New Quiz" + error);
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
}

async function getAllQuiz(req, res) {
  try {
    const quizzes = await Quiz.find();
    const quizzesWithQuestions = await Promise.all(
      quizzes.map(async (quiz) => {
        const questions = await Question.find({ quizId: quiz._id });
        return {
          ...quiz.toObject(),
          questions,
        };
      })
    );
    res.json(quizzesWithQuestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Trong controllers/quizController.js
async function updateQuizQuestions(req, res) {
  try {
    const { quizId } = req.params;
    const { questionIds } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Cập nhật danh sách câu hỏi
    quiz.questions = questionIds;
    await quiz.save();

    res.json({
      success: true,
      message: "Quiz updated with questions",
      quiz,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update quiz",
      error: error.message,
    });
  }
}

async function getUserQuizzes(req, res) {
  try {
    const { userId } = req.params;

    const quizzes = await Quiz.find({ creator: userId });

    // Tùy chọn: Thêm câu hỏi cho mỗi quiz
    const quizzesWithQuestions = await Promise.all(
      quizzes.map(async (quiz) => {
        const questions = await Question.find({ quizId: quiz._id });
        return {
          ...quiz.toObject(),
          questions,
        };
      })
    );

    res.json(quizzesWithQuestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Get quiz by ID
const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate("questions")
      .lean();

    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    res.json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// New function to update quiz
async function updateQuiz(req, res) {
  try {
    console.log("Updating quiz:", req.params.id);
    console.log("Update data:", req.body);

    // Check authentication
    if (!req.auth || !req.auth.userId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const userId = req.auth.userId;
    const quizId = req.params.id;
    const updateData = req.body;
    const imageFile = req.file;

    // Validate required fields
    if (!updateData.name || !updateData.topic || !updateData.difficulty) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: name, topic, and difficulty are required",
      });
    }

    // Find the quiz
    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res
        .status(404)
        .json({ success: false, message: "Quiz not found" });
    }

    // Check if user is the creator
    if (quiz.creator.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this quiz",
      });
    }

    try {
      // Update basic quiz information
      quiz.name = updateData.name;
      quiz.topic = updateData.topic;
      quiz.difficulty = updateData.difficulty;
      quiz.isPublic = updateData.isPublic || quiz.isPublic;
      quiz.timePerQuestion =
        Number(updateData.timePerQuestion) || quiz.timePerQuestion;
      quiz.scorePerQuestion =
        Number(updateData.scorePerQuestion) || quiz.scorePerQuestion;

      // Handle image update if a new image is provided
      if (imageFile) {
        try {
          console.log("Uploading new image to Cloudinary");

          // Upload new image
          const uploadResult = await cloudinary.uploader.upload(
            imageFile.path,
            {
              resource_type: "image",
              folder: "quiz_images",
              transformation: [{ width: 1000, crop: "limit" }],
            }
          );

          // Update the image URL
          quiz.imageUrl = uploadResult.secure_url;
          console.log(
            "New image uploaded successfully:",
            uploadResult.secure_url
          );
        } catch (cloudinaryError) {
          console.error("Failed to upload new image:", cloudinaryError);
          return res.status(500).json({
            success: false,
            message: "Error uploading new image: " + cloudinaryError.message,
          });
        }
      }

      // Save the updated quiz
      await quiz.save();
      console.log("Quiz updated successfully");

      res.status(200).json({
        success: true,
        message: "Quiz updated successfully",
        quiz: quiz,
      });
    } catch (saveError) {
      console.error("Error saving quiz:", saveError);
      return res.status(500).json({
        success: false,
        message: "Failed to save quiz updates: " + saveError.message,
      });
    }
  } catch (error) {
    console.error("Quiz update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update quiz: " + error.message,
    });
  }
}

async function deleteQuiz(req, res) {
  try {
    const userId = req.auth.userId;
    const quizId = req.params.id;

    // Find the quiz
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Check if user is the creator
    if (quiz.creator.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this quiz",
      });
    }

    // Delete all questions associated with this quiz
    await Question.deleteMany({ quizId: quizId });

    // Delete the quiz
    await Quiz.findByIdAndDelete(quizId);

    res.json({
      success: true,
      message: "Quiz and associated questions deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete quiz: " + error.message,
    });
  }
}

// Save quiz results
async function saveQuizResults(req, res) {
  try {
    const { quizId, userAnswers, score, userId, username, totalScore, deviceId } = req.body;
    
    console.log("Saving quiz results with data:", {
      quizId,
      userAnswersCount: userAnswers?.length || 0,
      score,
      userId,
      username,
      totalScore,
      deviceId
    });
    
    if (!quizId || !userAnswers || score === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: quizId, userAnswers, and score are required"
      });
    }
    
    // Increment the quiz play count
    await Quiz.findByIdAndUpdate(quizId, { $inc: { totalPlays: 1 } });
    
    // Create a participant record
    const participantData = {
      score: score,
      isLoggedIn: false // Mặc định là false, sẽ set true nếu có userId
    };
    
    // Xử lý thông tin người dùng
    if (userId && userId !== "undefined" && userId !== "null") {
      // Người dùng đã đăng nhập (có Clerk auth)
      console.log("Saving authenticated user with ID:", userId);
      participantData.user = userId; // Clerk ID là string, đã sửa schema
      participantData.isLoggedIn = true;
    } else if (username && username !== "undefined" && username !== "null") {
      // Người dùng không đăng nhập nhưng có username
      console.log("Saving unauthenticated user with username:", username);
      participantData.temporaryUsername = username;
    } else {
      // Người dùng ẩn danh
      console.log("Saving anonymous user");
      participantData.temporaryUsername = "Anonymous";
    }
    
    // Lưu thông tin quiz vào participant
    if (quizId) {
      participantData.quiz = quizId;
    }
    
    // Lưu deviceId nếu có
    if (deviceId) {
      participantData.deviceId = deviceId;
    }
    
    console.log("Creating participant with data:", participantData);
    
    // Tạo participant và liên kết với quiz (không phải quizRoom)
    const participant = await Participant.create(participantData);
    console.log("Created participant:", participant._id);
    
    // Save each answer as a submission with reference to quiz
    const submissions = [];
    for (const answer of userAnswers) {
      // Xử lý lưu từng câu trả lời
      const submissionData = {
        participant: participant._id,
        question: answer.questionId,
        answer: answer.userAnswer,
        isCorrect: answer.correct,
        score: answer.score || 0,
        timeToAnswer: answer.timeToAnswer
      };
      
      // Thêm reference tới quiz đã chơi
      if (quizId) {
        submissionData.quiz = quizId;
      }
      
      // Thêm reference tới user nếu đã đăng nhập
      if (participantData.isLoggedIn && userId) {
        submissionData.user = userId;
      }
      
      const submission = await Submission.create(submissionData);
      submissions.push(submission._id);
    }
    
    // Update participant with submissions
    participant.submissions = submissions;
    await participant.save();
    
    // Đánh dấu phiên chơi quiz trên server là đã hoàn thành nếu có deviceId
    if (deviceId) {
      try {
        await QuizSession.findOneAndUpdate(
          {
            quiz: quizId,
            deviceId: deviceId,
            status: 'active'
          },
          {
            status: 'completed',
            participant: participant._id
          }
        );
      } catch (sessionError) {
        console.log("No active session found or error updating session:", sessionError);
        // Tiếp tục xử lý bình thường
      }
    }
    
    // Nếu người dùng đã đăng nhập, cập nhật lịch sử tham gia trong User model
    if (participantData.isLoggedIn && userId) {
      try {
        // Cập nhật User.participations và recentlyJoinedQuizzes
        const userUpdate = await User.findByIdAndUpdate(
          userId,
          {
            $push: {
              participations: participant._id,
              recentlyJoinedQuizzes: {
                quizId: quizId,
                joinedAt: new Date()
              }
            }
          },
          { new: true }
        );
        
        if (userUpdate) {
          console.log(`Updated user ${userId} with new participation`);
        } else {
          console.log(`User ${userId} not found in database`);
        }
      } catch (userUpdateError) {
        console.error("Error updating user with participation:", userUpdateError);
        // Không return lỗi ở đây - chúng ta vẫn muốn lưu kết quả quiz dù user update fails
      }
    }
    
    res.status(201).json({
      success: true,
      message: "Quiz results saved successfully",
      participantId: participant._id
    });
  } catch (error) {
    console.error("Error saving quiz results:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save quiz results: " + error.message
    });
  }
}

// Get user's quiz history
async function getUserQuizHistory(req, res) {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }
    
    console.log(`Fetching quiz history for user: ${userId}`);
    
    // Tìm tất cả các lần tham gia của người dùng, sắp xếp theo thời gian mới nhất
    const participations = await Participant.find({ 
      user: userId,
      isLoggedIn: true
    })
    .populate({
      path: 'quiz',
      select: '_id name imageUrl difficulty topic totalPlays createdAt',
      populate: {
        path: 'questions',
        select: '_id questionText'
      }
    })
    .sort({ joinedAt: -1 })
    .lean()
    .exec();
    
    console.log(`Found ${participations.length} participations`);
    
    // Tạo thông tin chi tiết hơn cho mỗi lần tham gia
    const quizHistory = await Promise.all(participations.map(async (participation) => {
      try {
        // Lấy danh sách submissions
        const submissions = await Submission.find({
          participant: participation._id
        })
        .populate('question', 'questionText')
        .lean()
        .exec();
        
        // Tính tỉ lệ đúng/sai
        const correctAnswers = submissions.filter(sub => sub.isCorrect).length;
        const totalAnswers = submissions.length;
        const correctPercentage = totalAnswers > 0 
          ? Math.round((correctAnswers / totalAnswers) * 100) 
          : 0;
        
        return {
          participationId: participation._id,
          quiz: participation.quiz,
          score: participation.score,
          joinedAt: participation.joinedAt,
          stats: {
            totalQuestions: totalAnswers,
            correctAnswers,
            incorrectAnswers: totalAnswers - correctAnswers,
            correctPercentage
          }
        };
      } catch (error) {
        console.error(`Error processing participation ${participation._id}:`, error);
        return null;
      }
    }));
    
    // Lọc bỏ các kết quả null
    const validQuizHistory = quizHistory.filter(history => history !== null);
    
    console.log(`Successfully processed ${validQuizHistory.length} quiz histories`);
    
    res.status(200).json({
      success: true,
      data: validQuizHistory
    });
    
  } catch (error) {
    console.error("Error fetching user quiz history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user quiz history: " + error.message
    });
  }
}

// Lưu hoặc cập nhật phiên chơi quiz
async function saveQuizSession(req, res) {
  try {
    const { quizId, quizState, userAnswers, timeLeft, deviceId } = req.body;
    const userId = req.body.userId || null;
    
    if (!quizId || !deviceId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: quizId and deviceId are required"
      });
    }
    
    console.log(`Saving quiz session for quizId: ${quizId}, deviceId: ${deviceId}`);
    
    // Kiểm tra nếu quizId là MongoDB ObjectId hợp lệ
    if (!mongoose.isValidObjectId(quizId)) {
      console.log(`Invalid ObjectId format for quizId: ${quizId}`);
      return res.status(400).json({
        success: false,
        message: "Invalid quiz ID format"
      });
    }
    
    // Tìm phiên chơi quiz hiện tại nếu có
    let session = await QuizSession.findOne({
      quiz: quizId,
      deviceId: deviceId,
      status: 'active'
    });
    
    // Cập nhật phiên chơi nếu tồn tại, nếu không tạo mới
    if (session) {
      console.log(`Updating existing session: ${session._id}`);
      
      session.currentQuestion = quizState.currentQuestion;
      session.timeLeft = timeLeft;
      session.score = quizState.score;
      session.userAnswers = userAnswers;
      session.updatedAt = new Date();
      session.expiresAt = new Date(Date.now() + 30 * 60 * 1000); // Gia hạn thêm 30 phút
      
      await session.save();
      
      res.status(200).json({
        success: true,
        message: "Quiz session updated",
        sessionId: session._id
      });
    } else {
      console.log(`Creating new session for quiz ${quizId}`);
      
      // Tạo phiên chơi mới
      const sessionData = {
        quiz: quizId,
        deviceId: deviceId,
        currentQuestion: quizState.currentQuestion,
        timeLeft: timeLeft,
        score: quizState.score,
        userAnswers: userAnswers,
        status: 'active'
      };
      
      // Thêm thông tin người dùng nếu đã đăng nhập
      if (userId) {
        sessionData.user = userId;
        sessionData.isLoggedIn = true;
      } else if (req.body.username) {
        sessionData.temporaryUsername = req.body.username;
        sessionData.isLoggedIn = false;
      }
      
      const newSession = await QuizSession.create(sessionData);
      console.log(`Created new session: ${newSession._id}`);
      
      res.status(201).json({
        success: true,
        message: "Quiz session created",
        sessionId: newSession._id
      });
    }
  } catch (error) {
    console.error("Error saving quiz session:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save quiz session: " + error.message
    });
  }
}

// Lấy phiên chơi quiz hiện tại
async function getQuizSession(req, res) {
  try {
    const { quizId, deviceId } = req.query;
    
    if (!quizId || !deviceId) {
      return res.status(400).json({
        success: false,
        message: "Missing required query parameters: quizId and deviceId"
      });
    }
    
    console.log(`Fetching quiz session for quizId: ${quizId}, deviceId: ${deviceId}`);
    
    // Kiểm tra nếu quizId là MongoDB ObjectId hợp lệ
    let query = { deviceId, status: 'active' };
    
    if (mongoose.isValidObjectId(quizId)) {
      query.quiz = quizId;
    } else {
      console.log(`Invalid ObjectId format for quizId: ${quizId}`);
      return res.status(404).json({
        success: false,
        message: "No active quiz session found (invalid quiz ID)"
      });
    }
    
    // Tìm phiên chơi quiz hiện tại
    const session = await QuizSession.findOne(query);
    
    if (!session) {
      console.log('No active session found with the provided parameters');
      return res.status(404).json({
        success: false,
        message: "No active quiz session found"
      });
    }
    
    // Cập nhật thời gian hết hạn
    session.expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await session.save();
    
    console.log(`Found and returning active session: ${session._id}`);
    
    res.status(200).json({
      success: true,
      data: {
        quizState: {
          showWelcome: false,
          showQuiz: true,
          showResults: false,
          currentQuestion: session.currentQuestion,
          score: session.score
        },
        userAnswers: session.userAnswers,
        timeLeft: session.timeLeft
      }
    });
  } catch (error) {
    console.error("Error getting quiz session:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get quiz session: " + error.message
    });
  }
}

// Đánh dấu phiên chơi đã hoàn thành
async function completeQuizSession(req, res) {
  try {
    console.log('completeQuizSession called with body:', req.body);
    
    const { quizId, deviceId } = req.body;
    
    if (!quizId || !deviceId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: quizId and deviceId"
      });
    }
    
    // Kiểm tra nếu quizId là MongoDB ObjectId hợp lệ
    if (!mongoose.isValidObjectId(quizId)) {
      console.log(`Invalid ObjectId format for quizId: ${quizId}`);
      return res.status(400).json({
        success: false,
        message: "Invalid quiz ID format"
      });
    }

    console.log('Searching for session with query:', {
      quiz: quizId,
      deviceId: deviceId,
      status: 'active'
    });
    
    // Tìm phiên chơi quiz hiện tại
    const session = await QuizSession.findOne({
      quiz: quizId,
      deviceId: deviceId,
      status: 'active'
    });

    console.log('Found session:', session);
    
    if (!session) {
      console.log('No active session found with the provided parameters');
      return res.status(404).json({
        success: false,
        message: "No active quiz session found"
      });
    }

    // Cập nhật trạng thái phiên chơi
    session.status = 'completed';
    await session.save();
    
    console.log('Session marked as completed:', session._id);
    
    res.status(200).json({
      success: true,
      message: "Quiz session marked as completed"
    });
  } catch (error) {
    console.error("Error completing quiz session:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete quiz session: " + error.message
    });
  }
}

export {
  createQuiz,
  getQuizById,
  getAllQuiz,
  updateQuizQuestions,
  getUserQuizzes,
  updateQuiz,
  deleteQuiz,
  saveQuizResults,
  getUserQuizHistory,
  saveQuizSession,
  getQuizSession,
  completeQuizSession
};
