import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { SearchAreaIcon } from "@hugeicons/core-free-icons";
import { useNavigate } from "react-router";
import axios from "axios";

interface Quiz {
  _id: string;
  name: string;
  topic: string;
  isExam: boolean;
  imageUrl: string;
  creatorInfo: {
    name: string;
    avatar: string;
  };
}

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
  const [selectedType, setSelectedType] = useState<"quiz" | "exam">("quiz");
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    if (isOpen) {
      fetchQuizzes();
    }
  }, [isOpen]);

  const fetchQuizzes = async () => {
    try {
      const token = await getToken();
      const response = await axios.get("http://localhost:5000/api/quiz", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setQuizzes(response.data);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    }
  };

  const filteredQuizzes = quizzes.filter(
    (quiz) =>
      quiz.isExam === (selectedType === "exam") &&
      quiz.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleQuizSelect = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    console.log("Selected Quiz:", quiz);
  };

  const handleCreateRoom = () => {
    if (selectedQuiz) {
      console.log("Creating room with quiz:", selectedQuiz);
      onClose();
      navigate(`/create-room/${selectedQuiz._id}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Chọn {selectedType === "quiz" ? "Quiz" : "Đề thi"} cho phòng
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Type Selection */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setSelectedType("quiz")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              selectedType === "quiz"
                ? "bg-orange text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Quiz
          </button>
          <button
            onClick={() => setSelectedType("exam")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              selectedType === "exam"
                ? "bg-orange text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Đề thi
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <HugeiconsIcon
              icon={SearchAreaIcon}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Tìm kiếm ${
                selectedType === "quiz" ? "quiz" : "đề thi"
              }...`}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
            />
          </div>
        </div>

        {/* Quiz List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz._id}
              onClick={() => handleQuizSelect(quiz)}
              className={`p-4 border rounded-lg cursor-pointer ${
                selectedQuiz?._id === quiz._id
                  ? "border-orange bg-orange-50"
                  : "border-gray-200 hover:border-orange"
              }`}
            >
              <div className="flex gap-3">
                <img
                  src={quiz.imageUrl || "/default-quiz-image.png"}
                  alt={quiz.name}
                  className="w-20 h-20 object-cover rounded"
                />
                <div>
                  <h3 className="font-semibold">{quiz.name}</h3>
                  <p className="text-sm text-gray-600">{quiz.topic}</p>
                </div>
              </div>
            </div>
          ))}
          {filteredQuizzes.length === 0 && (
            <div className="col-span-2 text-center py-8 text-gray-500">
              {searchTerm ? (
                <p>Không tìm thấy kết quả phù hợp</p>
              ) : (
                <p>Chưa có {selectedType === "quiz" ? "quiz" : "đề thi"} nào</p>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleCreateRoom}
            disabled={!selectedQuiz}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedQuiz
                ? "bg-orange text-white hover:bg-orange-600"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            Tạo phòng
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectQuizForRoomModal;
