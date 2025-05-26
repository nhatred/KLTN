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
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";

interface Section {
  difficulty: "easy" | "medium" | "hard";
  numberOfQuestions: number;
  totalPoints: number;
  pointPerQuestion: number;
}

interface Exam {
  _id: string;
  name: string;
  description: string;
  subject: string;
  grade: string;
  sections: Section[];
  questions: {
    question: {
      _id: string;
      questionText: string;
      difficulty: string;
    };
    section: string;
    order: number;
  }[];
  createdAt: string;
  createdBy: string;
}

interface Question {
  questionText: string;
  options: string[];
  answers: number[];
  difficulty: "easy" | "medium" | "hard";
}

interface CreateExamForm {
  name: string;
  subject: string;
  grade: string;
  description: string;
  questions: Question[];
}

export default function ExamBank() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    const savedViewMode = localStorage.getItem("examBankViewMode");
    return savedViewMode === "grid" || savedViewMode === "list"
      ? savedViewMode
      : "grid";
  });

  const [formData, setFormData] = useState<CreateExamForm>({
    name: "",
    subject: "",
    grade: "",
    description: "",
    questions: [],
  });

  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    questionText: "",
    options: ["", "", "", ""],
    answers: [],
    difficulty: "easy",
  });

  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [availableGrades, setAvailableGrades] = useState<string[]>([]);

  const subjects = [
    "Toán học",
    "Vật lý",
    "Hóa học",
    "Sinh học",
    "Tiếng Anh",
    "Văn học",
  ];
  const grades = ["10", "11", "12"];

  // Fetch exams from API
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await axios.get("/api/examSets");
        setExams(response.data);

        // Lấy danh sách môn học và khối lớp từ đề thi
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
      }
    };
    fetchExams();
  }, []);

  // Save view mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("examBankViewMode", viewMode);
  }, [viewMode]);

  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
  };

  // Add effect to handle body scroll lock
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  const handleCreateExam = () => {
    setIsModalOpen(true);
  };
  const [isAnimating, setIsAnimating] = useState(false);
  const handleCloseModal = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsAnimating(false);
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
    }, 200);
  };

  const handleAddQuestion = () => {
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

    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, currentQuestion],
    }));

    setCurrentQuestion({
      questionText: "",
      options: ["", "", "", ""],
      answers: [],
      difficulty: "easy",
    });
  };
  const [activeTab, setActiveTab] = useState("basic");
  const handleRemoveQuestion = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const handleSubmitExam = async () => {
    if (!formData.name || !formData.subject || !formData.grade) {
      alert("Vui lòng điền đầy đủ thông tin đề thi");
      return;
    }

    if (formData.questions.length === 0) {
      alert("Vui lòng thêm ít nhất một câu hỏi");
      return;
    }

    try {
      const formattedQuestions = formData.questions.map((q) => ({
        questionText: q.questionText,
        options: q.options,
        answers: q.options.map((option, index) => ({
          text: option,
          isCorrect: q.answers.includes(index),
        })),
        difficulty: q.difficulty,
      }));

      const response = await axios.post("/api/examSets", {
        name: formData.name,
        description: formData.description,
        subject: formData.subject,
        grade: formData.grade,
        questions: formattedQuestions,
      });
      setExams((prev) => [response.data, ...prev]);
      handleCloseModal();
    } catch (error) {
      console.error("Error creating exam:", error);
      alert("Có lỗi xảy ra khi tạo đề thi");
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

  // Filtered and sorted exams
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

    // Sort exams
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
            {/* Search */}
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

            {/* Filters */}
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

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={() => handleViewModeChange("grid")}
                className={`p-2 rounded-lg ${
                  viewMode === "grid"
                    ? "bg-red-100 text-orange"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                aria-label="Grid view"
                type="button"
              >
                <HugeiconsIcon icon={GridViewIcon} />
              </button>
              <button
                onClick={() => handleViewModeChange("list")}
                className={`p-2 rounded-lg ${
                  viewMode === "list"
                    ? "bg-red-100 text-orange"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                aria-label="List view"
                type="button"
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
        {filteredExams.length === 0 ? (
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                    <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                      <HugeiconsIcon icon={ViewIcon} />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-green-600 transition-colors">
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
                      {exam.sections && exam.sections.length > 0
                        ? exam.sections.reduce(
                            (total, section) =>
                              total + (section?.numberOfQuestions || 0),
                            0
                          )
                        : exam.questions?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(exam.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          aria-label="View exam"
                        >
                          <HugeiconsIcon icon={ViewIcon} />
                        </button>
                        <button
                          className="text-green-600 hover:text-green-900"
                          aria-label="Edit exam"
                        >
                          <HugeiconsIcon icon={FileEditIcon} />
                        </button>
                        <button
                          onClick={() => handleDeleteExam(exam._id)}
                          className="text-red-600 hover:text-red-900"
                          aria-label="Delete exam"
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
              {/* Header */}
              <div className="bg-gradient-to-r from-orange to-red-wine p-6 text-white">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <HugeiconsIcon icon={FileEditIcon} className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Tạo bộ đề thi mới</h2>
                      <p className="text-blue-100 text-sm">
                        Thiết lập thông tin và câu hỏi cho đề thi
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

              {/* Tab Navigation */}
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
                    className={`flex-1 px-6 py-4 font-medium text-sm transition-all duration-200 ${
                      activeTab === "questions"
                        ? "bg-white text-orange border-b-2 border-orange"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <HugeiconsIcon
                        icon={LeftToRightListDashIcon}
                        className="w-4 h-4"
                      />
                      Danh sách câu hỏi
                      {formData.questions.length > 0 && (
                        <span className="ml-1 px-2 py-0.5 bg-orange text-background text-xs rounded-full">
                          {formData.questions.length}
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
                {activeTab === "basic" && (
                  <div className="p-6 space-y-6">
                    {/* Basic Information Grid */}
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
                          className="w-full p-4 font-medium border-2 border-gray-200 rounded-xl focus:border-orange transition-all duration-200 text-gray-900 "
                          placeholder="Nhập tên đề thi (ví dụ: Kiểm tra giữa kỳ I - Toán 9)"
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
                          Mô tả <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          className="w-full p-4 border-2 border-gray-200 rounded-xl  transition-all duration-200 resize-none"
                          rows={4}
                          placeholder="Mô tả chi tiết về nội dung, mục đích và yêu cầu của đề thi..."
                        />
                      </div>
                    </div>

                    {/* Preview Card */}
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
                    {/* Questions List */}
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
                          {formData.questions.length} câu hỏi
                        </div>
                      </div>

                      {formData.questions.length === 0 ? (
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
                        <div className="space-y-4">
                          {formData.questions.map((question, index) => (
                            <div
                              key={index}
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
                                      (option, optIndex) => (
                                        <div
                                          key={optIndex}
                                          className={`p-3 rounded-lg border-2 text-sm ${
                                            question.answers.includes(optIndex)
                                              ? "bg-green-50 border-green-200 text-green-500 font-medium"
                                              : "bg-gray-50 border-gray-200 text-gray-700"
                                          }`}
                                        >
                                          <span className="font-medium mr-2">
                                            {String.fromCharCode(65 + optIndex)}
                                            .
                                          </span>
                                          {option}
                                          {question.answers.includes(
                                            optIndex
                                          ) && (
                                            <span className="ml-2 text-green-600">
                                              ✓
                                            </span>
                                          )}
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveQuestion(index)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <HugeiconsIcon
                                    icon={Delete01Icon}
                                    className="w-5 h-5"
                                  />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Add New Question */}
                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-dashed border-orange rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <HugeiconsIcon
                          icon={Add01Icon}
                          className="w-5 h-5 text-orange"
                        />
                        Thêm câu hỏi mới
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

                        <button
                          onClick={handleAddQuestion}
                          disabled={
                            !currentQuestion.questionText.trim() ||
                            currentQuestion.answers.length === 0
                          }
                          className="w-full px-6 py-4 bg-gradient-to-r from-orange to-red-wine text-white rounded-xl hover:from-orange-700 hover:to-red-wine-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center gap-2"
                        >
                          <HugeiconsIcon icon={Add01Icon} className="w-5 h-5" />
                          Thêm câu hỏi
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    {formData.questions.length > 0 && (
                      <span className="flex items-center gap-2">
                        <HugeiconsIcon
                          icon={LeftToRightListDashIcon}
                          className="w-4 h-4"
                        />
                        {formData.questions.length} câu hỏi đã thêm
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCloseModal}
                      className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-xl transition-all duration-200 font-medium"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      onClick={handleSubmitExam}
                      disabled={
                        !formData.name ||
                        !formData.subject ||
                        !formData.grade ||
                        formData.questions.length === 0
                      }
                      className="px-6 py-3 bg-gradient-to-r from-orange to-red-wine text-white rounded-xl hover:from-orange-700 hover:to-red-wine-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center gap-2"
                    >
                      <HugeiconsIcon icon={FileEditIcon} className="w-5 h-5" />
                      Tạo đề thi
                    </button>
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
