import React, { useState, useEffect } from "react";
import { useAuth, useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { Book01Icon, SearchAreaIcon } from "@hugeicons/core-free-icons";
import axios from "axios";

interface ExamSet {
  _id: string;
  name: string;
  subject: string;
  grade: string;
  questions: any[];
}

interface Section {
  difficulty: "easy" | "medium" | "hard";
  numberOfQuestions: number;
}

interface SelectQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SelectQuizModal: React.FC<SelectQuizModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExam, setSelectedExam] = useState<ExamSet | null>(null);
  const [sections, setSections] = useState<Section[]>([
    { difficulty: "easy", numberOfQuestions: 0 },
    { difficulty: "medium", numberOfQuestions: 0 },
    { difficulty: "hard", numberOfQuestions: 0 },
  ]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [examSets, setExamSets] = useState<ExamSet[]>([]);
  const { userId } = useAuth();
  const { session } = useClerk();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchExamSets();
    }
  }, [isOpen]);

  const fetchExamSets = async () => {
    try {
      const token = await session?.getToken();
      if (!token) {
        console.error("No token available");
        return;
      }

      const response = await axios.get("http://localhost:5000/api/examSets", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setExamSets(response.data);
    } catch (error) {
      console.error("Error fetching exam sets:", error);
    }
  };

  const handleSectionChange = (index: number, value: number) => {
    const newSections = [...sections];
    newSections[index].numberOfQuestions = value;
    setSections(newSections);
    setTotalQuestions(
      newSections.reduce((sum, section) => sum + section.numberOfQuestions, 0)
    );
  };

  const handleCreateRoom = async () => {
    if (!selectedExam) {
      alert("Vui lòng chọn đề thi");
      return;
    }

    if (totalQuestions === 0) {
      alert("Vui lòng nhập số câu hỏi cho mỗi phần");
      return;
    }

    try {
      const token = await session?.getToken();
      if (!token) {
        alert("Vui lòng đăng nhập để tạo phòng thi");
        return;
      }

      // Chuyển hướng đến trang tạo phòng với examId
      navigate(
        `/create-room/${selectedExam._id}?sections=${JSON.stringify(sections)}`
      );
      onClose();
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Có lỗi xảy ra khi tạo phòng thi");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Chọn đề thi</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            Đóng
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
              placeholder="Tìm kiếm đề thi..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Exam List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {examSets
              .filter((exam) =>
                exam.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((exam) => (
                <div
                  key={exam._id}
                  onClick={() => setSelectedExam(exam)}
                  className={`p-4 border rounded-lg cursor-pointer ${
                    selectedExam?._id === exam._id
                      ? "border-orange bg-orange-50"
                      : "border-gray-200 hover:border-orange"
                  }`}
                >
                  <h3 className="font-semibold">{exam.name}</h3>
                  <p className="text-sm text-gray-600">
                    {exam.subject} - Khối {exam.grade}
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-500">
                      {exam.questions.length} câu hỏi
                    </span>
                  </div>
                </div>
              ))}
          </div>

          {/* Section Configuration */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Cấu hình số câu hỏi</h3>
            <div className="space-y-4">
              {sections.map((section, index) => (
                <div
                  key={section.difficulty}
                  className="flex items-center gap-4"
                >
                  <label className="w-32 text-sm font-medium">
                    {section.difficulty === "easy"
                      ? "Dễ"
                      : section.difficulty === "medium"
                      ? "Trung bình"
                      : "Khó"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={section.numberOfQuestions}
                    onChange={(e) =>
                      handleSectionChange(index, parseInt(e.target.value) || 0)
                    }
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                  />
                  <span className="text-sm text-gray-500">câu hỏi</span>
                </div>
              ))}
              <div className="flex items-center gap-4 mt-4">
                <span className="w-32 text-sm font-medium">Tổng số câu:</span>
                <span className="text-lg font-semibold">{totalQuestions}</span>
              </div>
            </div>
          </div>
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
            className="px-4 py-2 bg-orange text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Tạo phòng
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectQuizModal;
