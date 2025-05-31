import Question from "../models/Question.js";
import Quiz from "../models/Quiz.js";
import { v2 as cloudinary } from "cloudinary";
import Participant from "../models/Participant.js";
import Submission from "../models/Submission.js";
import mongoose from "mongoose";
import User from "../models/User.js";
import QuizSession from "../models/QuizSession.js";
import ExamSet from "../models/ExamSet.js";

async function createQuiz(req, res) {
  try {
    const userId = req.auth.userId;
    const {
      name,
      topic,
      difficulty,
      timePerQuestion,
      scorePerQuestion,
      questions = [],
      questionBankQueries = [],
    } = req.body;
    const isPublic = req.body.isPublic === "true";
    const isExam = req.body.isExam === "true";

    const imageFile = req.file;
    console.log("ddax vao coon");
    console.log("quiz info:", {
      name,
      topic,
      difficulty,
      timePerQuestion,
      scorePerQuestion,
      isPublic,
      questions,
      questionBankQueries,
      isExam,
    });
    // 1. Kiểm tra ảnh
    if (!imageFile) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn ảnh nền cho quiz",
      });
    }
    console.log("dungs");

    // 2. Kiểm tra các trường bắt buộc
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Thiếu trường name",
      });
    }
    console.log("dungs");

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: "Thiếu trường topic",
      });
    }
    console.log("dungs");

    // 3. Nếu người dùng có nhập difficulty → validate giá trị
    if (difficulty && !["easy", "medium", "hard"].includes(difficulty)) {
      return res.status(400).json({
        success: false,
        message:
          "Nếu nhập difficulty, giá trị phải là 'easy', 'medium' hoặc 'hard'",
      });
    }

    console.log("dungs");

    // 3. Parse questionBankQueries nếu là chuỗi JSON (FormData)
    let parsedQueries = questionBankQueries;
    if (typeof questionBankQueries === "string") {
      try {
        parsedQueries = JSON.parse(questionBankQueries);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "questionBankQueries không đúng định dạng JSON",
        });
      }
    }
    console.log("dungs: ", parsedQueries);

    // 4. Nếu là bài thi thì kiểm tra từng query
    if (isExam) {
      if (!Array.isArray(parsedQueries) || parsedQueries.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Phải cung cấp questionBankQueries khi isExam = true",
        });
      }
      console.log("ddax vao");
      for (const { examSetId, difficulty: diff, limit } of parsedQueries) {
        if (!examSetId || !limit || limit <= 0) {
          return res.status(400).json({
            success: false,
            message: "Mỗi query cần có examSetId và limit > 0",
          });
        }
        console.log("ddax vao");

        const bank = await ExamSet.findById(examSetId);
        if (!bank) {
          return res.status(400).json({
            success: false,
            message: `Không tìm thấy ngân hàng câu hỏi có id: ${examSetId}`,
          });
        }
        console.log("ddax vao");

        const filter = { examSetId: new mongoose.Types.ObjectId(examSetId) };
        if (diff) {
          if (!["easy", "medium", "hard"].includes(diff)) {
            console.log(
              "Difficulty trong query phải là 'easy', 'medium' hoặc 'hard'"
            );
            return res.status(400).json({
              success: false,
              message:
                "Difficulty trong query phải là 'easy', 'medium' hoặc 'hard'",
            });
          }
          filter.difficulty = diff;
        }
        console.log(filter);
        console.log("ddax vao");

        const count = await Question.countDocuments(filter);
        if (count === 0) {
          console.log(
            `Không có câu hỏi phù hợp trong ngân hàng "${bank.name}"`
          );
          return res.status(400).json({
            success: false,
            message: `Không có câu hỏi phù hợp trong ngân hàng "${bank.name}"`,
          });
        }
        console.log("ddax vao");

        if (count < limit) {
          return res.status(400).json({
            success: false,
            message: `Ngân hàng "${bank.name}" chỉ có ${count} câu hỏi (yêu cầu ${limit})`,
          });
        }
      }
    }
    console.log("dungs");

    // 5. Upload ảnh
    let imageUrl = "";
    try {
      const result = await cloudinary.uploader.upload(imageFile.path);
      imageUrl = result.secure_url;
    } catch (uploadErr) {
      return res.status(500).json({
        success: false,
        message: "Lỗi khi upload ảnh: " + uploadErr.message,
      });
    }

    // 6. Tạo quiz
    const newQuiz = new Quiz({
      creator: userId,
      name,
      topic,
      difficulty,
      timePerQuestion,
      scorePerQuestion,
      isPublic,
      imageUrl,
      isExam,
      questions: isExam ? [] : questions,
      questionBankQueries: isExam ? parsedQueries : [],
    });

    await newQuiz.save();

    // 7. Cập nhật user
    await User.findByIdAndUpdate(userId, {
      $push: { createdQuizzes: newQuiz._id },
    });

    return res.status(201).json({
      success: true,
      message: "Quiz được tạo thành công",
      quiz: newQuiz,
    });
  } catch (error) {
    console.error("Lỗi khi tạo quiz:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo quiz",
    });
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

    const quizzes = await Quiz.find({
      creator: userId,
      isExam: false,
    }).populate({
      path: "creator",
      model: "User",
      select: "name imageUrl",
    });

    // Tùy chọn: Thêm câu hỏi cho mỗi quiz
    const quizzesWithQuestions = await Promise.all(
      quizzes.map(async (quiz) => {
        const questions = await Question.find({ quizId: quiz._id });
        const quizObj = quiz.toObject();

        // Format creator info
        if (quizObj.creator) {
          quizObj.creatorInfo = {
            name: quizObj.creator.name || "Unknown User",
            avatar: quizObj.creator.imageUrl || "",
          };
        }

        return {
          ...quizObj,
          questions,
        };
      })
    );

    res.json(quizzesWithQuestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function getUserExams(req, res) {
  try {
    const { userId } = req.params;

    const exams = await Quiz.find({
      creator: userId,
      isExam: true,
    }).populate({
      path: "creator",
      model: "User",
      select: "name imageUrl",
    });

    const examsWithDetails = await Promise.all(
      exams.map(async (exam) => {
        const questions = await Question.find({ quizId: exam._id });
        const examObj = exam.toObject();

        // Format creator info
        if (examObj.creator) {
          examObj.creatorInfo = {
            name: examObj.creator.name || "Unknown User",
            avatar: examObj.creator.imageUrl || "",
          };
        }

        // Tính số người đã làm bài thi này
        const participantCount = await Participant.countDocuments({
          quiz: exam._id,
          isLoggedIn: true,
        });

        return {
          ...examObj,
          questions,
          participantCount,
        };
      })
    );

    res.json({
      success: true,
      data: examsWithDetails,
    });
  } catch (error) {
    console.error("Error fetching user exams:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// Get quiz by ID
const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate("questions")
      .lean();

    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    // Nếu là bài thi và có questionBankQueries, tạo bộ câu hỏi ngẫu nhiên
    // Kiểm tra xem người dùng đã tham gia phòng chưa
    const participant = await Participant.findOne({
      quizRoom: quiz._id,
      user: req.auth.userId,
    }).populate("remainingQuestions");

    if (participant) {
      // Nếu đã tham gia, sử dụng bộ câu hỏi đã lưu
      console.log("Using saved questions for existing participant");
      quiz.questions = [
        ...participant.remainingQuestions,
        ...participant.answeredQuestions.map((a) => a.questionId),
      ];
    } else if (
      quiz.questionBankQueries &&
      quiz.questionBankQueries.length > 0
    ) {
      console.log("Generating random questions from question bank");
      const allQuestions = [];

      for (const criteria of quiz.questionBankQueries) {
        const { examSetId, difficulty, limit } = criteria;
        console.log(`Fetching questions for bank ${examSetId}`);

        // Tạo filter để lấy câu hỏi theo điều kiện
        const filter = { examSetId: new mongoose.Types.ObjectId(examSetId) };
        if (difficulty) {
          filter.difficulty = difficulty;
        }

        const matched = await Question.find(filter);
        console.log(`Found ${matched.length} matching questions`);

        const shuffled = matched.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, limit);
        allQuestions.push(...selected);
      }

      // Trộn tất cả câu hỏi đã chọn
      quiz.questions = allQuestions.sort(() => 0.5 - Math.random());
      console.log(`Generated ${quiz.questions.length} random questions`);
    }

    res.json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    console.error("Error in getQuizById:", error);
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
      quiz.isPublic = updateData.isPublic === "true";
      quiz.timePerQuestion =
        Number(updateData.timePerQuestion) || quiz.timePerQuestion;
      quiz.scorePerQuestion =
        Number(updateData.scorePerQuestion) || quiz.scorePerQuestion;

      // Handle questionBankQueries if provided
      if (updateData.questionBankQueries) {
        try {
          const parsedQueries =
            typeof updateData.questionBankQueries === "string"
              ? JSON.parse(updateData.questionBankQueries)
              : updateData.questionBankQueries;

          quiz.questionBankQueries = parsedQueries;
          quiz.isExam = parsedQueries.length > 0;
        } catch (parseError) {
          console.error("Error parsing questionBankQueries:", parseError);
          return res.status(400).json({
            success: false,
            message: "Invalid questionBankQueries format",
          });
        }
      }

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
    const {
      quizId,
      userAnswers,
      score,
      userId,
      username,
      totalScore,
      deviceId,
    } = req.body;

    console.log("Saving quiz results with data:", {
      quizId,
      userAnswersCount: userAnswers?.length || 0,
      score,
      userId,
      username,
      totalScore,
      deviceId,
    });

    if (!quizId || !userAnswers || score === undefined) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: quizId, userAnswers, and score are required",
      });
    }

    // Increment the quiz play count
    await Quiz.findByIdAndUpdate(quizId, { $inc: { totalPlays: 1 } });

    // Create a participant record
    const participantData = {
      score: score,
      isLoggedIn: false, // Mặc định là false, sẽ set true nếu có userId
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
        isCorrect: answer.isCorrect,
        score: answer.score || 0,
        timeToAnswer: answer.timeToAnswer,
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
            status: "active",
          },
          {
            status: "completed",
            participant: participant._id,
          }
        );
      } catch (sessionError) {
        console.log(
          "No active session found or error updating session:",
          sessionError
        );
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
                joinedAt: new Date(),
              },
            },
          },
          { new: true }
        );

        if (userUpdate) {
          console.log(`Updated user ${userId} with new participation`);
        } else {
          console.log(`User ${userId} not found in database`);
        }
      } catch (userUpdateError) {
        console.error(
          "Error updating user with participation:",
          userUpdateError
        );
        // Không return lỗi ở đây - chúng ta vẫn muốn lưu kết quả quiz dù user update fails
      }
    }

    res.status(201).json({
      success: true,
      message: "Quiz results saved successfully",
      participantId: participant._id,
    });
  } catch (error) {
    console.error("Error saving quiz results:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save quiz results: " + error.message,
    });
  }
}

