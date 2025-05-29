import React, { useState, useEffect } from "react";
import { useClerk } from "@clerk/clerk-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { SearchAreaIcon } from "@hugeicons/core-free-icons";
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
        questions: exam.questions.map(q => ({
          ...q,
          difficulty: typeof q.difficulty === 'string' ? q.difficulty : 'medium'
        }))
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
    setTotalQuestions(sections.reduce((sum, section) => sum + section.numberOfQuestions, 0));
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
        easy: selectedExam.questions.filter(q => q.difficulty === "easy").length,
        medium: selectedExam.questions.filter(q => q.difficulty === "medium").length,
        hard: selectedExam.questions.filter(q => q.difficulty === "hard").length
      };

      for (const section of sections) {
        if (section.numberOfQuestions > availableQuestions[section.difficulty]) {
          setError(`Not enough ${section.difficulty} questions available`);
          return false;
        }
      }
    }

    return true;
  };

  const handleAddQuestions = () => {
    if (!validateQuestions()) return;

    const questionBankQueries = isTotalMode
      ? [{
          examSetId: selectedExam!._id,
          difficulty: "",
          limit: totalQuestions
        }]
      : sections
          .filter(section => section.numberOfQuestions > 0)
          .map(section => ({
            examSetId: selectedExam!._id,
            difficulty: section.difficulty,
            limit: section.numberOfQuestions
          }));

    onAddQuestions(questionBankQueries, selectedExam!.name);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Select Questions from Question Bank
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        {/* Search Bar */}
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
              placeholder="Search exam sets..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Exam Sets List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="col-span-2 text-center py-8">Loading...</div>
            ) : availableExamSets.filter(exam =>
                exam.name.toLowerCase().includes(searchTerm.toLowerCase())
              ).length === 0 ? (
              <div className="col-span-2 text-center py-8 text-gray-500">
                {searchTerm ? "No matching exam sets found" : "All exam sets have been selected"}
              </div>
            ) : (
              availableExamSets
                .filter(exam =>
                  exam.name.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((exam) => (
                  <div
                    key={exam._id}
                    onClick={() => {
                      setSelectedExam(exam);
                      setError(null);
                    }}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedExam?._id === exam._id
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-orange-300"
                    }`}
                  >
                    <h3 className="font-semibold">{exam.name}</h3>
                    <p className="text-sm text-gray-600">
                      {exam.subject} • Grade {exam.grade}
                    </p>
                    <div className="mt-2 flex justify-between text-sm">
                      <span className="text-gray-500">
                        Total: {exam.questions.length} questions
                      </span>
                      <span className="flex gap-2">
                        <span className="text-green-600">
                          Easy: {exam.questions.filter(q => q.difficulty === "easy").length}
                        </span>
                        <span className="text-yellow-600">
                          Medium: {exam.questions.filter(q => q.difficulty === "medium").length}
                        </span>
                        <span className="text-red-600">
                          Hard: {exam.questions.filter(q => q.difficulty === "hard").length}
                        </span>
                      </span>
                    </div>
                  </div>
                ))
            )}
          </div>

          {/* Questions Configuration */}
          {selectedExam && (
            <div className="border-t pt-6">
              <div className="flex items-center gap-4 mb-4">
                <h3 className="text-lg font-semibold">Questions Configuration</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="totalMode"
                    checked={isTotalMode}
                    onChange={(e) => {
                      setIsTotalMode(e.target.checked);
                      setError(null);
                    }}
                    className="form-checkbox h-4 w-4 text-orange-500"
                  />
                  <label htmlFor="totalMode" className="text-sm">
                    Select by total questions
                  </label>
                </div>
              </div>

              {isTotalMode ? (
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium">Total questions:</label>
                  <input
                    type="number"
                    min="0"
                    max={selectedExam.questions.length}
                    value={totalQuestions}
                    onChange={(e) => handleTotalQuestionsChange(parseInt(e.target.value) || 0)}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <span className="text-sm text-gray-500">
                    / {selectedExam.questions.length} available
                  </span>
                </div>
              ) : (
                <div className="space-y-4">
                  {sections.map((section, index) => {
                    const available = selectedExam.questions.filter(
                      q => q.difficulty === section.difficulty
                    ).length;
                    return (
                      <div key={section.difficulty} className="flex items-center gap-4">
                        <label className="w-32 text-sm font-medium capitalize">
                          {section.difficulty}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={available}
                          value={section.numberOfQuestions}
                          onChange={(e) =>
                            handleSectionChange(index, parseInt(e.target.value) || 0)
                          }
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                        <span className="text-sm text-gray-500">
                          / {available} available
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center gap-4 mt-4">
                <span className="w-32 text-sm font-medium">Total selected:</span>
                <span className="text-lg font-semibold">
                  {totalQuestions} / {selectedExam.questions.length}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAddQuestions}
            disabled={!selectedExam || totalQuestions <= 0}
            className={`px-4 py-2 rounded-lg transition-colors ${
              !selectedExam || totalQuestions <= 0
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-orange-500 text-gray-700 hover:bg-orange-600"
            }`}
          >
            Add Questions
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectQuizModal;