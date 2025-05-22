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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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

  const handleCreateExam = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
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

  const handleGenerateExam = async (examId: string) => {
    try {
      const response = await axios.post(`/api/examSets/${examId}/generate`);
      setExams((prev) =>
        prev.map((exam) => (exam._id === examId ? response.data : exam))
      );
    } catch (error) {
      console.error("Error generating exam:", error);
      alert("Có lỗi xảy ra khi tạo đề thi tự động");
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 pt-32">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Ngân Hàng Đề Thi
          </h1>
          <p className="text-gray-600">Quản lý và tổ chức các đề thi của bạn</p>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4 mb-4">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <HugeiconsIcon icon={Search01Icon} />
                <input
                  type="text"
                  placeholder="Tìm kiếm đề thi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-32"
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-32"
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg ${
                  viewMode === "grid"
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg ${
                  viewMode === "list"
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <button
              onClick={handleCreateExam}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              <HugeiconsIcon icon={Add01Icon} />
              Tạo đề thi mới
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
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
          <div className="bg-white p-4 rounded-lg shadow-sm">
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
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Môn học</p>
                <p className="text-2xl font-bold text-gray-900">
                  {availableSubjects.length}
                </p>
              </div>
              <HugeiconsIcon icon={BookOpen01Icon} />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Khối lớp</p>
                <p className="text-2xl font-bold text-gray-900">
                  {availableGrades.length}
                </p>
              </div>
              <HugeiconsIcon icon={UserIcon} />
            </div>
          </div>
        </div>

        {/* Exam List */}
        {filteredExams.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <HugeiconsIcon
              icon={BookOpen01Icon}
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
            />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Không tìm thấy đề thi
            </h3>
            <p className="text-gray-600 mb-6">
              Thử điều chỉnh bộ lọc hoặc tạo đề thi mới
            </p>
            <button
              onClick={handleCreateExam}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tạo đề thi đầu tiên
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.map((exam) => (
              <div
                key={exam._id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200"
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
                      icon={BookOpen01Icon}
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
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
                        <div className="text-sm text-gray-500">
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
                      {exam.sections.reduce(
                        (total, section) => total + section.numberOfQuestions,
                        0
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(exam.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <HugeiconsIcon icon={ViewIcon} />
                        </button>
                        <button className="text-green-600 hover:text-green-900">
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

        {/* Create Exam Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Tạo đề thi mới
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Thông tin đề thi
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên đề thi <span className="text-red-500">*</span>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nhập tên đề thi"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Môn học <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Khối lớp <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Chọn hoặc nhập khối lớp"
                      />
                      <datalist id="grades">
                        {availableGrades.map((grade) => (
                          <option key={grade} value={grade} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Mô tả ngắn về đề thi"
                    />
                  </div>
                </div>

                {/* Question List */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Danh sách câu hỏi
                    </h3>
                    <span className="text-sm text-gray-600">
                      {formData.questions.length} câu hỏi
                    </span>
                  </div>

                  {formData.questions.map((question, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {question.questionText}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Mức độ:{" "}
                            {question.difficulty === "easy"
                              ? "Dễ"
                              : question.difficulty === "medium"
                              ? "Trung bình"
                              : "Khó"}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveQuestion(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <HugeiconsIcon icon={Delete01Icon} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add New Question */}
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Thêm câu hỏi mới
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nội dung câu hỏi <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={currentQuestion.questionText}
                      onChange={(e) =>
                        setCurrentQuestion((prev) => ({
                          ...prev,
                          questionText: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Nhập nội dung câu hỏi"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mức độ <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={currentQuestion.difficulty}
                      onChange={(e) =>
                        setCurrentQuestion((prev) => ({
                          ...prev,
                          difficulty: e.target.value as
                            | "easy"
                            | "medium"
                            | "hard",
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="easy">Dễ</option>
                      <option value="medium">Trung bình</option>
                      <option value="hard">Khó</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Các lựa chọn <span className="text-red-500">*</span>
                    </label>
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...currentQuestion.options];
                            newOptions[index] = e.target.value;
                            setCurrentQuestion((prev) => ({
                              ...prev,
                              options: newOptions,
                            }));
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={`Lựa chọn ${index + 1}`}
                        />
                        <input
                          type="checkbox"
                          checked={currentQuestion.answers.includes(index)}
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
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-600">
                          Đáp án đúng
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleAddQuestion}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Thêm câu hỏi
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmitExam}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Tạo đề thi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
