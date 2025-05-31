import React, { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Quiz } from "../types/Quiz";
import {
  Add01Icon,
  Calendar03Icon,
  Cancel01Icon,
  FileEditIcon,
  FilterHorizontalIcon,
  GridViewIcon,
  LeftToRightListDashIcon,
  Search01Icon,
  SearchAreaIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { useNavigate } from "react-router";
import axios from "axios";
import SpinnerLoading from "./SpinnerLoading";

interface SelectQuizForRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SelectQuizForRoomModal: React.FC<SelectQuizForRoomModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [exams, setExams] = useState<Quiz[]>([]);
  const [selectedType, setSelectedType] = useState<"quiz" | "exam">("quiz");
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const { getToken } = useAuth();
  const [viewMode, setViewMode] = useState("grid");
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  // Add effect to manage body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchQuizzes();
      fetchExams();
    }
  }, [isOpen]);

  const fetchQuizzes = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      const response = await axios.get(
        `http://localhost:5000/api/quiz/user/${user?.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setQuizzes(response.data);
      console.log("Quizzes:", response.data);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      setQuizzes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExams = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      const response = await axios.get(
        `http://localhost:5000/api/quiz/user-exams/${user?.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const examData = response.data?.data || [];
      setExams(examData);
      console.log("Exams:", examData);
    } catch (error) {
      console.error("Error fetching exams:", error);
      setExams([]);
    } finally {
      setIsLoading(false);
    }
  };
  const filteredQuizzes = (quizzes || []).filter((quiz) =>
    quiz.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredExams = (exams || []).filter((exam) =>
    exam.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleQuizSelect = (item: Quiz) => {
    setSelectedQuiz(item);
    console.log("Selected:", item);
  };

  const handleCreateRoom = () => {
    if (selectedQuiz) {
      console.log("Creating room with quiz:", selectedQuiz);
      onClose();
      navigate(`/create-room/${selectedQuiz._id}`);
    }
  };

  // Render items based on selected type
  const renderItems = () => {
    const items = selectedType === "quiz" ? filteredQuizzes : filteredExams;

    // Hàm tính tổng số câu hỏi
    const getTotalQuestions = (item: Quiz) => {
      return (
        item.questionBankQueries?.reduce(
          (acc: number, query: any) => acc + query.limit,
          0
        ) || 0
      );
    };

    if (isLoading) {
      return (
        <div className="h-[400px]">
          <SpinnerLoading />
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <HugeiconsIcon
              icon={Search01Icon}
              className="w-12 h-12 text-gray-400"
            />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm
              ? "Không tìm thấy kết quả"
              : `Chưa có ${selectedType === "quiz" ? "quiz" : "đề thi"} nào`}
          </h3>
          <p className="text-gray-600">
            {searchTerm
              ? `Thử tìm kiếm với từ khóa khác hoặc tạo ${selectedType} mới`
              : `Tạo ${
                  selectedType === "quiz" ? "quiz" : "đề thi"
                } đầu tiên của bạn`}
          </p>
        </div>
      );
    }

    return (
      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            : "space-y-4"
        }
      >
        {items.map((item) => {
          const totalQuestions = getTotalQuestions(item);
          console.log("Item:", item.name, "Total Questions:", totalQuestions);

          return (
            <div
              key={item._id}
              onClick={() => handleQuizSelect(item)}
              className={`cursor-pointer transition-all duration-200 rounded-xl border-2 hover:shadow-lg ${
                selectedQuiz?._id === item._id
                  ? "border-orange-500 bg-orange-50 shadow-md transform scale-105"
                  : "border-gray-200 hover:border-orange-300 bg-white"
              } ${viewMode === "list" ? "flex items-center p-4" : "p-6"}`}
            >
              {viewMode === "grid" ? (
                <div className="space-y-4">
                  {/* Quiz/Exam Image/Icon */}
                  <div className="relative">
                    <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      )}
                    </div>
                    <div
                      className={`absolute top-3 right-3 px-2 py-1 bg-darkblue text-background rounded-full text-xs font-medium border`}
                    >
                      {item.difficulty}
                    </div>
                  </div>

                  {/* Quiz/Exam Info */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">
                        {item.name}
                      </h3>
                      <p className="text-orange-600 font-medium text-sm">
                        {item.topic}
                      </p>
                    </div>

                    <p className="text-gray-600 text-sm line-clamp-2">
                      {item.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                        <HugeiconsIcon
                          icon={LeftToRightListDashIcon}
                          className="w-4 h-4"
                          color="#FF5733"
                        />
                        <p className="font-medium text-sm">
                          {item.questions?.length || totalQuestions} câu
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 w-full">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-gray-900 truncate">
                        {item.name}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border`}
                      >
                        {item.difficulty}
                      </span>
                    </div>
                    <p className="text-orange-600 font-medium text-sm mb-2">
                      {item.topic}
                    </p>
                    <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full w-fit">
                      <HugeiconsIcon
                        icon={LeftToRightListDashIcon}
                        className="w-4 h-4"
                        color="#FF5733"
                      />
                      <p className="font-medium text-sm">
                        {item.questions?.length || totalQuestions} câu
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300 ${
        isAnimating ? "opacity-0" : "opacity-100"
      }`}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden transition-all duration-300 transform ${
          isAnimating ? "scale-95 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-darkblue">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-black/10 rounded-lg backdrop-blur-sm">
                <HugeiconsIcon
                  icon={selectedType === "quiz" ? GridViewIcon : FileEditIcon}
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  Chọn {selectedType === "quiz" ? "Quiz" : "Đề thi"} cho phòng
                </h2>
                <p className="text-orange-100 text-sm">
                  Tạo phòng{" "}
                  {selectedType === "quiz" ? "ôn tập với quiz" : " thi"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-gray-50 p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            {/* Type Selection */}
            <div className="flex bg-white rounded-xl p-1 shadow-sm border">
              <button
                onClick={() => setSelectedType("quiz")}
                className={`px-6 py-3 text-background rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                  selectedType === "quiz"
                    ? "bg-orange transform scale-105"
                    : "text-orange hover:bg-gray-100"
                }`}
              >
                <HugeiconsIcon icon={GridViewIcon} className="w-4 h-4" />
                Quiz
              </button>
              <button
                onClick={() => setSelectedType("exam")}
                className={`px-6  py-3 text-background rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                  selectedType === "exam"
                    ? "bg-orange transform scale-105"
                    : "text-orange hover:bg-gray-100"
                }`}
              >
                <HugeiconsIcon icon={FileEditIcon} className="w-4 h-4" />
                Đề thi
              </button>
            </div>

            {/* Search and View Controls */}
            <div className="flex gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-80">
                <HugeiconsIcon
                  icon={Search01Icon}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`Tìm kiếm ${
                    selectedType === "quiz" ? "quiz" : "đề thi"
                  }...`}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl transition-all duration-200"
                />
              </div>

              <div className="flex bg-white rounded-xl border-2 border-gray-200">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-3 rounded-l-xl transition-colors ${
                    viewMode === "grid"
                      ? "bg-orange text-background"
                      : "text-orange hover:bg-gray-100"
                  }`}
                >
                  <HugeiconsIcon icon={GridViewIcon} className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-3 rounded-r-xl transition-colors ${
                    viewMode === "list"
                      ? "bg-orange text-background"
                      : "text-orange hover:bg-gray-100"
                  }`}
                >
                  <HugeiconsIcon
                    icon={LeftToRightListDashIcon}
                    className="w-5 h-5"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-280px)]">
          {/* Stats Bar */}
          <div className="flex items-center justify-between mb-6 bg-blue-50 p-4 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2 text-blue-800">
              <HugeiconsIcon icon={FilterHorizontalIcon} className="w-5 h-5" />
              <span className="font-medium">
                {selectedType === "quiz"
                  ? filteredQuizzes.length
                  : filteredExams.length}{" "}
                {selectedType === "quiz" ? "quiz" : "đề thi"}
                {searchTerm && ` phù hợp với "${searchTerm}"`}
              </span>
            </div>
            {selectedQuiz && (
              <div className="flex items-center gap-2 text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                <HugeiconsIcon icon={ViewIcon} className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Đã chọn: {selectedQuiz.name}
                </span>
              </div>
            )}
          </div>

          {/* Quiz/Exam List */}
          {renderItems()}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {selectedQuiz && (
                <div className="flex items-center gap-2">
                  <HugeiconsIcon
                    icon={ViewIcon}
                    className="w-4 h-4 text-orange-600"
                  />
                  <span>
                    Sẵn sàng tạo phòng với <strong>{selectedQuiz.name}</strong>
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-xl transition-all duration-200 font-medium"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={!selectedQuiz}
                className={`px-6 py-3 rounded-xl transition-all duration-200 font-medium flex items-center gap-2 ${
                  selectedQuiz
                    ? "bg-gradient-to-r from-orange to-red-wine text-background btn-hover shadow-md"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                <HugeiconsIcon icon={Add01Icon} className="w-5 h-5" />
                Tạo phòng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectQuizForRoomModal;
