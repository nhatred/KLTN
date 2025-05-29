import ExamSet from "../models/ExamSet.js";
import Question from "../models/Question.js";
import Quiz from "../models/Quiz.js";
import mongoose from "mongoose";

// Tạo câu hỏi từ 2 loại (Ok)
async function createQuestion(req, res) {
  console.log("Đã vào create");
  try {
    const {
      quizId,
      examSetId,
      questionText,
      questionType,
      difficulty,
      options,
      dragDropPairs,
      answers,
    } = req.body;

    console.log("examSetId: ", examSetId);
    // 1. Kiểm tra dữ liệu đầu vào bắt buộc
    if ((!quizId && !examSetId) || !questionType) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: quizId or examSetId and questionType",
      });
    }

    // Chỉ thuộc quizId hoặc examSetId
    if (quizId && examSetId) {
      return res.status(400).json({
        success: false,
        message: "Only one of quizId or examSetId should be provided",
      });
    }

    let parentDoc = null;
    if (quizId) {
      // 2. Kiểm tra định dạng ObjectId
      if (!mongoose.Types.ObjectId.isValid(quizId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid quizId format",
        });
      }

      // 5. Kiểm tra quiz tồn tại và user là chủ sở hữu
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: "Quiz not found",
        });
      }

      if (quiz.creator.toString() !== req.userId) {
        return res.status(403).json({
          success: false,
          message: "You are not the owner of this quiz",
        });
      }

      parentDoc = quiz;
    }

    if (examSetId) {
      if (!mongoose.Types.ObjectId.isValid(examSetId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid examSetId format",
        });
      }
      const examSet = await ExamSet.findById(examSetId);
      console.log("Đã vào 2", examSet);

      if (!examSet) {
        return res.status(404).json({
          success: false,
          message: "Question bank not found",
        });
      }
      const userId = req.userId;
      if (examSet.createdBy.toString() !== userId) {
        console.log(examSet.createdBy.toString(), req.userId);
        return res.status(403).json({
          success: false,
          message: "You are not the owner of this question bank",
        });
      }

      parentDoc = examSet;
    }
    console.log(parentDoc);

    // 3. Kiểm tra loại câu hỏi hợp lệ
    const validQuestionTypes = [
      "multipleChoices",
      "fillInBlank",
      "paragraph",
      "dragAndDrop",
      "dropdown",
    ];

    if (!validQuestionTypes.includes(questionType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid questionType. Must be one of: ${validQuestionTypes.join(
          ", "
        )}`,
      });
    }

    // Kiểm tra mảng answers (bỏ qua nếu là dragAndDrop)
    if (questionType !== "dragAndDrop") {
      if (!Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Answers must be a non-empty array",
        });
      }

      // Validate cấu trúc answers
      const isValidAnswers = answers.every(
        (answer) =>
          answer.text &&
          typeof answer.text === "string" &&
          typeof answer.isCorrect === "boolean"
      );

      if (!isValidAnswers) {
        return res.status(400).json({
          success: false,
          message:
            "Each answer must contain text (string) and isCorrect (boolean)",
        });
      }

      // ✅ Kiểm tra các đáp án không bị trùng
      const answerTexts = answers.map((answer) =>
        answer.text.trim().toLowerCase()
      );
      const uniqueAnswerTexts = new Set(answerTexts);

      if (uniqueAnswerTexts.size !== answerTexts.length) {
        return res.status(400).json({
          success: false,
          message: "Các đáp án không được giống nhau",
        });
      }

      // Validate có ít nhất 1 đáp án đúng
      const hasCorrectAnswer = answers.some((answer) => answer.isCorrect);
      if (!hasCorrectAnswer) {
        return res.status(400).json({
          success: false,
          message: "At least one correct answer is required",
        });
      }
    }

    // 6. Kiểm tra yêu cầu riêng theo loại câu hỏi
    if (
      (questionType === "multipleChoices" || questionType === "dropdown") &&
      (!options || !Array.isArray(options) || options.length < 2)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Multiple choice/dropdown questions require at least 2 options",
      });
    }

    if (
      questionType === "dragAndDrop" &&
      (!dragDropPairs ||
        !Array.isArray(dragDropPairs) ||
        dragDropPairs.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Drag and drop questions require at least 1 drag-drop pair",
      });
    }

    console.log("DDax vuot qua vong kiem tra");

    // 8. Tạo câu hỏi mới
    const newQuestion = new Question({
      quizId: quizId || undefined,
      examSetId: examSetId || undefined,
      questionText,
      questionType,
      difficulty: difficulty || "medium",
      options,
      dragDropPairs,
      answers,
    });

    const savedQuestion = await newQuestion.save();

    // 9. Cập nhật quiz để thêm câu hỏi vào mảng questions
    parentDoc.questions.push(savedQuestion._id);
    await parentDoc.save();

    return res.status(201).json({
      success: true,
      message: "Create a successful question",
      question: savedQuestion,
    });
  } catch (error) {
    console.error("Error when creating questions:", error);
    return res.status(500).json({
      success: false,
      message: "Server error when creating questions",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// lấy chi tiết một câu hỏi ok
async function getQuestionByQuizId(req, res) {
  try {
    const quizId = req.params.id;

    // Kiểm tra quiz tồn tại
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Tìm tất cả câu hỏi có quizId tương ứng
    const questions = await Question.find({ quizId: quizId });

    res.json({
      success: true,
      data: questions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// Cập nhật một câu hỏi từ 2 loại (ok)
async function updateQuestion(req, res) {
  try {
    const questionId = req.params.id;
    const userId = req.userId;
    const updateData = req.body;

    const question = await Question.findById(questionId);
    if (!question) {
      return res
        .status(404)
        .json({ success: false, message: "Question not found" });
    }

    let isOwner = false;

    if (question.quizId) {
      const quiz = await Quiz.findById(question.quizId);
      if (quiz && quiz.creator.toString() === userId.toString()) {
        isOwner = true;
      }
    }

    if (question.examSetId && !isOwner) {
      const examSet = await ExamSet.findById(question.examSetId);
      if (examSet && examSet.createdBy.toString() === userId.toString()) {
        isOwner = true;
      }
    }

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to edit this question",
      });
    }

    if (
      updateData.quizId &&
      updateData.quizId !== question.quizId?.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "Cannot change the quiz of the question",
      });
    }

    const validTypes = [
      "multipleChoices",
      "fillInBlank",
      "paragraph",
      "dragAndDrop",
      "dropdown",
    ];
    if (
      updateData.questionType &&
      !validTypes.includes(updateData.questionType)
    ) {
      return res.status(400).json({
        success: false,
        message: `Invalid question type. Must be one of: ${validTypes.join(
          ", "
        )}`,
      });
    }

    // Validate dragAndDrop
    if (updateData.questionType === "dragAndDrop") {
      if (
        !Array.isArray(updateData.dragDropPairs) ||
        updateData.dragDropPairs.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Drag and drop must have at least 1 pair",
        });
      }
    }

    // Validate answers
    if (updateData.answers) {
      if (
        !Array.isArray(updateData.answers) ||
        updateData.answers.length === 0
      ) {
        return res
          .status(400)
          .json({ success: false, message: "There must be at least 1 answer" });
      }

      const uniqueTexts = new Set(
        updateData.answers.map((a) => a.text.trim().toLowerCase())
      );
      if (uniqueTexts.size !== updateData.answers.length) {
        return res
          .status(400)
          .json({ success: false, message: "Answers must not be duplicated" });
      }

      if (!updateData.answers.some((a) => a.isCorrect)) {
        return res.status(400).json({
          success: false,
          message: "There must be at least 1 correct answer",
        });
      }
    }

    const updatedQuestion = await Question.findByIdAndUpdate(
      questionId,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Question updated successfully",
      data: updatedQuestion,
    });
  } catch (error) {
    console.error("Error updating the question:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating the question",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// Xóa câu hỏi từ 2 loại (Ok)
async function deleteQuestion(req, res) {
  try {
    console.log("đã vào");
    const questionId = req.params.id;

    console.log(questionId);
    // Kiểm tra câu hỏi có tồn tại
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Không tìm thấy câu hỏi" });
    }
    console.log(question);
    if (question.examSetId) {
      await ExamSet.findByIdAndUpdate(question.examSetId, {
        $pull: { questions: questionId },
      });
    }
    if (question.quizId) {
      // // Cập nhật danh sách câu hỏi trong quiz
      await Quiz.findByIdAndUpdate(question.quizId, {
        $pull: { questions: questionId },
      });
    }

    // Xóa câu hỏi
    await Question.findByIdAndDelete(questionId);

    res.json({ message: "Câu hỏi đã được xóa thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
export default {
  createQuestion,
  getQuestionByQuizId,
  deleteQuestion,
  updateQuestion,
};
