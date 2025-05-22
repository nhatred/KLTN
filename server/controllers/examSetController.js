import ExamSet from "../models/ExamSet.js";
import Question from "../models/Question.js";
import Quiz from "../models/Quiz.js";

// Lấy tất cả bộ đề
export const getAllExamSets = async (req, res) => {
  try {
    const examSets = await ExamSet.find()
      .populate("questions")
      .sort({ createdAt: -1 });
    res.status(200).json(examSets);
  } catch (error) {
    console.error("Error in getAllExamSets:", error);
    res.status(500).json({ message: error.message });
  }
};

// Lấy một bộ đề theo ID
export const getExamSetById = async (req, res) => {
  try {
    const examSet = await ExamSet.findById(req.params.id).populate("questions");
    if (!examSet) {
      return res.status(404).json({ message: "Không tìm thấy bộ đề" });
    }
    res.status(200).json(examSet);
  } catch (error) {
    console.error("Error in getExamSetById:", error);
    res.status(500).json({ message: error.message });
  }
};

// Tạo bộ đề mới
export const createExamSet = async (req, res) => {
  try {
    console.log("Received data:", JSON.stringify(req.body, null, 2));

    // Validate required fields
    if (!req.body.name || !req.body.subject || !req.body.grade) {
      return res
        .status(400)
        .json({ message: "Tên đề thi, môn học và khối lớp là bắt buộc" });
    }

    if (!req.body.questions || !Array.isArray(req.body.questions)) {
      return res
        .status(400)
        .json({ message: "Danh sách câu hỏi không hợp lệ" });
    }

    // Validate each question
    for (const question of req.body.questions) {
      if (!question.questionText) {
        return res
          .status(400)
          .json({ message: "Nội dung câu hỏi là bắt buộc" });
      }
      if (!question.options || question.options.length !== 4) {
        return res
          .status(400)
          .json({ message: "Mỗi câu hỏi phải có 4 lựa chọn" });
      }
      if (!question.answers || question.answers.length === 0) {
        return res
          .status(400)
          .json({ message: "Mỗi câu hỏi phải có ít nhất một đáp án đúng" });
      }
      if (
        !question.difficulty ||
        !["easy", "medium", "hard"].includes(question.difficulty)
      ) {
        return res.status(400).json({ message: "Mức độ khó không hợp lệ" });
      }
    }

    // Lưu các câu hỏi vào Question collection
    console.log("Creating questions...");
    const savedQuestions = await Promise.all(
      req.body.questions.map(async (question) => {
        console.log("Creating question:", question);
        const newQuestion = new Question({
          questionText: question.questionText,
          questionType: "multipleChoices",
          options: question.options,
          answers: question.answers,
          difficulty: question.difficulty,
          scorePerQuestion: 1, // Mặc định mỗi câu 1 điểm
        });
        const savedQuestion = await newQuestion.save();
        console.log("Created question:", savedQuestion);
        return savedQuestion;
      })
    );
    console.log("All questions created:", savedQuestions);

    // Tạo ExamSet mới với tham chiếu đến các câu hỏi
    console.log("Creating ExamSet...");
    const newExamSet = new ExamSet({
      name: req.body.name,
      subject: req.body.subject,
      grade: req.body.grade,
      description: req.body.description || "",
      questions: savedQuestions.map((q) => q._id),
      createdBy: req.auth?.userId || "system",
    });

    const savedExamSet = await newExamSet.save();
    console.log("Created ExamSet:", savedExamSet);

    // Cập nhật examId cho các câu hỏi
    await Question.updateMany(
      { _id: { $in: savedQuestions.map((q) => q._id) } },
      { $set: { examId: savedExamSet._id } }
    );

    // Trả về ExamSet với thông tin đầy đủ của các câu hỏi
    const populatedExamSet = await ExamSet.findById(savedExamSet._id).populate(
      "questions"
    );
    console.log("Returning populated ExamSet:", populatedExamSet);
    res.status(201).json(populatedExamSet);
  } catch (error) {
    console.error("Error in createExamSet:", error);
    res.status(500).json({
      message: "Lỗi khi tạo đề thi",
      error: error.message,
      stack: error.stack,
    });
  }
};

// Cập nhật bộ đề
export const updateExamSet = async (req, res) => {
  try {
    const updatedExamSet = await ExamSet.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).populate("questions");
    if (!updatedExamSet) {
      return res.status(404).json({ message: "Không tìm thấy bộ đề" });
    }
    res.status(200).json(updatedExamSet);
  } catch (error) {
    console.error("Error in updateExamSet:", error);
    res.status(500).json({ message: error.message });
  }
};

// Xóa bộ đề
export const deleteExamSet = async (req, res) => {
  try {
    const examSet = await ExamSet.findById(req.params.id);
    if (!examSet) {
      return res.status(404).json({ message: "Không tìm thấy bộ đề" });
    }

    // Xóa các câu hỏi liên quan
    await Question.deleteMany({ _id: { $in: examSet.questions } });

    // Xóa đề thi
    await ExamSet.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Đã xóa bộ đề thành công" });
  } catch (error) {
    console.error("Error in deleteExamSet:", error);
    res.status(500).json({ message: error.message });
  }
};

// Tạo đề thi tự động
export const generateExam = async (req, res) => {
  try {
    const examSet = await ExamSet.findById(req.params.id);
    if (!examSet) {
      return res.status(404).json({ message: "Không tìm thấy bộ đề" });
    }

    const selectedQuestions = [];

    // Với mỗi section, lấy ngẫu nhiên số lượng câu hỏi theo yêu cầu
    for (const section of examSet.sections) {
      const questions = await Question.find({
        difficulty: section.difficulty,
        isPublic: true,
      }).limit(section.numberOfQuestions);

      // Thêm vào danh sách câu hỏi của đề
      questions.forEach((question, index) => {
        selectedQuestions.push({
          question: question._id,
          section: section.difficulty,
          order: index + 1,
        });
      });
    }

    // Cập nhật đề thi với các câu hỏi đã chọn
    examSet.questions = selectedQuestions;
    await examSet.save();

    // Trả về đề thi đã được tạo với thông tin đầy đủ
    const populatedExamSet = await ExamSet.findById(examSet._id).populate(
      "questions.question"
    );

    res.status(200).json(populatedExamSet);
  } catch (error) {
    console.error("Error in generateExam:", error);
    res.status(500).json({ message: error.message });
  }
};