// Get user's quiz history
async function getUserQuizHistory(req, res) {
  try {
    const userId = req.params.userId;

    if (!userId) {
      console.log("No userId provided in request");
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    console.log(`Fetching quiz history for user: ${userId}`);

    // Kiểm tra xem user có tồn tại không
    const user = await User.findById(userId);
    if (!user) {
      console.log(`User not found with ID: ${userId}`);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Tìm tất cả các lần tham gia của người dùng, sắp xếp theo thời gian mới nhất
    const participations = await Participant.find({
      user: userId,
      isLoggedIn: true,
    })
      .populate({
        path: "quiz",
        select:
          "_id name imageUrl difficulty topic totalPlays createdAt isExam",
        model: "Quiz",
      })
      .sort({ joinedAt: -1 })
      .lean()
      .exec();

    console.log(`Found ${participations.length} participations`);

    // Tạo thông tin chi tiết hơn cho mỗi lần tham gia
    const quizHistory = await Promise.all(
      participations.map(async (participation) => {
        try {
          if (!participation.quiz) {
            console.log(
              `Skipping participation ${participation._id} - no quiz data`
            );
            return null;
          }

          // Lấy danh sách submissions
          const submissions = await Submission.find({
            participant: participation._id,
          })
            .populate("question", "questionText")
            .lean()
            .exec();

          // Tính tỉ lệ đúng/sai
          const correctAnswers = submissions.filter(
            (sub) => sub.isCorrect
          ).length;
          const totalAnswers = submissions.length;
          const correctPercentage =
            totalAnswers > 0
              ? Math.round((correctAnswers / totalAnswers) * 100)
              : 0;

          // Lấy thông tin câu hỏi của quiz
          const quizQuestions = await Question.find({
            quizId: participation.quiz._id,
          })
            .select("_id questionText")
            .lean()
            .exec();

          return {
            participationId: participation._id,
            quiz: {
              _id: participation.quiz._id,
              name: participation.quiz.name,
              imageUrl: participation.quiz.imageUrl,
              difficulty: participation.quiz.difficulty,
              topic: participation.quiz.topic,
              totalPlays: participation.quiz.totalPlays,
              createdAt: participation.quiz.createdAt,
              isExam: participation.quiz.isExam,
              questions: quizQuestions || [],
            },
            score: participation.score || 0,
            joinedAt: participation.joinedAt || participation.createdAt,
            stats: {
              totalQuestions: totalAnswers,
              correctAnswers,
              incorrectAnswers: totalAnswers - correctAnswers,
              correctPercentage,
            },
          };
        } catch (error) {
          console.error(
            `Error processing participation ${participation._id}:`,
            error
          );
          return null;
        }
      })
    );

    // Lọc bỏ các kết quả null
    const validQuizHistory = quizHistory.filter((history) => history !== null);

    console.log(
      `Successfully processed ${validQuizHistory.length} quiz histories`
    );

    res.status(200).json({
      success: true,
      data: validQuizHistory,
    });
  } catch (error) {
    console.error("Error fetching user quiz history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user quiz history: " + error.message,
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
        message: "Missing required fields: quizId and deviceId are required",
      });
    }

    console.log(
      `Saving quiz session for quizId: ${quizId}, deviceId: ${deviceId}`
    );

    // Kiểm tra nếu quizId là MongoDB ObjectId hợp lệ
    if (!mongoose.isValidObjectId(quizId)) {
      console.log(`Invalid ObjectId format for quizId: ${quizId}`);
      return res.status(400).json({
        success: false,
        message: "Invalid quiz ID format",
      });
    }

    // Tìm phiên chơi quiz hiện tại nếu có
    let session = await QuizSession.findOne({
      quiz: quizId,
      deviceId: deviceId,
      status: "active",
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
        sessionId: session._id,
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
        status: "active",
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
        sessionId: newSession._id,
      });
    }
  } catch (error) {
    console.error("Error saving quiz session:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save quiz session: " + error.message,
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
        message: "Missing required query parameters: quizId and deviceId",
      });
    }

    console.log(
      `Fetching quiz session for quizId: ${quizId}, deviceId: ${deviceId}`
    );

    // Kiểm tra nếu quizId là MongoDB ObjectId hợp lệ
    let query = { deviceId, status: "active" };

    if (mongoose.isValidObjectId(quizId)) {
      query.quiz = quizId;
    } else {
      console.log(`Invalid ObjectId format for quizId: ${quizId}`);
      return res.status(404).json({
        success: false,
        message: "No active quiz session found (invalid quiz ID)",
      });
    }

    // Tìm phiên chơi quiz hiện tại
    const session = await QuizSession.findOne(query);

    if (!session) {
      console.log("No active session found with the provided parameters");
      return res.status(404).json({
        success: false,
        message: "No active quiz session found",
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
          score: session.score,
        },
        userAnswers: session.userAnswers,
        timeLeft: session.timeLeft,
      },
    });
  } catch (error) {
    console.error("Error getting quiz session:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get quiz session: " + error.message,
    });
  }
}

