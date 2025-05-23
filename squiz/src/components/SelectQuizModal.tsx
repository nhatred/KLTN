import React, { useState, useEffect } from "react";
import { useAuth, useClerk } from "@clerk/clerk-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { SearchAreaIcon } from "@hugeicons/core-free-icons";
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
  onAddQuestions: (
    questionBankQueries: Array<{
      questionBankId: string;
      difficulty: string[];
      limit: number;
    }>,
    examName: string
  ) => void;
  selectedBankIds?: string[];
}

const SelectQuizModal: React.FC<SelectQuizModalProps> = ({
  isOpen,
  onClose,
  onAddQuestions,
  selectedBankIds = [],
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
  const [isTotalMode, setIsTotalMode] = useState(false);
  const { session } = useClerk();

  const availableExamSets = examSets.filter(
    (exam) => !selectedBankIds.includes(exam._id)
  );

  useEffect(() => {
    if (isOpen) {
      fetchExamSets();
      setSelectedExam(null);
      setTotalQuestions(0);
      setSections([
        { difficulty: "easy", numberOfQuestions: 0 },
        { difficulty: "medium", numberOfQuestions: 0 },
        { difficulty: "hard", numberOfQuestions: 0 },
      ]);
      setIsTotalMode(false);
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

  const handleTotalQuestionsChange = (value: number) => {
    setTotalQuestions(value);
  };

  const handleAddQuestions = () => {
    if (!selectedExam) {
      alert("Vui lòng chọn đề thi");
      return;
    }

    if (totalQuestions === 0) {
      alert("Vui lòng nhập số câu hỏi");
      return;
    }

    let questionBankQueries;

    if (isTotalMode) {
      questionBankQueries = [
        {
          questionBankId: selectedExam._id,
          difficulty: ["easy", "medium", "hard", "total"],
          limit: totalQuestions,
        },
      ];
    } else {
      questionBankQueries = sections
        .filter((section) => section.numberOfQuestions > 0)
        .map((section) => ({
          questionBankId: selectedExam._id,
          difficulty: [section.difficulty],
          limit: section.numberOfQuestions,
        }));
    }

    onAddQuestions(questionBankQueries, selectedExam.name);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Chọn đề thi từ ngân hàng đề
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            Đóng
          </button>
        </div>

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

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {availableExamSets
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
            {availableExamSets.length === 0 && (
              <div className="col-span-2 text-center py-8 text-gray-500">
                {searchTerm ? (
                  <p>Không tìm thấy đề thi phù hợp</p>
                ) : (
                  <p>Tất cả đề thi đã được chọn</p>
                )}
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-lg font-semibold">Cấu hình số câu hỏi</h3>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="totalMode"
                  checked={isTotalMode}
                  onChange={(e) => setIsTotalMode(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-orange"
                />
                <label htmlFor="totalMode" className="text-sm">
                  Chọn theo tổng số câu
                </label>
              </div>
            </div>

            {isTotalMode ? (
              <div className="flex items-center gap-4">
                <label className="w-32 text-sm font-medium">Tổng số câu:</label>
                <input
                  type="number"
                  min="0"
                  value={totalQuestions}
                  onChange={(e) =>
                    handleTotalQuestionsChange(parseInt(e.target.value) || 0)
                  }
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                />
                <span className="text-sm text-gray-500">câu hỏi</span>
              </div>
            ) : (
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
                        handleSectionChange(
                          index,
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                    />
                    <span className="text-sm text-gray-500">câu hỏi</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 mt-4">
              <span className="w-32 text-sm font-medium">Tổng số câu:</span>
              <span className="text-lg font-semibold">{totalQuestions}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleAddQuestions}
            className="px-4 py-2 bg-orange text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Thêm
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectQuizModal;
