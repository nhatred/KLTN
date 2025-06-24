import {
  BookOpen01Icon,
  Delete01Icon,
  FileEditIcon,
  FilterHorizontalIcon,
  Search01Icon,
  UserIcon,
  ViewIcon,
  Calendar03Icon,
  Add01Icon,
  LeftToRightListDashIcon,
  GridViewIcon,
  Book02Icon,
  Mortarboard01Icon,
  Cancel01Icon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useAuth, useUser } from "@clerk/clerk-react";
import React, { useState, useMemo, useEffect, useRef } from "react";

import axios, { AxiosError } from "axios";
import SpinnerLoading from "../components/SpinnerLoading";
import * as XLSX from "xlsx";

interface Question {
  _id: string;
  questionText: string;
  options: string[];
  answers: {
    text: string;
    isCorrect: boolean;
  }[];
  difficulty: "easy" | "medium" | "hard";
}

interface Exam {
  _id: string;
  name: string;
  description: string;
  subject: string;
  grade: string;
  questions: Question[];
  createdAt: string;
  createdBy: string;
}

interface CreateExamForm {
  name: string;
  subject: string;
  grade: string;
  description: string;
  questions: Question[];
}

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;


export default function ExamBank() {
  const { getToken } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(false);
  const [currentExamId, setCurrentExamId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState<CreateExamForm>({
    name: "",
    subject: "",
    grade: "",
    description: "",
    questions: [],
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    questionText: "",
    options: ["", "", "", ""],
    answers: [] as number[],
    difficulty: "easy" as "easy" | "medium" | "hard",
  });

  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [availableGrades, setAvailableGrades] = useState<string[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "questions" | "import">(
    "basic"
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Thêm chỉnh sửa câu hỏi
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Thêm imported questions
  const [importedQuestions, setImportedQuestions] = useState<Question[]>([]);

  // Fetch exams from API
  useEffect(() => {
    const fetchExams = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get("/api/examSets", {
          params: { populate: "questions" },
        });
        setExams(response.data);

        const subjects = [
          ...new Set(response.data.map((exam: Exam) => exam.subject)),
        ] as string[];
        const grades = [
          ...new Set(response.data.map((exam: Exam) => exam.grade)),
        ] as string[];

        setAvailableSubjects(subjects);
        setAvailableGrades(grades);
      } catch (error) {
        console.error("Error fetching exams:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExams();
  }, []);

  // Save view mode to localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem("examBankViewMode");
    if (savedViewMode === "grid" || savedViewMode === "list") {
      setViewMode(savedViewMode);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("examBankViewMode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (isModalOpen || isViewModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen, isViewModalOpen]);

  const handleCreateExam = () => {
    setIsModalOpen(true);
    setActiveTab("basic");
    setCurrentExamId(null);
    setFormData({
      name: "",
      subject: "",
      grade: "",
      description: "",
      questions: [],
    });
  };

  const handleCloseModal = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsAnimating(false);
      setCurrentExamId(null);
      setIsEditing(false);
      setFormData({
        name: "",
        subject: "",
        grade: "",
        description: "",
        questions: [],
      });
      setCurrentQuestion({
        questionText: "",
        options: ["", "", "", ""],
        answers: [],
        difficulty: "easy",
      });
    }, 300);
  };

  const handleCreateBasicExam = async () => {
    if (!formData.name || !formData.subject || !formData.grade) {
      alert("Vui lòng điền đầy đủ thông tin đề thi");
      return;
    }

    try {
      const response = await axios.post("/api/examSets", {
        name: formData.name,
        description: formData.description,
        subject: formData.subject,
        grade: formData.grade,
      });

      setCurrentExamId(response.data.examSet._id);
      setActiveTab("questions");

      // Fetch lại danh sách đề thi sau khi tạo thành công
      const fetchResponse = await axios.get("/api/examSets", {
        params: { populate: "questions" },
      });
      setExams(fetchResponse.data);

      alert("Tạo đề thi thành công! Bây giờ bạn có thể thêm câu hỏi.");
    } catch (error) {
      console.error("Error creating exam:", error);
      alert("Có lỗi xảy ra khi tạo đề thi");
    }
  };

  const handleAddQuestion = async () => {
    if (!currentExamId) {
      alert("Chưa có đề thi để thêm câu hỏi");
      return;
    }

    if (!currentQuestion.questionText) {
      alert("Vui lòng nhập nội dung câu hỏi");
      return;
    }

    if (currentQuestion.options.some((opt) => !opt)) {
      alert("Vui lòng nhập đầy đủ các lựa chọn");
      return;
    }

    if (currentQuestion.answers.length === 0) {
      alert("Vui lòng chọn ít nhất một đáp án đúng");
      return;
    }

    try {
      const response = await axios.post("/api/question", {
        examSetId: currentExamId,
        questionText: currentQuestion.questionText,
        questionType: "multipleChoices",
        difficulty: currentQuestion.difficulty,
        options: currentQuestion.options,
        answers: currentQuestion.options.map((option, index) => ({
          text: option,
          isCorrect: currentQuestion.answers.includes(index),
        })),
      });

      // Cập nhật danh sách đề thi

      const updatedExams = exams.map((exam) => {
        if (exam._id === currentExamId) {
          return {
            ...exam,
            questions: [...exam.questions, response.data.question],
          };
        }
        return exam;
      });

      console.log(updatedExams);
      setExams(updatedExams);

      // Reset form câu hỏi
      setCurrentQuestion({
        questionText: "",
        options: ["", "", "", ""],
        answers: [],
        difficulty: "easy",
      });

      alert("Thêm câu hỏi thành công!");
    } catch (err: unknown) {
      const error = err as AxiosError<{ message: string }>;
      const serverMessage =
        error.response?.data?.message || "Có lỗi xảy ra khi thêm câu hỏi";
      console.error("Error adding question:", error);
      alert(serverMessage);
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa đề thi này?")) {
      try {
        await axios.delete(`/api/examSets/${examId}`);
        setExams((prev) => prev.filter((exam) => exam._id !== examId));
      } catch (error) {
        console.error("Error deleting exam:", error);
        alert("Có lỗi xảy ra khi xóa đề thi");
      }
    }
  };

  // Thêm edit
  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setCurrentQuestion({
      questionText: question.questionText,
      options: question.options,
      answers: question.answers
        .map((ans, index) => (ans.isCorrect ? index : -1))
        .filter((i) => i >= 0),
      difficulty: question.difficulty,
    });

    // Scroll đến form chỉnh sửa
    document
      .getElementById("question-form")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  //Thêm update
  const handleUpdateQuestion = async () => {
    if (!editingQuestion || !currentExamId) return;

    try {
      setIsLoading(true);
      await axios.put(`/api/question/${editingQuestion._id}`, {
        questionText: currentQuestion.questionText,
        options: currentQuestion.options,
        answers: currentQuestion.options.map((option, index) => ({
          text: option,
          isCorrect: currentQuestion.answers.includes(index),
        })),
        difficulty: currentQuestion.difficulty,
      });

      // Cập nhật UI
      const updatedExams = exams.map((exam) => {
        if (exam._id === currentExamId) {
          return {
            ...exam,
            questions: exam.questions.map((q) =>
              q._id === editingQuestion._id
                ? {
                    ...q,
                    questionText: currentQuestion.questionText,
                    options: currentQuestion.options,
                    answers: currentQuestion.options.map((opt, i) => ({
                      text: opt,
                      isCorrect: currentQuestion.answers.includes(i),
                    })),
                    difficulty: currentQuestion.difficulty,
                  }
                : q
            ),
          };
        }
        return exam;
      });

      setExams(updatedExams);
      setEditingQuestion(null);
      setCurrentQuestion({
        questionText: "",
        options: ["", "", "", ""],
        answers: [],
        difficulty: "easy",
      });

      alert("Cập nhật câu hỏi thành công!");
    } catch (error) {
      console.error("Error updating question:", error);
      alert("Có lỗi xảy ra khi cập nhật câu hỏi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQuestion = async (examId: string, questionId: string) => {
    console.log("questionId", questionId);

    if (window.confirm("Bạn có chắc chắn muốn xóa câu hỏi này?")) {
      try {
        await axios.delete(`/api/question/${questionId}`);

        // Cập nhật UI
        const updatedExams = exams.map((exam) => {
          if (exam._id === examId) {
            return {
              ...exam,
              questions: exam.questions.filter((q) => q._id !== questionId),
            };
          }
          return exam;
        });
        setExams(updatedExams);

        alert("Xóa câu hỏi thành công!");
      } catch (error) {
        console.error("Error deleting question:", error);
        alert("Có lỗi xảy ra khi xóa câu hỏi");
      }
    }
  };

  const filteredExams = useMemo(() => {
    let filtered = exams.filter((exam) => {
      const matchesSearch =
        exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubject =
        !selectedSubject || exam.subject === selectedSubject;
      const matchesGrade = !selectedGrade || exam.grade === selectedGrade;

      return matchesSearch && matchesSubject && matchesGrade;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [exams, searchTerm, selectedSubject, selectedGrade, sortBy]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const handleViewExam = async (exam: Exam) => {
    try {
      const response = await axios.get(`/api/examSets/${exam._id}`, {
        params: { populate: "questions" },
      });
      setSelectedExam(response.data);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error("Error fetching exam details:", error);
      alert("Có lỗi xảy ra khi tải thông tin đề thi");
    }
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedExam(null);
  };

  const handleEditExam = (exam: any) => {
    setIsEditing(true);
    setCurrentExamId(exam._id);
    setFormData({
      name: exam.name,
      subject: exam.subject,
      grade: exam.grade,
      description: exam.description || "",
      questions: [],
    });
    setIsModalOpen(true);
    setActiveTab("basic");
  };

  const handleUpdateExam = async () => {
    try {
      const response = await axios.put(
        `/api/examSets/${currentExamId}`,
        formData
      );

      // Refresh exam list
      const fetchResponse = await axios.get("/api/examSets", {
        params: { populate: "questions" },
      });
      setExams(fetchResponse.data);

      handleCloseModal();
      alert("Cập nhật đề thi thành công!");
    } catch (error) {
      console.error("Error updating exam:", error);
      alert("Có lỗi xảy ra khi cập nhật đề thi");
    }
  };

  const handleDownloadTemplate = () => {
    // Tạo workbook mới
    const wb = XLSX.utils.book_new();

    // Tạo worksheet với dữ liệu mẫu
    const wsData = [
      [
        "Câu hỏi",
        "Lựa chọn A",
        "Lựa chọn B",
        "Lựa chọn C",
        "Lựa chọn D",
        "Đáp án đúng",
        "Mức độ",
      ],
      ["1 + 1 = ?", "1", "2", "3", "4", "B", "easy"],
      ["2 x 3 = ?", "4", "5", "6", "7", "C", "easy"],
      ["Căn bậc hai của 16 là?", "2", "3", "4", "5", "C", "medium"],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Thêm worksheet vào workbook
    XLSX.utils.book_append_sheet(wb, ws, "Template");

    // Tải xuống file
    XLSX.writeFile(wb, "template_cau_hoi.xlsx");
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const questions: Question[] = jsonData.map((row: any) => {
        const options = [
          row["Lựa chọn A"],
          row["Lựa chọn B"],
          row["Lựa chọn C"],
          row["Lựa chọn D"],
        ];
        const correctAnswer = row["Đáp án đúng"].toUpperCase();
        const correctIndex = correctAnswer.charCodeAt(0) - 65; // Convert A,B,C,D to 0,1,2,3

        return {
          _id: Math.random().toString(36).substr(2, 9), // Generate temporary ID
          questionText: row["Câu hỏi"],
          options: options,
          answers: options.map((option, index) => ({
            text: option,
            isCorrect: index === correctIndex,
          })),
          difficulty: row["Mức độ"] || "easy",
        };
      });

      setImportedQuestions(questions);
      alert(`Đã đọc thành công ${questions.length} câu hỏi từ file Excel!`);
    } catch (error) {
      console.error("Error importing Excel:", error);
      alert(
        "Có lỗi xảy ra khi import file Excel. Vui lòng kiểm tra định dạng file."
      );
    }

    // Reset input để có thể chọn lại file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSaveImportedQuestions = async () => {
    if (!currentExamId || importedQuestions.length === 0) return;

    try {
      setIsLoading(true);

      // Lấy token từ localStorage
      const token = await getToken();
      if (!token) {
        throw new Error("Bạn cần đăng nhập để thực hiện chức năng này");
      }

      // Thêm token vào header
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      // Lưu từng câu hỏi vào database
      for (const question of importedQuestions) {
        const response = await axios.post(
          `${API_BASE_URL}/question`,
          {
            examSetId: currentExamId,
            questionText: question.questionText,
            questionType: "multipleChoices",
            difficulty: question.difficulty,
            options: question.options,
            answers: question.answers,
          },
          config
        );

        if (!response.data) {
          throw new Error("Failed to save question");
        }
      }

      // Refresh exam list với token
      const response = await axios.get(`${API_BASE_URL}/examSets`, {
        ...config,
        params: { populate: "questions" },
      });

      setExams(response.data);

      // Cập nhật formData
      const updatedExam = response.data.find(
        (e: Exam) => e._id === currentExamId
      );
      if (updatedExam) {
        setFormData((prev) => ({
          ...prev,
          questions: updatedExam.questions,
        }));
      }

      // Reset imported questions
      setImportedQuestions([]);
      alert("Đã lưu thành công các câu hỏi vào đề thi!");
    } catch (error: any) {
      console.error("Error saving questions:", error);
      if (error.response?.status === 401) {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
      } else {
        alert(
          error.message || "Có lỗi xảy ra khi lưu câu hỏi. Vui lòng thử lại."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check if current user is admin
  const { user: currentUser } = useUser();
  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    const checkTeacherStatus = async () => {
      try {
        if (currentUser) {
          const token = await getToken();
          const response = await axios.get(
            `http://localhost:5000/api/users/${currentUser.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          console.log(response.data.data);
          setIsTeacher(
            response.data.data.role === "teacher" ||
              response.data.data.role === "admin"
          );
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsTeacher(false);
      }
    };

    checkTeacherStatus();
  }, [currentUser]);

  if (!isTeacher) {
    return (
      <div className="p-8 text-center pt-20 w-full h-full flex flex-col items-center justify-center">
        <img className="h-[60%]" src="/assets/404.png" alt="" />
        <h1 className="text-2xl font-bold text-orange">TRUY CẬP BỊ TỪ CHỐI</h1>
        <p className="mt-4">Bạn không có quyền truy cập trang này.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 pt-32">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl mb-2">Ngân hàng đề thi</h1>
          <p className="text-darkblue">Quản lý và tổ chức các đề thi của bạn</p>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg box-shadow p-5 mb-5">
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <HugeiconsIcon icon={Search01Icon} size={20} />
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm đề thi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-2.5 py-2 border text-sm font-semibold border-gray-300 rounded-lg outline-none"
            >
              <option value="">Tất cả môn học</option>
              {availableSubjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>

            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="px-2.5 py-2 border text-sm font-semibold border-gray-300 rounded-lg outline-none"
            >
              <option value="">Tất cả khối lớp</option>
              {availableGrades.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-2 border text-sm font-semibold border-gray-300 rounded-lg outline-none"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="name">Theo tên</option>
            </select>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg ${
                  viewMode === "grid"
                    ? "bg-red-100 text-orange"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <HugeiconsIcon icon={GridViewIcon} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg ${
                  viewMode === "list"
                    ? "bg-red-100 text-orange"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <HugeiconsIcon icon={LeftToRightListDashIcon} />
              </button>
            </div>

            <button
              onClick={handleCreateExam}
              className="flex items-center gap-2 px-3 py-2 bg-orange btn-hover rounded text-darkblue font-semibold"
            >
              <HugeiconsIcon icon={Add01Icon} size={20} />
              Tạo ngân hàng đề mới
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-5">
          <div className="bg-white p-4 rounded-lg box-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng đề thi</p>
                <p className="text-2xl font-bold text-gray-900">
                  {exams.length}
                </p>
              </div>
              <HugeiconsIcon icon={BookOpen01Icon} />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg box-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Kết quả tìm kiếm</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredExams.length}
                </p>
              </div>
              <HugeiconsIcon icon={FilterHorizontalIcon} />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg box-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Môn học</p>
                <p className="text-2xl font-bold text-gray-900">
                  {availableSubjects.length}
                </p>
              </div>
              <HugeiconsIcon icon={Book02Icon} />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg box-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Khối lớp</p>
                <p className="text-2xl font-bold text-gray-900">
                  {availableGrades.length}
                </p>
              </div>
              <HugeiconsIcon icon={Mortarboard01Icon} />
            </div>
          </div>
        </div>

        {/* Exam List */}
        {isLoading ? (
          <div className="bg-white rounded-lg box-shadow p-12">
            <SpinnerLoading />
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="bg-white rounded-lg box-shadow p-12 text-center">
            <HugeiconsIcon
              icon={Book02Icon}
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
            />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Không tìm thấy ngân hàng đề
            </h3>
            <p className="text-gray-600 mb-6">
              Thử điều chỉnh bộ lọc hoặc tạo ngân hàng đề thi mới
            </p>
            <button
              onClick={handleCreateExam}
              className="px-6 py-2 bg-orange text-darkblue font-semibold rounded-lg btn-hover transition-colors"
            >
              Tạo ngân hàng đề đầu tiên
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredExams.map((exam) => (
              <div
                key={exam._id}
                className="bg-white rounded-lg box-shadow hover:shadow-md transition-shadow p-6 border border-gray-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {exam.name}
                  </h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleViewExam(exam)}
                      className="p-1 text-gray-400 hover:text-orange transition-colors"
                    >
                      <HugeiconsIcon icon={ViewIcon} />
                    </button>
                    <button
                      onClick={() => handleEditExam(exam)}
                      className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                    >
                      <HugeiconsIcon icon={FileEditIcon} />
                    </button>
                    <button
                      onClick={() => handleDeleteExam(exam._id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <HugeiconsIcon icon={Delete01Icon} />
                    </button>
                  </div>
                </div>

                {exam.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {exam.description}
                  </p>
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <HugeiconsIcon
                      icon={Book02Icon}
                      className="h-4 w-4 text-gray-400"
                    />
                    <span className="text-gray-600">Môn: </span>
                    <span className="font-medium">{exam.subject}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <HugeiconsIcon
                      icon={UserIcon}
                      className="h-4 w-4 text-gray-400"
                    />
                    <span className="text-gray-600">Khối: </span>
                    <span className="font-medium">{exam.grade}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <HugeiconsIcon
                      icon={Calendar03Icon}
                      className="h-4 w-4 text-gray-400"
                    />
                    <span className="text-gray-600">Tạo: </span>
                    <span className="font-medium">
                      {formatDate(exam.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <HugeiconsIcon
                      icon={LeftToRightListDashIcon}
                      className="h-4 w-4 text-gray-400"
                    />
                    <span className="text-gray-600">Số câu: </span>
                    <span className="font-medium">{exam.questions.length}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg box-shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên đề thi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Môn học
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khối lớp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số câu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExams.map((exam) => (
                  <tr key={exam._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {exam.name}
                      </div>
                      {exam.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {exam.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {exam.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {exam.grade}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {exam.questions.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(exam.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleViewExam(exam)}
                          className="text-blue-600 hover:text-orange"
                        >
                          <HugeiconsIcon icon={ViewIcon} />
                        </button>
                        <button
                          onClick={() => handleEditExam(exam)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <HugeiconsIcon icon={FileEditIcon} />
                        </button>
                        <button
                          onClick={() => handleDeleteExam(exam._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <HugeiconsIcon icon={Delete01Icon} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* View Exam Modal */}
        {isViewModalOpen && selectedExam && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden">
              <div className="bg-gradient-to-r from-orange to-red-wine p-6 text-white">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <HugeiconsIcon icon={ViewIcon} className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Chi tiết bộ đề thi</h2>
                      <p className="text-blue-100 text-sm">
                        Xem thông tin chi tiết và danh sách câu hỏi
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseViewModal}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[calc(95vh-200px)] p-6">
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <HugeiconsIcon
                        icon={Book02Icon}
                        className="w-5 h-5 text-orange"
                      />
                      Thông tin cơ bản
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Tên bộ đề</p>
                        <p className="font-medium text-gray-900">
                          {selectedExam.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Môn học</p>
                        <p className="font-medium text-gray-900">
                          {selectedExam.subject}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Khối lớp</p>
                        <p className="font-medium text-gray-900">
                          {selectedExam.grade}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Ngày tạo</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(selectedExam.createdAt)}
                        </p>
                      </div>
                      {selectedExam.description && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-600">Mô tả</p>
                          <p className="font-medium text-gray-900">
                            {selectedExam.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <HugeiconsIcon
                          icon={LeftToRightListDashIcon}
                          className="w-5 h-5 text-orange"
                        />
                        Danh sách câu hỏi
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        <HugeiconsIcon
                          icon={GridViewIcon}
                          className="w-4 h-4"
                        />
                        {selectedExam.questions.length} câu hỏi
                      </div>
                    </div>

                    <div className="space-y-4">
                      {selectedExam.questions.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                          <HugeiconsIcon
                            icon={FileEditIcon}
                            className="w-12 h-12 text-gray-400 mx-auto mb-4"
                          />
                          <p className="text-gray-600 font-medium">
                            Chưa có câu hỏi nào
                          </p>
                        </div>
                      ) : (
                        selectedExam.questions.map((question, index) => (
                          <div
                            key={question._id}
                            className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-3">
                                  <span className="flex items-center justify-center w-8 h-8 bg-orange text-background rounded-full text-sm font-bold">
                                    {index + 1}
                                  </span>
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                      question.difficulty === "easy"
                                        ? "border-green-200 bg-green-50 text-green-600"
                                        : question.difficulty === "medium"
                                        ? "border-yellow-200 bg-yellow-50 text-yellow-600"
                                        : "border-red-200 bg-red-50 text-red-600"
                                    }`}
                                  >
                                    Mức độ:{" "}
                                    {question.difficulty === "easy"
                                      ? "Dễ"
                                      : question.difficulty === "medium"
                                      ? "Trung bình"
                                      : "Khó"}
                                  </span>
                                </div>
                                <p className="font-medium text-gray-900 text-lg leading-relaxed">
                                  {question.questionText}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {question.options.map((option, optIndex) => {
                                    const isCorrect = question.answers.some(
                                      (ans) =>
                                        ans.text === option && ans.isCorrect
                                    );
                                    return (
                                      <div
                                        key={optIndex}
                                        className={`p-3 rounded-lg border-2 text-sm ${
                                          isCorrect
                                            ? "bg-green-50 border-green-200 text-green-500 font-medium"
                                            : "bg-gray-50 border-gray-200 text-gray-700"
                                        }`}
                                      >
                                        <span className="font-medium mr-2">
                                          {String.fromCharCode(65 + optIndex)}.
                                        </span>
                                        {option}
                                        {isCorrect && (
                                          <span className="ml-2 text-green-600">
                                            ✓
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex justify-end">
                  <button
                    onClick={handleCloseViewModal}
                    className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Exam Modal */}
        {isModalOpen && (
          <div
            className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300 ${
              isAnimating ? "opacity-0" : "opacity-100"
            }`}
          >
            <div
              className={`bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden transition-all duration-300 transform ${
                isAnimating ? "scale-95 opacity-0" : "scale-100 opacity-100"
              }`}
            >
              <div className="bg-gradient-to-r from-orange to-red-wine p-6 text-white">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <HugeiconsIcon icon={FileEditIcon} className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">
                        {isEditing
                          ? "Chỉnh sửa bộ đề thi"
                          : "Tạo bộ đề thi mới"}
                      </h2>
                      <p className="text-blue-100 text-sm">
                        {isEditing
                          ? "Cập nhật thông tin và câu hỏi cho đề thi"
                          : "Thiết lập thông tin và câu hỏi cho đề thi"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="border-b border-gray-200 bg-gray-50">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab("basic")}
                    className={`flex-1 px-6 py-4 font-medium text-sm transition-all duration-200 ${
                      activeTab === "basic"
                        ? "bg-white text-orange border-b-2 border-orange"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <HugeiconsIcon icon={Book02Icon} className="w-4 h-4" />
                      Thông tin cơ bản
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab("questions")}
                    disabled={!currentExamId}
                    className={`flex-1 px-6 py-4 font-medium text-sm transition-all duration-200 ${
                      activeTab === "questions"
                        ? "bg-white text-orange border-b-2 border-orange"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    } ${!currentExamId ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <HugeiconsIcon
                        icon={LeftToRightListDashIcon}
                        className="w-4 h-4"
                      />
                      Danh sách câu hỏi
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab("import")}
                    disabled={!currentExamId}
                    className={`flex-1 px-6 py-4 font-medium text-sm transition-all duration-200 ${
                      activeTab === "import"
                        ? "bg-white text-orange border-b-2 border-orange"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    } ${!currentExamId ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <HugeiconsIcon icon={Upload01Icon} className="w-4 h-4" />
                      Import Excel
                    </div>
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
                {activeTab === "basic" && (
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="lg:col-span-2">
                        <label className="block font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">
                          Tên bộ đề <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="w-full p-4 font-medium border-2 border-gray-200 rounded-xl focus:border-orange transition-all duration-200 text-gray-900"
                          placeholder="Nhập tên đề thi (ví dụ: Kiểm tra giữa kỳ I - Toán 9)"
                          disabled={!isEditing && !!currentExamId}
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">
                          Môn học <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <HugeiconsIcon
                            icon={BookOpen01Icon}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                          />
                          <input
                            type="text"
                            list="subjects"
                            value={formData.subject}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                subject: e.target.value,
                              }))
                            }
                            className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 cursor-pointer rounded-xl focus:border-orange transition-all duration-200"
                            placeholder="Chọn hoặc nhập môn học"
                            disabled={!isEditing && !!currentExamId}
                          />
                          <datalist id="subjects">
                            {availableSubjects.map((subject) => (
                              <option key={subject} value={subject} />
                            ))}
                          </datalist>
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">
                          Khối lớp <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <HugeiconsIcon
                            icon={Mortarboard01Icon}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                          />
                          <input
                            type="text"
                            list="grades"
                            value={formData.grade}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                grade: e.target.value,
                              }))
                            }
                            className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 cursor-pointer rounded-xl focus:border-orange transition-all duration-200"
                            placeholder="Chọn hoặc nhập khối lớp"
                            disabled={!isEditing && !!currentExamId}
                          />
                          <datalist id="grades">
                            {availableGrades.map((grade) => (
                              <option key={grade} value={grade} />
                            ))}
                          </datalist>
                        </div>
                      </div>

                      <div className="lg:col-span-2">
                        <label className="block font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">
                          Mô tả
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          className="w-full p-4 border-2 border-gray-200 rounded-xl transition-all duration-200 resize-none"
                          rows={4}
                          placeholder="Mô tả chi tiết về nội dung, mục đích và yêu cầu của đề thi..."
                          disabled={!isEditing && !!currentExamId}
                        />
                      </div>
                    </div>

                    {(formData.name || formData.subject || formData.grade) && (
                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <HugeiconsIcon
                            icon={ViewIcon}
                            className="w-5 h-5 text-orange"
                          />
                          Xem trước
                        </h3>
                        <div className="space-y-2">
                          {formData.name && (
                            <p>
                              <span className="font-medium">Tên đề:</span>{" "}
                              {formData.name}
                            </p>
                          )}
                          {formData.subject && (
                            <p>
                              <span className="font-medium">Môn:</span>{" "}
                              {formData.subject}
                            </p>
                          )}
                          {formData.grade && (
                            <p>
                              <span className="font-medium">Lớp:</span>{" "}
                              {formData.grade}
                            </p>
                          )}
                          {formData.description && (
                            <p>
                              <span className="font-medium">Mô tả:</span>{" "}
                              {formData.description}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "questions" && (
                  <div className="p-6 space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                          <HugeiconsIcon
                            icon={LeftToRightListDashIcon}
                            className="w-6 h-6 text-orange"
                          />
                          Danh sách câu hỏi
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                          <HugeiconsIcon
                            icon={GridViewIcon}
                            className="w-4 h-4"
                          />
                          {exams.find((e) => e._id === currentExamId)?.questions
                            .length || 0}{" "}
                          câu hỏi
                        </div>
                      </div>

                      <div className="space-y-4">
                        {exams.find((e) => e._id === currentExamId)?.questions
                          .length === 0 ? (
                          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                            <HugeiconsIcon
                              icon={FileEditIcon}
                              className="w-12 h-12 text-gray-400 mx-auto mb-4"
                            />
                            <p className="text-gray-600 font-medium">
                              Chưa có câu hỏi nào
                            </p>
                            <p className="text-gray-500 text-sm">
                              Thêm câu hỏi đầu tiên bên dưới
                            </p>
                          </div>
                        ) : (
                          exams
                            .find((e) => e._id === currentExamId)
                            ?.questions.map((question, index) => (
                              <div
                                key={question._id}
                                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200"
                              >
                                <div className="flex justify-between items-start gap-4">
                                  <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-3">
                                      <span className="flex items-center justify-center w-8 h-8 bg-orange text-background rounded-full text-sm font-bold">
                                        {index + 1}
                                      </span>
                                      <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                          question.difficulty === "easy"
                                            ? "border-green-200 bg-green-50 text-green-600"
                                            : question.difficulty === "medium"
                                            ? "border-yellow-200 bg-yellow-50 text-yellow-600"
                                            : "border-red-200 bg-red-50 text-red-600"
                                        }`}
                                      >
                                        Mức độ:{" "}
                                        {question.difficulty === "easy"
                                          ? "Dễ"
                                          : question.difficulty === "medium"
                                          ? "Trung bình"
                                          : "Khó"}
                                      </span>
                                    </div>
                                    <p className="font-medium text-gray-900 text-lg leading-relaxed">
                                      {question.questionText}
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {question.options.map(
                                        (option, optIndex) => {
                                          const isCorrect =
                                            question.answers.some(
                                              (ans) =>
                                                ans.text === option &&
                                                ans.isCorrect
                                            );
                                          return (
                                            <div
                                              key={optIndex}
                                              className={`p-3 rounded-lg border-2 text-sm ${
                                                isCorrect
                                                  ? "bg-green-50 border-green-200 text-green-500 font-medium"
                                                  : "bg-gray-50 border-gray-200 text-gray-700"
                                              }`}
                                            >
                                              <span className="font-medium mr-2">
                                                {String.fromCharCode(
                                                  65 + optIndex
                                                )}
                                                .
                                              </span>
                                              {option}
                                              {isCorrect && (
                                                <span className="ml-2 text-green-600">
                                                  ✓
                                                </span>
                                              )}
                                            </div>
                                          );
                                        }
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex">
                                    {/* Thêm button edit */}
                                    <button
                                      onClick={() =>
                                        handleEditQuestion(question)
                                      }
                                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                      <HugeiconsIcon
                                        icon={FileEditIcon}
                                        className="w-5 h-5"
                                      />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (currentExamId) {
                                          handleDeleteQuestion(
                                            currentExamId,
                                            question._id
                                          );
                                        }
                                      }}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      <HugeiconsIcon
                                        icon={Delete01Icon}
                                        className="w-5 h-5"
                                      />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    </div>

                    {/* Chỉnh lại thêm id để chọc form chỉnh sửa  */}
                    <div
                      id="question-form"
                      className="bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-dashed border-orange rounded-xl p-6"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <HugeiconsIcon icon={Add01Icon} />
                        {editingQuestion
                          ? "Chỉnh sửa câu hỏi"
                          : "Thêm câu hỏi mới"}
                      </h3>

                      <div className="space-y-6">
                        <div>
                          <label className="block font-medium text-gray-800 mb-3">
                            Nội dung câu hỏi{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={currentQuestion.questionText}
                            onChange={(e) =>
                              setCurrentQuestion((prev) => ({
                                ...prev,
                                questionText: e.target.value,
                              }))
                            }
                            className="w-full p-4 border-2 border-gray-200 rounded-xl transition-all duration-200 resize-none"
                            rows={3}
                            placeholder="Nhập nội dung câu hỏi..."
                          />
                        </div>

                        <div>
                          <label className="block font-medium text-gray-800 mb-3">
                            Mức độ <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={currentQuestion.difficulty}
                            onChange={(e) =>
                              setCurrentQuestion((prev) => ({
                                ...prev,
                                difficulty: e.target.value as any,
                              }))
                            }
                            className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-orange transition-all duration-200"
                          >
                            <option value="easy">Dễ</option>
                            <option value="medium">Trung bình</option>
                            <option value="hard">Khó</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-medium text-gray-800 mb-3">
                            Các lựa chọn <span className="text-red-500">*</span>
                          </label>
                          <div className="space-y-3">
                            {currentQuestion.options.map((option, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-3"
                              >
                                <span className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-700 rounded-full text-sm font-bold flex-shrink-0">
                                  {String.fromCharCode(65 + index)}
                                </span>
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [
                                      ...currentQuestion.options,
                                    ];
                                    newOptions[index] = e.target.value;
                                    setCurrentQuestion((prev) => ({
                                      ...prev,
                                      options: newOptions,
                                    }));
                                  }}
                                  className="flex-1 p-3 border-2 border-gray-200 rounded-lg focus:border-orange transition-all duration-200"
                                  placeholder={`Nhập lựa chọn ${String.fromCharCode(
                                    65 + index
                                  )}`}
                                />
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={currentQuestion.answers.includes(
                                      index
                                    )}
                                    onChange={(e) => {
                                      const newAnswers = e.target.checked
                                        ? [...currentQuestion.answers, index]
                                        : currentQuestion.answers.filter(
                                            (ans) => ans !== index
                                          );
                                      setCurrentQuestion((prev) => ({
                                        ...prev,
                                        answers: newAnswers,
                                      }));
                                    }}
                                    className="w-5 h-5 text-green-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                                  />
                                  <span className="text-sm text-gray-700 font-medium">
                                    Đáp án đúng
                                  </span>
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        {editingQuestion && (
                          <button
                            onClick={() => {
                              setEditingQuestion(null);
                              setCurrentQuestion({
                                questionText: "",
                                options: ["", "", "", ""],
                                answers: [],
                                difficulty: "easy",
                              });
                            }}
                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all"
                          >
                            Hủy
                          </button>
                        )}

                        <button
                          onClick={
                            editingQuestion
                              ? handleUpdateQuestion
                              : handleAddQuestion
                          }
                          className="px-6 py-3 bg-gradient-to-r from-orange to-red-wine text-white rounded-xl hover:from-orange-700 hover:to-red-wine-700 transition-all"
                        >
                          {editingQuestion
                            ? "Cập nhật câu hỏi"
                            : "Thêm câu hỏi"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === "import" && (
                  <div className="p-6 space-y-6">
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <HugeiconsIcon
                          icon={Upload01Icon}
                          className="w-6 h-6 text-orange"
                        />
                        Import câu hỏi từ Excel
                      </h3>

                      <div className="space-y-6">
                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                          <h4 className="font-semibold text-gray-800 mb-3">
                            Hướng dẫn
                          </h4>
                          <ol className="list-decimal list-inside space-y-2 text-gray-600">
                            <li>
                              Tải template Excel mẫu bằng cách nhấn nút "Tải
                              template" bên dưới
                            </li>
                            <li>
                              Điền thông tin câu hỏi vào file Excel theo mẫu:
                              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                                <li>Câu hỏi: Nội dung câu hỏi</li>
                                <li>
                                  Lựa chọn A, B, C, D: Các phương án trả lời
                                </li>
                                <li>Đáp án đúng: Chọn A, B, C hoặc D</li>
                                <li>
                                  Mức độ: easy (dễ), medium (trung bình), hard
                                  (khó)
                                </li>
                              </ul>
                            </li>
                            <li>
                              Nhấn nút "Import Excel" để chọn file Excel đã điền
                            </li>
                            <li>
                              Kiểm tra câu hỏi đã import và nhấn "Lưu vào đề
                              thi"
                            </li>
                          </ol>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={handleDownloadTemplate}
                            className="px-6 py-3 bg-white border-2 border-orange text-orange rounded-xl hover:bg-orange/5 transition-all duration-200 font-medium flex items-center gap-2"
                          >
                            <HugeiconsIcon
                              icon={FileEditIcon}
                              className="w-5 h-5"
                            />
                            Tải template
                          </button>
                          <label className="px-6 py-3 bg-gradient-to-r from-orange to-red-wine text-white rounded-xl hover:from-orange-700 hover:to-red-wine-700 transition-all duration-200 font-medium flex items-center gap-2 cursor-pointer">
                            <HugeiconsIcon
                              icon={Upload01Icon}
                              className="w-5 h-5"
                            />
                            Import Excel
                            <input
                              type="file"
                              accept=".xlsx,.xls"
                              className="hidden"
                              onChange={handleImportExcel}
                              ref={fileInputRef}
                            />
                          </label>
                        </div>

                        {importedQuestions.length > 0 && (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <h4 className="font-semibold text-gray-800">
                                Danh sách câu hỏi đã import (
                                {importedQuestions.length})
                              </h4>
                              <button
                                onClick={handleSaveImportedQuestions}
                                disabled={isLoading}
                                className="px-6 py-3 bg-gradient-to-r from-orange to-red-wine text-white rounded-xl hover:from-orange-700 hover:to-red-wine-700 transition-all duration-200 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isLoading ? (
                                  <>Đang lưu...</>
                                ) : (
                                  <>
                                    <HugeiconsIcon
                                      icon={FileEditIcon}
                                      className="w-5 h-5"
                                    />
                                    Lưu vào đề thi
                                  </>
                                )}
                              </button>
                            </div>

                            <div className="space-y-4">
                              {importedQuestions.map((question, index) => (
                                <div
                                  key={question._id}
                                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200"
                                >
                                  <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1 space-y-3">
                                      <div className="flex items-center gap-3">
                                        <span className="flex items-center justify-center w-8 h-8 bg-orange text-background rounded-full text-sm font-bold">
                                          {index + 1}
                                        </span>
                                        <span
                                          className={`px-3 py-1 rounded-full text-xs font-medium border`}
                                        >
                                          Mức độ:{" "}
                                          {question.difficulty === "easy"
                                            ? "Dễ"
                                            : question.difficulty === "medium"
                                            ? "Trung bình"
                                            : "Khó"}
                                        </span>
                                      </div>
                                      <p className="font-medium text-gray-900 text-lg leading-relaxed">
                                        {question.questionText}
                                      </p>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {question.options.map(
                                          (option, optIndex) => {
                                            const isCorrect =
                                              question.answers.some(
                                                (ans) =>
                                                  ans.text === option &&
                                                  ans.isCorrect
                                              );
                                            return (
                                              <div
                                                key={optIndex}
                                                className={`p-3 rounded-lg border-2 text-sm ${
                                                  isCorrect
                                                    ? "bg-green-50 border-green-200 text-green-500 font-medium"
                                                    : "bg-gray-50 border-gray-200 text-gray-700"
                                                }`}
                                              >
                                                <span className="font-medium mr-2">
                                                  {String.fromCharCode(
                                                    65 + optIndex
                                                  )}
                                                  .
                                                </span>
                                                {option}
                                                {isCorrect && (
                                                  <span className="ml-2 text-green-600">
                                                    ✓
                                                  </span>
                                                )}
                                              </div>
                                            );
                                          }
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    {currentExamId && (
                      <span className="flex items-center gap-2">
                        <HugeiconsIcon
                          icon={LeftToRightListDashIcon}
                          className="w-4 h-4"
                        />
                        {exams.find((e) => e._id === currentExamId)?.questions
                          .length || 0}{" "}
                        câu hỏi đã thêm
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCloseModal}
                      className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-xl transition-all duration-200 font-medium"
                    >
                      {currentExamId ? "Đóng" : "Hủy bỏ"}
                    </button>
                    {activeTab === "basic" && (
                      <button
                        onClick={
                          isEditing ? handleUpdateExam : handleCreateBasicExam
                        }
                        disabled={
                          !formData.name || !formData.subject || !formData.grade
                        }
                        className="px-6 py-3 bg-gradient-to-r from-orange to-red-wine text-white rounded-xl hover:from-orange-700 hover:to-red-wine-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center gap-2"
                      >
                        <HugeiconsIcon
                          icon={FileEditIcon}
                          className="w-5 h-5"
                        />
                        {isEditing
                          ? "Cập nhật đề thi"
                          : "Tạo đề thi và thêm câu hỏi"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