// Đánh dấu phiên chơi đã hoàn thành
async function completeQuizSession(req, res) {
  try {
    console.log("completeQuizSession called with body:", req.body);

    const { quizId, deviceId } = req.body;

    if (!quizId || !deviceId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: quizId and deviceId",
      });
    }

    // Kiểm tra nếu quizId là MongoDB ObjectId hợp lệ
    if (!mongoose.isValidObjectId(quizId)) {
      console.log(`Invalid ObjectId format for quizId: ${quizId}`);
      return res.status(400).json({
        success: false,
        message: "Invalid quiz ID format",
      });
    }

    console.log("Searching for session with query:", {
      quiz: quizId,
      deviceId: deviceId,
      status: "active",
    });

    // Tìm phiên chơi quiz hiện tại
    const session = await QuizSession.findOne({
      quiz: quizId,
      deviceId: deviceId,
      status: "active",
    });

    console.log("Found session:", session);

    if (!session) {
      console.log("No active session found with the provided parameters");
      return res.status(404).json({
        success: false,
        message: "No active quiz session found",
      });
    }

    // Cập nhật trạng thái phiên chơi
    session.status = "completed";
    await session.save();

    console.log("Session marked as completed:", session._id);

    res.status(200).json({
      success: true,
      message: "Quiz session marked as completed",
    });
  } catch (error) {
    console.error("Error completing quiz session:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete quiz session: " + error.message,
    });
  }
}

export {
  createQuiz,
  getQuizById,
  getAllQuiz,
  updateQuizQuestions,
  getUserQuizzes,
  getUserExams,
  updateQuiz,
  deleteQuiz,
  saveQuizResults,
  getUserQuizHistory,
  saveQuizSession,
  getQuizSession,
  completeQuizSession,
};
