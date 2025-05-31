import ExamSet from "../models/ExamSet.js";
import Question from "../models/Question.js";
import mongoose from "mongoose";

// Tạo bộ đề (ok)
export const createExamSet = async (req, res) => {
  try {
    console.log("Received data:", JSON.stringify(req.body, null, 2));

    const { name, subject, grade, description } = req.body;

    // Kiểm tra bắt buộc
    if (!name || !subject || !grade) {
      return res
        .status(400)
        .json({ message: "Tên đề thi, môn học và khối lớp là bắt buộc" });
    }

    // Tạo ExamSet mới với danh sách câu hỏi rỗng
    const newExamSet = new ExamSet({
      name,
      subject,
      grade,
      description: description || "",
      questions: [], // để rỗng
      createdBy: req.auth?.userId || "system",
    });

    const savedExamSet = await newExamSet.save();

    res.status(201).json({
      message: "Tạo bộ đề thành công",
      examSet: savedExamSet,
    });
  } catch (error) {
    console.error("Error in createExamSet:", error);
    res.status(500).json({
      message: "Lỗi khi tạo đề thi",
      error: error.message,
    });
  }
};

// Xóa bộ đề (ok)
export const deleteExamSet = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    const examSet = await ExamSet.findById(id);

    if (!examSet || examSet.createdBy.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied or question bank not found",
      });
    }

    // Xóa các câu hỏi liên quan
    await Question.deleteMany({ _id: { $in: examSet.questions } });

    // Xóa đề thi
    await ExamSet.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: "Question bank deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting question bank:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Lấy tất cả bộ đề user (ok)
export const getAllExamSets = async (req, res) => {
  try {
    const examSets = await ExamSet.find({ createdBy: req.userId })
      .populate("questions")
      .sort({ createdAt: -1 });
    res.status(200).json(examSets);
  } catch (error) {
    console.error("Error in getAllExamSets:", error);
    res.status(500).json({ message: error.message });
  }
};

// Lấy một bộ đề theo ID (ok)
export const getExamSetById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    const examSet = await ExamSet.findById(id).populate("questions");
    if (!examSet || examSet.createdBy.toString() !== req.userId) {
      return res.status(404).json({ message: "Không tìm thấy bộ đề" });
    }
    res.status(200).json(examSet);
  } catch (error) {
    console.error("Error in getExamSetById:", error);
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật bộ đề (Chưa làm)
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

//  static async update(req, res) {
//     try {
//       const { id } = req.params;
//       const { name } = req.body;

//       if (!mongoose.Types.ObjectId.isValid(id)) {
//         return res.status(400).json({
//           success: false,
//           message: 'Invalid ID format'
//         });
//       }

//       const bank = await QuestionBank.findById(id);

//       if (!bank || bank.owner.toString() !== req.userId) {
//         return res.status(403).json({
//           success: false,
//           message: 'Access denied or question bank not found'
//         });
//       }

//       if (name) bank.name = name;

//       const updated = await bank.save();

//       return res.json({
//         success: true,
//         message: 'Updated successfully',
//         data: updated
//       });

//     } catch (error) {
//       console.error('Error updating question bank:', error);
//       return res.status(500).json({
//         success: false,
//         message: 'Server error'
//       });
//     }
//   }

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

// Lấy tất cả bộ đề của một user cụ thể
export const getExamSetsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    // Kiểm tra quyền truy cập
    if (userId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied - You can only view your own exam sets",
      });
    }

    const examSets = await ExamSet.find({ createdBy: userId })
      .populate("questions")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: examSets,
    });
  } catch (error) {
    console.error("Error in getExamSetsByUserId:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
