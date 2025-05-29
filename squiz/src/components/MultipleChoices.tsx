import { useState } from "react";
import { useForm } from "react-hook-form";
import { HugeiconsIcon } from "@hugeicons/react";
import axios, { AxiosError } from "axios";
import {
  Cancel01Icon,
  Download03Icon,
  CalculatorIcon,
  Delete01Icon,
  CursorMagicSelection03Icon,
} from "@hugeicons/core-free-icons";
import "./../style/dashboard.css";
import { useAuth } from "@clerk/clerk-react";

const virtualData = {
  name: "React Hook Form provides an errors object to show you the errors in the form. errors' type will return given validation constraints. The following example showcases a required validation rule.",
  answers: [
    {
      text: "Handle errors",
      isCorrect: true,
    },
    {
      text: "React Hook Form",
      isCorrect: false,
    },
    {
      text: "validation ",
      isCorrect: false,
    },
    {
      text: "return ",
      isCorrect: false,
    },
  ],
};

interface MultipleChoicesProps {
  quizId: string;
  closeFormQuestion: () => void;
  getDataForm: (data: any) => void;
  onQuestionCreated?: (newQuestion: any) => void;
}

export default function MultipleChoices({
  quizId,
  closeFormQuestion,
  getDataForm,
  onQuestionCreated,
}: MultipleChoicesProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const { getToken } = useAuth();
  const [questionOptions, setQuestionOptions] = useState({
    questionType: "multipleChoices",
    questionText: "",
    timePerQuestion: 15,
    scorePerQuestion: 1,
    difficulty: "easy",
  });
  const [answers, setAnswers] = useState([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);

  const createVirtualData = () => {
    setQuestionOptions({
      ...questionOptions,
      questionText: virtualData.name,
    });

    setAnswers(virtualData.answers.map((a) => ({ ...a })));
  };

  const handleChange = (index: number, value: any) => {
    const newAnswers = [...answers];
    newAnswers[index].text = value;
    setAnswers(newAnswers);
  };

  const handleCheck = (index: number) => {
    const newAnswers = [...answers];
    newAnswers[index].isCorrect = !newAnswers[index].isCorrect;
    setAnswers(newAnswers);
  };

  const handleDelete = (index: number) => {
    const newAnswers = [...answers];
    newAnswers.splice(index, 1);
    setAnswers(newAnswers);
  };

  const handleQuestionOptions = (e: any) => {
    const { name, value } = e.target;
    setQuestionOptions({
      ...questionOptions,
      [name]:
        name === "timePerQuestion" || name === "scorePerQuestion"
          ? Number(value)
          : value,
    });
  };

  const filledAnswers = answers.filter((a) => a.text.trim() !== "");
  const hasCorrect = answers.some((a) => a.isCorrect);

  const saveQuestion = () => {
    if (!hasCorrect || filledAnswers.length < 4) {
      return;
    }

    const questionData = {
      questionType: questionOptions.questionType,
      questionText: questionOptions.questionText,
      timePerQuestion: Number(questionOptions.timePerQuestion),
      scorePerQuestion: Number(questionOptions.scorePerQuestion),
      difficulty: questionOptions.difficulty,
      answers,
    };
    switch (questionOptions.questionType) {
      case "multipleChoices":
        questionData.questionType = "Nhiều lựa chọn";
        break;
      case "fillInBlank":
        questionData.questionType = "Điền vào chỗ trống";
        break;
      case "paragraph":
        questionData.questionType = "Đoạn văn";
        break;
      case "dragAndDrop":
        questionData.questionType = "Kéo và thả";
        break;
      case "dropdown":
        questionData.questionType = "Thả xuống";
        break;
    }
    getDataForm(questionData);
  };

  const closeForm = () => {
    closeFormQuestion();
  };

  const handleSubmitQuestion = async () => {
    try {
      const token = await getToken();

      if (!questionOptions.questionText.trim()) {
        alert("Please enter a question");
        return;
      }

      if (!hasCorrect || filledAnswers.length < 4) {
        alert(
          "Please fill in all answers and select at least one correct answer"
        );
        return;
      }

      const API_BASE_URL = "http://localhost:5000/api";

      const questionData = {
        quizId: quizId,
        questionText: questionOptions.questionText,
        questionType: "multipleChoices",
        difficulty: questionOptions.difficulty,
        timePerQuestion: Number(questionOptions.timePerQuestion),
        scorePerQuestion: Number(questionOptions.scorePerQuestion),
        options: answers.map((answer) => answer.text.trim()),
        answers: answers.map((answer) => ({
          text: answer.text.trim(),
          isCorrect: answer.isCorrect,
        })),
      };

      const response = await axios.post(
        `${API_BASE_URL}/question`,
        questionData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Format the new question data
        const newQuestion = {
          ...response.data.question,
          questionId: response.data.question._id,
          _id: response.data.question._id,
          timePerQuestion: Number(questionOptions.timePerQuestion),
          scorePerQuestion: Number(questionOptions.scorePerQuestion),
          options: answers.map((answer) => answer.text.trim()),
        };

        // Call saveQuestion to update local state
        saveQuestion();

        // Notify parent component about the new question
        if (onQuestionCreated) {
          onQuestionCreated(newQuestion);
        }

        // Close the form
        closeForm();
      } else {
        throw new Error(response.data.message || "Failed to save question");
      }
    } catch (error) {
      console.error("Error saving question:", error);
      if (error instanceof AxiosError) {
        alert(error.response?.data?.message || "Failed to save question");
      } else {
        alert("An error occurred while saving the question");
      }
    }
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-orange to-red-wine p-6 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <HugeiconsIcon
                icon={CursorMagicSelection03Icon}
                className="w-6 h-6"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                Create Multiple Choice Question
              </h2>
              <p className="text-blue-100 text-sm">
                Configure your question settings and options
              </p>
            </div>
          </div>
          <button
            onClick={closeForm}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Question Settings */}
      <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
        <div className="grid grid-cols-4 gap-4">
          <select
            name="questionType"
            id="questionType"
            value={questionOptions.questionType}
            onChange={handleQuestionOptions}
            className="bg-white border outline-none text-sm rounded-xl block w-full p-3 font-medium focus:ring-2 focus:ring-orange/30 transition-all duration-200 border-gray-300"
          >
            <option value="multipleChoices">Multiple Choice</option>
            <option value="fillInBlank">Fill in Blank</option>
            <option value="paragraph">Paragraph</option>
            <option value="dragAndDrop">Drag & Drop</option>
            <option value="dropDown">Dropdown</option>
          </select>

          <select
            name="timePerQuestion"
            id="time"
            value={questionOptions.timePerQuestion}
            onChange={handleQuestionOptions}
            className="bg-white border outline-none text-sm rounded-xl block w-full p-3 font-medium focus:ring-2 focus:ring-orange/30 transition-all duration-200 border-gray-300"
          >
            <option value={15}>15 seconds</option>
            <option value={30}>30 seconds</option>
            <option value={45}>45 seconds</option>
            <option value={60}>1 minute</option>
            <option value={90}>1.5 minutes</option>
          </select>

          <select
            name="scorePerQuestion"
            id="score"
            value={questionOptions.scorePerQuestion}
            onChange={handleQuestionOptions}
            className="bg-white border outline-none text-sm rounded-xl block w-full p-3 font-medium focus:ring-2 focus:ring-orange/30 transition-all duration-200 border-gray-300"
          >
            <option value={1}>1 point</option>
            <option value={2}>2 points</option>
            <option value={3}>3 points</option>
            <option value={4}>4 points</option>
            <option value={5}>5 points</option>
          </select>

          <select
            name="difficulty"
            id="difficulty"
            value={questionOptions.difficulty}
            onChange={handleQuestionOptions}
            className="bg-white border outline-none text-sm rounded-xl block w-full p-3 font-medium focus:ring-2 focus:ring-orange/30 transition-all duration-200 border-gray-300"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex items-center gap-2">
          <HugeiconsIcon icon={CalculatorIcon} size={20} />
          <span className="text-sm font-medium">Insert Math Symbol</span>
        </button>

        {/* Question Content */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <textarea
            className={`w-full text-lg outline-none border bg-white rounded-xl p-4 min-h-[120px] transition-colors duration-200 resize-none mb-6 ${
              errors.questionText
                ? "border-red-500"
                : "border-gray-300 focus:border-orange"
            }`}
            {...register("questionText", {
              required: "Question cannot be empty",
            })}
            value={questionOptions.questionText}
            onChange={handleQuestionOptions}
            placeholder={
              errors.questionText
                ? "Please enter your question"
                : "Enter your question here"
            }
          />

          <div className="grid grid-cols-2 gap-4">
            {answers.map((answer, index) => (
              <div
                key={index}
                className="bg-white p-4 rounded-xl border border-gray-200 hover:border-orange/50 transition-all duration-200"
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-700 rounded-full text-sm font-bold">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <div className="checkbox-wrapper-26">
                      <input
                        type="checkbox"
                        id={`_checkbox-${index}`}
                        checked={answer.isCorrect}
                        onChange={() => handleCheck(index)}
                      />
                      <label htmlFor={`_checkbox-${index}`}>
                        <div className="tick_mark"></div>
                      </label>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    aria-label="Delete answer"
                  >
                    <HugeiconsIcon icon={Delete01Icon} size={20} />
                  </button>
                </div>

                <textarea
                  className="w-full text-base bg-transparent outline-none p-3 border border-gray-200 rounded-lg focus:border-orange transition-colors duration-200 resize-none"
                  value={answer.text}
                  onChange={(e) => handleChange(index, e.target.value)}
                  rows={3}
                  placeholder={`Enter answer option ${String.fromCharCode(
                    65 + index
                  )}`}
                  aria-label={`Answer option ${index + 1}`}
                />
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            {filledAnswers.length < 4 && (
              <p className="text-sm text-red-500 font-medium flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation"></i>
                Please fill in all answer options
              </p>
            )}
            {!hasCorrect && (
              <p className="text-sm text-red-500 font-medium flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation"></i>
                Please select the correct answer
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <button
            onClick={() => createVirtualData()}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <HugeiconsIcon icon={Download03Icon} size={20} />
            <span className="font-medium">Load Sample Data</span>
          </button>

          <div className="flex gap-3">
            <button
              onClick={closeForm}
              className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-xl transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitQuestion}
              disabled={!hasCorrect || filledAnswers.length < 4}
              className="px-6 py-3 bg-gradient-to-r from-orange to-red-wine text-white rounded-xl hover:from-orange-700 hover:to-red-wine-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center gap-2"
            >
              <HugeiconsIcon icon={Download03Icon} size={20} />
              <span>Save Question</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
