import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
export const EditQuestionModal = ({
  isOpen,
  onClose,
  question,
  onSave,
  TIME_OPTIONS,
  SCORE_OPTIONS,
  DIFFICULTY_OPTIONS,
}: any) => {
  const [editedQuestion, setEditedQuestion] = useState({
    questionId: "",
    questionText: "",
    questionType: "multipleChoices",
    timePerQuestion: 30,
    scorePerQuestion: 1,
    difficulty: "easy",
    options: [],
    answers: [
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ],
  });

  // Initialize modal with question data when opened
  useEffect(() => {
    if (question && isOpen) {
      setEditedQuestion({
        ...question,
        timePerQuestion: Number(question.timePerQuestion || 30),
        scorePerQuestion: Number(question.scorePerQuestion || 1),
        // Make sure we have at least 4 answers (add empty ones if needed)
        answers: [
          ...question.answers,
          ...Array(Math.max(0, 4 - question.answers.length)).fill({
            text: "",
            isCorrect: false,
          }),
        ].slice(0, 4), // Limit to 4 answers
        options:
          question.answers.map((answer: { text: string }) => answer.text) || [], // Initialize options from answers
      });
    }
  }, [question, isOpen]);

  // Handle question text change
  const handleQuestionTextChange = (e: any) => {
    setEditedQuestion({
      ...editedQuestion,
      questionText: e.target.value,
    });
  };

  // Handle question properties change
  const handleQuestionPropertyChange = (e: any) => {
    const { name, value } = e.target;
    setEditedQuestion({
      ...editedQuestion,
      [name]:
        name === "timePerQuestion" || name === "scorePerQuestion"
          ? Number(value)
          : value,
    });
  };

  // Handle answer text change
  const handleAnswerTextChange = ({ index, e }: any) => {
    const newAnswers = [...editedQuestion.answers];
    newAnswers[index] = {
      ...newAnswers[index],
      text: e.target.value,
    };

    setEditedQuestion({
      ...editedQuestion,
      answers: newAnswers,
    });
  };

  // Handle answer correctness change
  const handleAnswerCorrectChange = ({ index, e }: any) => {
    const newAnswers = [...editedQuestion.answers];

    // If this is a single-choice question, uncheck all other answers
    if (editedQuestion.questionType === "single-choice") {
      newAnswers.forEach((answer, i) => {
        newAnswers[i] = {
          ...answer,
          isCorrect: i === index ? e.target.checked : false,
        };
      });
    } else {
      // For multiple-choice, just toggle the current answer
      newAnswers[index] = {
        ...newAnswers[index],
        isCorrect: e.target.checked,
      };
    }

    setEditedQuestion({
      ...editedQuestion,
      answers: newAnswers,
    });
  };

  // Handle question type change
  const handleQuestionTypeChange = (e: any) => {
    const newType = e.target.value;
    let newAnswers = [...editedQuestion.answers];

    // If changing to single-choice, ensure only one answer is marked correct
    if (newType === "single-choice") {
      const correctAnswerIndex = newAnswers.findIndex(
        (answer) => answer.isCorrect
      );
      newAnswers = newAnswers.map((answer, index) => ({
        ...answer,
        isCorrect: index === Math.max(0, correctAnswerIndex), // Make first correct answer (or first answer) the only correct one
      }));
    }

    setEditedQuestion({
      ...editedQuestion,
      questionType: newType,
      answers: newAnswers,
    });
  };

  // Handle save button click
  const handleSave = () => {
    // Validate the question
    if (!editedQuestion.questionText.trim()) {
      alert("Vui lòng nhập nội dung câu hỏi");
      return;
    }

    // Validate that we have at least 2 answers with text
    const validAnswers = editedQuestion.answers.filter((answer) =>
      answer.text.trim()
    );
    if (validAnswers.length < 2) {
      alert("Vui lòng nhập ít nhất 2 đáp án");
      return;
    }

    // Validate that at least one answer is marked as correct
    if (!editedQuestion.answers.some((answer) => answer.isCorrect)) {
      alert("Vui lòng chọn ít nhất một đáp án đúng");
      return;
    }

    // Filter out empty answers and prepare final question data
    const finalAnswers = editedQuestion.answers.filter((answer) =>
      answer.text.trim()
    );
    const finalQuestion = {
      ...editedQuestion,
      answers: finalAnswers,
      options: finalAnswers.map((answer) => answer.text), // Update options field
      timePerQuestion: Number(editedQuestion.timePerQuestion),
      scorePerQuestion: Number(editedQuestion.scorePerQuestion),
    };

    // Call the onSave callback with the edited question
    onSave(finalQuestion);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[1000]"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg shadow-md w-[90%] max-w-[800px] max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <p className="text-xl text-gray-900">Chỉnh sửa câu hỏi</p>
          <button
            onClick={onClose}
            className="text-gray-500 p-1 rounded hover:bg-gray-100 hover:text-gray-700"
          >
            <HugeiconsIcon icon={Cancel01Icon} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto">
          {/* Question Properties */}
          <div className="mb-5">
            <div className="flex flex-wrap gap-4 mb-4">
              {/* Question Type */}
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại câu hỏi
                </label>
                <select
                  name="questionType"
                  value={editedQuestion.questionType}
                  onChange={handleQuestionTypeChange}
                  className="w-full px-3 py-2 text-sm border outline-none border-gray-300 rounded-md "
                >
                  <option value="multiple-choice">Nhiều đáp án đúng</option>
                  <option value="single-choice">Một đáp án đúng</option>
                </select>
              </div>

              {/* Time */}
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thời gian
                </label>
                <select
                  name="timePerQuestion"
                  value={editedQuestion.timePerQuestion}
                  onChange={handleQuestionPropertyChange}
                  className="w-full px-3 py-2 text-sm border outline-none border-gray-300 rounded-md "
                >
                  {TIME_OPTIONS.map((time: any) => (
                    <option key={time} value={time}>
                      {time} giây
                    </option>
                  ))}
                </select>
              </div>

              {/* Score */}
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Điểm
                </label>
                <select
                  name="scorePerQuestion"
                  value={editedQuestion.scorePerQuestion}
                  onChange={handleQuestionPropertyChange}
                  className="w-full px-3 py-2 text-sm border outline-none border-gray-300 rounded-md "
                >
                  {SCORE_OPTIONS.map((score: any) => (
                    <option key={score} value={score}>
                      {score} điểm
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Độ khó
                </label>
                <select
                  name="difficulty"
                  value={editedQuestion.difficulty}
                  onChange={handleQuestionPropertyChange}
                  className="w-full px-3 py-2 text-sm border outline-none border-gray-300 rounded-md "
                >
                  {DIFFICULTY_OPTIONS.map((option: any) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Question Text */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nội dung câu hỏi
            </label>
            <textarea
              value={editedQuestion.questionText}
              onChange={handleQuestionTextChange}
              className="w-full px-3 py-2 text-sm border outline-none border-gray-300 rounded-md "
              placeholder="Nhập nội dung câu hỏi"
              rows={3}
            />
          </div>

          {/* Answers */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Đáp án
            </label>
            <p className="text-xs text-gray-500 mb-3">
              {editedQuestion.questionType === "single-choice"
                ? "Chọn một đáp án đúng"
                : "Chọn một hoặc nhiều đáp án đúng"}
            </p>

            {editedQuestion.answers.map((answer, index) => (
              <div key={index} className="flex items-center mb-3">
                {/* Checkbox */}
                <div className="mr-3 flex items-center">
                  <input
                    type="checkbox"
                    checked={answer.isCorrect}
                    onChange={(e) => handleAnswerCorrectChange({ index, e })}
                    id={`answer-${index}`}
                    className="hidden"
                  />
                  <label
                    htmlFor={`answer-${index}`}
                    className={`flex items-center justify-center w-6 h-6 border border-gray-300 rounded cursor-pointer ${
                      answer.isCorrect
                        ? "bg-green-500 border-green-500 text-white"
                        : "text-dim"
                    }`}
                  >
                    {answer.isCorrect ? (
                      <HugeiconsIcon icon={Tick01Icon} />
                    ) : (
                      <HugeiconsIcon icon={Cancel01Icon} />
                    )}
                  </label>
                </div>

                {/* Answer Input */}
                <div className="flex-1">
                  <input
                    type="text"
                    value={answer.text}
                    onChange={(e) => handleAnswerTextChange({ index, e })}
                    placeholder={`Đáp án ${index + 1}`}
                    className="w-full px-3 py-2 text-sm border outline-none border-gray-300 rounded-md "
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end p-4 gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-darkblue bg-background border btn-hover outline-none border-gray-300 rounded-md hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-background btn-hover bg-darkblue rounded-md"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
};
