import React, { useState, useEffect } from "react";
import { useClerk } from "@clerk/clerk-react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  FileEditIcon,
  FileIcon,
  InformationCircleIcon,
  SearchAreaIcon,
  SettingsIcon,
  Search01Icon,
  Add01Icon,
} from "@hugeicons/core-free-icons";
import axios from "axios";

interface ExamSet {
  _id: string;
  name: string;
  subject: string;
  grade: string;
  questions: Array<{
    _id: string;
    difficulty: "easy" | "medium" | "hard";
  }>;
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
      examSetId: string;
      difficulty: string;
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useClerk();

  // Lọc các bộ đề chưa được chọn
  const availableExamSets = examSets.filter(
    (exam) => !selectedBankIds.includes(exam._id)
  );

  useEffect(() => {
    if (isOpen) {
      fetchExamSets();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setSelectedExam(null);
    setTotalQuestions(0);
    setSections([
      { difficulty: "easy", numberOfQuestions: 0 },
      { difficulty: "medium", numberOfQuestions: 0 },
      { difficulty: "hard", numberOfQuestions: 0 },
    ]);
    setIsTotalMode(false);
    setError(null);
  };

  const fetchExamSets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await session?.getToken();
      if (!token) throw new Error("No authentication token found");

      const response = await axios.get("http://localhost:5000/api/examSets", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Đảm bảo difficulty là string
      const sanitizedData = response.data.map((exam: ExamSet) => ({
        ...exam,
        questions: exam.questions.map((q) => ({
          ...q,
          difficulty:
            typeof q.difficulty === "string" ? q.difficulty : "medium",
        })),
      }));

      setExamSets(sanitizedData);
    } catch (err) {
      setError("Failed to load exam sets. Please try again.");
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSectionChange = (index: number, value: number) => {
    const newSections = [...sections];
    newSections[index].numberOfQuestions = Math.max(0, value);
    setSections(newSections);
    updateTotalQuestions(newSections);
  };

  const updateTotalQuestions = (sections: Section[]) => {
    setTotalQuestions(
      sections.reduce((sum, section) => sum + section.numberOfQuestions, 0)
    );
  };

  const handleTotalQuestionsChange = (value: number) => {
    setTotalQuestions(Math.max(0, value));
  };

  const validateQuestions = () => {
    if (!selectedExam) {
      setError("Please select an exam set");
      return false;
    }

    if (totalQuestions <= 0) {
      setError("Number of questions must be greater than 0");
      return false;
    }

    if (!isTotalMode) {
      const availableQuestions = {
        easy: selectedExam.questions.filter((q) => q.difficulty === "easy")
          .length,
        medium: selectedExam.questions.filter((q) => q.difficulty === "medium")
          .length,
        hard: selectedExam.questions.filter((q) => q.difficulty === "hard")
          .length,
      };

      for (const section of sections) {
        if (
          section.numberOfQuestions > availableQuestions[section.difficulty]
        ) {
          setError(`Not enough ${section.difficulty} questions available`);
          return false;
        }
      }
    }

    return true;
  };

  const handleAddQuestions = () => {
    if (!validateQuestions()) return;

    let questionBankQueries;

    if (isTotalMode) {
      // Calculate the number of questions for each difficulty based on their ratios
      const totalAvailable = selectedExam!.questions.length;
      const easyCount = selectedExam!.questions.filter(
        (q) => q.difficulty === "easy"
      ).length;
      const mediumCount = selectedExam!.questions.filter(
        (q) => q.difficulty === "medium"
      ).length;
      const hardCount = selectedExam!.questions.filter(
        (q) => q.difficulty === "hard"
      ).length;

      // Calculate ratios
      const easyRatio = easyCount / totalAvailable;
      const mediumRatio = mediumCount / totalAvailable;
      const hardRatio = hardCount / totalAvailable;

      // Calculate number of questions for each difficulty
      let easyQuestions = Math.round(totalQuestions * easyRatio);
      let mediumQuestions = Math.round(totalQuestions * mediumRatio);
      let hardQuestions = Math.round(totalQuestions * hardRatio);

      // Adjust for rounding errors to match total
      const sum = easyQuestions + mediumQuestions + hardQuestions;
      if (sum > totalQuestions) {
        // Remove from the largest number
        if (
          easyQuestions >= mediumQuestions &&
          easyQuestions >= hardQuestions
        ) {
          easyQuestions -= sum - totalQuestions;
        } else if (
          mediumQuestions >= easyQuestions &&
          mediumQuestions >= hardQuestions
        ) {
          mediumQuestions -= sum - totalQuestions;
        } else {
          hardQuestions -= sum - totalQuestions;
        }
      } else if (sum < totalQuestions) {
        // Add to the smallest number that has available questions
        if (
          easyQuestions < easyCount &&
          (easyQuestions <= mediumQuestions ||
            mediumQuestions >= mediumCount) &&
          (easyQuestions <= hardQuestions || hardQuestions >= hardCount)
        ) {
          easyQuestions += totalQuestions - sum;
        } else if (
          mediumQuestions < mediumCount &&
          (mediumQuestions <= hardQuestions || hardQuestions >= hardCount)
        ) {
          mediumQuestions += totalQuestions - sum;
        } else {
          hardQuestions += totalQuestions - sum;
        }
      }

      questionBankQueries = [
        ...(easyQuestions > 0
          ? [
              {
                examSetId: selectedExam!._id,
                difficulty: "easy",
                limit: easyQuestions,
              },
            ]
          : []),
        ...(mediumQuestions > 0
          ? [
              {
                examSetId: selectedExam!._id,
                difficulty: "medium",
                limit: mediumQuestions,
              },
            ]
          : []),
        ...(hardQuestions > 0
          ? [
              {
                examSetId: selectedExam!._id,
                difficulty: "hard",
                limit: hardQuestions,
              },
            ]
          : []),
      ];
    } else {
      questionBankQueries = sections
        .filter((section) => section.numberOfQuestions > 0)
        .map((section) => ({
          examSetId: selectedExam!._id,
          difficulty: section.difficulty,
          limit: section.numberOfQuestions,
        }));
    }

    onAddQuestions(questionBankQueries, selectedExam!.name);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300`}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden transition-all duration-300 transform`}
        style={{ maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange to-red-wine p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <HugeiconsIcon icon={FileEditIcon} className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-background">
                  Chọn bộ đề thi
                </h2>
                <p className="text-blue-100 text-sm">
                  Chúng tôi sẽ xáo trộn câu hỏi để tạo ra một đề thi mới
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

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                {error}
              </div>
            )}

            {/* Search Bar */}
            <div className="relative">
              <HugeiconsIcon
                icon={SearchAreaIcon}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm bộ đề thi..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange transition-all duration-200"
              />
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {/* Exam Sets List */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isLoading ? (
                  <div className="col-span-2 flex flex-col items-center justify-center py-8">
                    <div className="loader mb-4"></div>
                    <span>Đang tải dữ liệu...</span>
                  </div>
                ) : availableExamSets.filter((exam) =>
                    exam.name.toLowerCase().includes(searchTerm.toLowerCase())
                  ).length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    <HugeiconsIcon
                      icon={Search01Icon}
                      className="w-12 h-12 mx-auto mb-4 text-gray-300"
                    />
                    {searchTerm
                      ? "Không tìm thấy bộ đề thi phù hợp"
                      : "Tất cả bộ đề thi đã được chọn"}
                  </div>
                ) : (
                  availableExamSets
                    .filter((exam) =>
                      exam.name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((exam) => (
                      <div
                        key={exam._id}
                        onClick={() => {
                          setSelectedExam(exam);
                          setError(null);
                        }}
                        className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                          selectedExam?._id === exam._id
                            ? "border-orange bg-orange-50"
                            : "border-gray-200 hover:border-orange-300"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              selectedExam?._id === exam._id
                                ? "bg-orange-100 text-orange-600"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            <HugeiconsIcon
                              icon={FileIcon}
                              className="w-5 h-5"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">
                              {exam.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {exam.subject} • {exam.grade}
                            </p>
                            <div className="mt-3">
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-500">
                                  Tổng: {exam.questions.length} câu hỏi
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <span className="px-2 py-1 bg-green-50 text-green-600 text-xs rounded-full">
                                  Dễ:{" "}
                                  {
                                    exam.questions.filter(
                                      (q) => q.difficulty === "easy"
                                    ).length
                                  }
                                </span>
                                <span className="px-2 py-1 bg-yellow-50 text-yellow-600 text-xs rounded-full">
                                  TB:{" "}
                                  {
                                    exam.questions.filter(
                                      (q) => q.difficulty === "medium"
                                    ).length
                                  }
                                </span>
                                <span className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded-full">
                                  Khó:{" "}
                                  {
                                    exam.questions.filter(
                                      (q) => q.difficulty === "hard"
                                    ).length
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Questions Configuration */}
            {selectedExam && (
              <div className="border-t pt-6 mt-6">
                <div className="flex items-center gap-4 mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <HugeiconsIcon
                      icon={SettingsIcon}
                      className="w-5 h-5 text-orange"
                    />
                    Cấu hình câu hỏi
                  </h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="totalMode"
                      checked={isTotalMode}
                      onChange={(e) => {
                        setIsTotalMode(e.target.checked);
                        setError(null);
                      }}
                      className="form-checkbox h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="totalMode"
                      className="text-sm text-gray-700"
                    >
                      Chọn tổng số câu hỏi
                    </label>
                  </div>
                </div>

                {isTotalMode ? (
                  <div className="flex items-center gap-4">
                    <label className="w-32 text-sm font-medium text-gray-700">
                      Tổng số câu hỏi:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max={selectedExam.questions.length}
                        value={totalQuestions}
                        onChange={(e) =>
                          handleTotalQuestionsChange(
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-24 px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-orange transition-all duration-200"
                      />
                      <span className="text-sm text-gray-500">
                        / {selectedExam.questions.length} câu hỏi có sẵn
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sections.map((section, index) => {
                      const available = selectedExam.questions.filter(
                        (q) => q.difficulty === section.difficulty
                      ).length;
                      return (
                        <div
                          key={section.difficulty}
                          className="flex items-center gap-4"
                        >
                          <label className="w-32 text-sm font-medium text-gray-700 capitalize">
                            {section.difficulty === "easy"
                              ? "Dễ"
                              : section.difficulty === "medium"
                              ? "Trung bình"
                              : "Khó"}
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max={available}
                              value={section.numberOfQuestions}
                              onChange={(e) =>
                                handleSectionChange(
                                  index,
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-24 px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-orange transition-all duration-200"
                            />
                            <span className="text-sm text-gray-500">
                              / {available} câu hỏi
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center gap-4 mt-6 p-3 bg-gray-50 rounded-lg">
                  <HugeiconsIcon
                    icon={InformationCircleIcon}
                    className="w-5 h-5 text-orange"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Tổng số câu hỏi đã chọn:
                    </p>
                    <p className="text-lg font-semibold">
                      {totalQuestions} / {selectedExam.questions.length}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-xl transition-all duration-200 font-medium"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleAddQuestions}
              disabled={!selectedExam || totalQuestions <= 0}
              className={`px-6 py-3 rounded-xl transition-all ${
                !selectedExam || totalQuestions <= 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-orange to-red-wine text-white hover:from-orange-700 hover:to-red-wine-700"
              } font-medium flex items-center gap-2`}
            >
              <HugeiconsIcon icon={Add01Icon} className="w-5 h-5" />
              Thêm câu hỏi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectQuizModal;
