import { useNavigate } from "react-router";
import Quizbar from "../components/Quizbar";
import React, { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import MultipleChoices from "../components/MultipleChoices";
import { useForm } from "react-hook-form";
import { Question } from "../types/Question";
import { EditQuestionModal } from "../components/EditQuestionModal";
import "../style/spinloader.css";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Backward01Icon,
  ImageUploadIcon,
  CursorMagicSelection03Icon,
  Drag04Icon,
  ArtboardToolIcon,
  ArrowDown01Icon,
  TextAlignJustifyCenterIcon,
  NoteEditIcon,
  Copy01Icon,
  Delete01Icon,
  Tick01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import imageCompression from "browser-image-compression";
import SelectQuizModal from "../components/SelectQuizModal";
const QUESTION_TYPES = {
  MULTIPLE_CHOICE: "multipleChoices",
  FILL_IN_BLANK: "fillInBlank",
  PARAGRAPH: "paragraph",
  DRAG_AND_DROP: "dragAndDrop",
  DROPDOWN: "dropdown",
};

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Dễ" },
  { value: "medium", label: "Trung bình" },
  { value: "hard", label: "Khó" },
];

const TIME_OPTIONS = [15, 30, 45, 60, 90];
const SCORE_OPTIONS = [1, 2, 3, 4, 5];
const API_BASE_URL = "http://localhost:5000/api";

export default function CreateQuiz() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const handleClickModal: React.MouseEventHandler<HTMLDivElement> = () => {
    setIsModal((preVal) => !preVal);
  };

  const [isSelectQuizModalOpen, setIsSelectQuizModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [isModal, setIsModal] = useState(false);
  const [activeNewQuestion, SetActiveNewQuestion] = useState(true);
  const [quizId, setQuizId] = useState();
  const [isModalOpen, setIsModalOpen] = useState(false); //Modal Update Question
  const [isFormQuestion, setIsFormQuestion] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExam, setIsExam] = useState(false);
  const [quizData, setQuizData] = useState({
    creator: "",
    name: "",
    topic: "",
    difficulty: "",
    isPublic: true,
    isExam: false,
    questions: [{}],
    imageUrl: null,
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [imageData, setImageData] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [quizOptions, setQuizOptions] = useState({
    timePerQuestion: 30,
    scorePerQuestion: 1,
  });

  const [questionsIsVoid, setQuestionsIsVoid] = useState(false);
  const [selectedQuestionBanks, setSelectedQuestionBanks] = useState<
    Array<{
      examSetId: string;
      name: string;
      sections: Array<{
        difficulty: string;
        numberOfQuestions: number;
      }>;
    }>
  >([]);

  const selectedBankIds = selectedQuestionBanks.map((bank) => bank.examSetId);

  useEffect(() => {
    setQuestionsIsVoid(
      questions.length < 1 && selectedQuestionBanks.length < 1
    );
    setIsExam(selectedQuestionBanks.length > 0);
  }, [questions, selectedQuestionBanks]);

  useEffect(() => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((question) => ({
        ...question,
        timePerQuestion: quizOptions.timePerQuestion,
        scorePerQuestion: quizOptions.scorePerQuestion,
      }))
    );
  }, [quizOptions]);

  const handleEditClick = (question: Question) => {
    setCurrentQuestion(question);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentQuestion(null);
  };

  const handleGetDataForm = (data: any) => {
    const questionTypeMapping: Record<string, string> = {
      "Nhiều lựa chọn": QUESTION_TYPES.MULTIPLE_CHOICE,
      "Điền vào chỗ trống": QUESTION_TYPES.FILL_IN_BLANK,
      "Đoạn văn": QUESTION_TYPES.PARAGRAPH,
      "Kéo và thả": QUESTION_TYPES.DRAG_AND_DROP,
      "Thả xuống": QUESTION_TYPES.DROPDOWN,
    };

    const newQuestion = {
      questionId: Date.now(),
      quizId: quizId,
      questionType: questionTypeMapping[data.questionType] || data.questionType,
      questionText: data.questionText,
      timePerQuestion:
        Number(data.timePerQuestion) || quizOptions.timePerQuestion,
      scorePerQuestion:
        Number(data.scorePerQuestion) || quizOptions.scorePerQuestion,
      difficulty: data.difficulty,
      answers: data.answers,
    };
    setQuestions((prevVal) => [...prevVal, newQuestion]);
  };
  useEffect(() => {
    if (isModalOpen || isModal || isFormQuestion) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen, isModal, isFormQuestion]);
  // UPDATE CAU HOI
  const handleQuestionUpdate = (
    e: React.ChangeEvent<HTMLSelectElement>,
    questionId: number | string
  ) => {
    const { name, value } = e.target;

    setQuestions((prevQuestions: Question[]) =>
      prevQuestions.map((question) =>
        question.questionId === questionId
          ? {
              ...question,
              [name]: value,
            }
          : question
      )
    );
  };

  // SAO CHEP CAU HOI
  const duplicateQuestion = (question: Question) => {
    const duplicatedQuestion = {
      ...question,
      questionId: Date.now(),
    };

    setQuestions((prevQuestions: Question[]) => [
      ...prevQuestions,
      duplicatedQuestion,
    ]);
  };

  // XOA CAU HOI
  const deleteQuestion = (questionId: number | string) => {
    setQuestions((prevQuestions: Question[]) =>
      prevQuestions.filter((q) => q.questionId !== questionId)
    );
  };

  // Khi thong tin quiz thay doi
  const handleQuizDataChange = (e: any) => {
    const { name, value } = e.target;
    setQuizData({
      ...quizData,
      [name]: value,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setIsUploading(true);

      try {
        // Kiểm tra kích thước file
        if (file.size > 3 * 1024 * 1024) {
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true, // Tăng hiệu suất
          };

          const compressedFile = await imageCompression(file, options);
          console.log("Original file size:", file.size / 1024 / 1024, "MB");
          console.log(
            "Compressed file size:",
            compressedFile.size / 1024 / 1024,
            "MB"
          );
          setImageData(compressedFile);
        } else {
          // Nếu file nhỏ hơn 2MB, sử dụng trực tiếp
          setImageData(file);
        }
      } catch (error) {
        console.error("Error compressing image:", error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const showFormQuestion = () => {
    setIsFormQuestion((prevVal: boolean) => !prevVal);
    setIsModal((prevVal: boolean) => !prevVal);
  };

  const totalScoreOfQuiz = () => {
    let totalScore = 0;
    questions.map((question) => {
      console.log(question.scorePerQuestion);
      totalScore += Number(question.scorePerQuestion);
    });
    return totalScore;
  };

  // Save
  const handleSaveQuiz = async () => {
    if (questions.length < 1 && selectedQuestionBanks.length < 1) {
      setQuestionsIsVoid(true);
      return;
    }
    try {
      setIsSaving(true);
      const token = await getToken();

      // Prepare question bank queries
      const questionBankQueries = selectedQuestionBanks.flatMap((bank) => {
        return bank.sections.map((section) => ({
          examSetId: bank.examSetId,
          difficulty: section.difficulty, // Giữ nguyên string
          limit: section.numberOfQuestions,
        }));
      });

      const formData = new FormData();
      formData.append("creator", user?.id || "");
      formData.append(
        "creatorInfo",
        JSON.stringify({
          name: user?.fullName,
          avatar: user?.imageUrl,
        })
      );
      formData.append("name", quizData.name);
      formData.append("topic", quizData.topic);
      formData.append("difficulty", quizData.difficulty);
      formData.append("isPublic", String(quizData.isPublic));
      formData.append("imageUrl", imageData || "");
      formData.append("isExam", String(isExam));
      formData.append("timePerQuestion", String(quizOptions.timePerQuestion));
      formData.append("scorePerQuestion", String(quizOptions.scorePerQuestion));

      // Thêm questionBankQueries vào formData nếu có
      if (selectedQuestionBanks.length > 0) {
        formData.append(
          "questionBankQueries",
          JSON.stringify(questionBankQueries)
        );
      }

      console.log("Sending quiz data:", {
        ...Object.fromEntries(formData.entries()),
        questionBankQueries: questionBankQueries,
      });

      const response = await fetch(`${API_BASE_URL}/quiz`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const quizResult = await response.json();
      if (!quizResult.success) {
        throw new Error(quizResult.message || "Cannot create new Quiz");
      }

      if (questions.length > 0) {
        const updatedQuestions = questions.map((question) => ({
          ...question,
          quizId: quizResult._id,
        }));
        const saveResult = await handleSaveQuestion(updatedQuestions);

        if (!saveResult.success) {
          throw new Error(saveResult.message || "Failed to save questions");
        }
      }

      // Add a small delay before navigation
      setTimeout(() => {
        navigate("/dashboard/my-quiz/created-by-me", { replace: true });
      }, 500);
    } catch (error) {
      console.error("Error saving quiz:", error);
      alert("Failed to save quiz. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };
  const handleSaveQuizz = async () => {
    try {
      setIsSaving(true);
      const token = await getToken();

      const formData = new FormData();
      formData.append("creator", user?.id || "");
      formData.append(
        "creatorInfo",
        JSON.stringify({
          name: user?.fullName,
          avatar: user?.imageUrl,
        })
      );
      formData.append("name", quizData.name);
      formData.append("topic", quizData.topic);
      formData.append("difficulty", quizData.difficulty);
      formData.append("isPublic", String(quizData.isPublic));
      formData.append("imageUrl", imageData || "");
      formData.append("isExam", String(isExam));
      formData.append("timePerQuestion", String(quizOptions.timePerQuestion));
      formData.append("scorePerQuestion", String(quizOptions.scorePerQuestion));

      const response = await fetch(`${API_BASE_URL}/quiz`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const quizResult = await response.json();
      if (quizResult.success) {
        console.log("zzzzzzzzzzzzzzzzz", quizResult.quiz._id);

        SetActiveNewQuestion(false);
        setQuizId(quizResult.quiz._id);
      } else {
        throw new Error(quizResult.message || "Cannot create new Quiz");
      }
    } catch (error) {
      console.error("Error saving quiz:", error);
      alert("Failed to save quiz. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateQuestion = (updatedQuestion: Question) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.questionId === updatedQuestion.questionId ? updatedQuestion : q
      )
    );
  };

  const handleSaveQuestion = async (
    questionsToSave: Question[] = questions
  ) => {
    console.log(questionsToSave);
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/question`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          questions: questionsToSave.map((question) => ({
            quizId: question.quizId,
            questionText: question.questionText,
            questionType: question.questionType,
            difficulty: question.difficulty,
            timePerQuestion: question.timePerQuestion,
            scorePerQuestion: question.scorePerQuestion,
            answers: question.answers.map((answer) => ({
              text: answer.text,
              isCorrect: answer.isCorrect,
            })),
          })),
        }),
      });

      const result = await response.json();
      if (result.success) {
        // Cập nhật state với câu hỏi từ server (có _id thực)
        setQuestions(result.questions);
        return result;
      } else {
        throw new Error(result.message || "Failed to save questions");
      }
    } catch (error) {
      console.error("Error saving questions:", error);
      return { success: false, error };
    }
  };

  const handleAddQuestionsFromBank = (
    questionBankQueries: Array<{
      examSetId: string;
      difficulty: string;
      limit: number;
    }>,
    examName: string
  ) => {
    // Chuyển đổi difficulty từ ký tự viết tắt sang dạng đầy đủ
    const difficultyMap: Record<string, string> = {
      e: "easy",
      m: "medium",
      h: "hard",
    };

    const sections = questionBankQueries.map((query) => ({
      difficulty: difficultyMap[query.difficulty] || query.difficulty,
      numberOfQuestions: query.limit,
    }));

    setSelectedQuestionBanks((prev) => [
      ...prev,
      {
        examSetId: questionBankQueries[0].examSetId,
        name: examName,
        sections,
      },
    ]);
  };

  // Add function to remove question bank
  const removeQuestionBank = (examSetId: string) => {
    setSelectedQuestionBanks((prev) =>
      prev.filter((bank) => bank.examSetId !== examSetId)
    );
  };

  return (
    <div className="container mx-auto px-10">
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <nav className="h-16 fixed left-0 right-0 border-b bg-white/80 backdrop-blur-sm z-10 py-2 px-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-5">
            <div
              onClick={() => navigate(-1)}
              className="cursor-pointer flex items-center justify-center rounded-full w-10 h-10 hover:bg-gray-100 transition-colors duration-200"
            >
              <HugeiconsIcon icon={Backward01Icon} />
            </div>
            <div className="h-10 px-3 hover:bg-nude-light rounded-lg cursor-pointer flex items-center transition-colors duration-200">
              <input
                type="text"
                placeholder="Enter Quiz name"
                value={quizData.name}
                onChange={(e) =>
                  setQuizData({ ...quizData, name: e.target.value })
                }
                className="font-semibold bg-transparent outline-none w-64"
              />
            </div>
          </div>
          <button
            onClick={
              activeNewQuestion ? handleSubmit(handleSaveQuiz) : undefined
            }
            className="flex items-center gap-2"
          >
            <div className="p-3 flex items-center cursor-pointer bg-orange hover:bg-orange/90 transition-colors duration-200 rounded-lg font-semibold text-lg">
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <span className="loader"></span>
                  <p className="pl-1">Creating Quiz...</p>
                </div>
              ) : (
                <>
                  <i className="fa-solid fa-floppy-disk mr-2"></i>
                  <p>Save Quiz</p>
                </>
              )}
            </div>
          </button>
        </nav>
        <main className="pt-28 grid grid-cols-8 gap-8">
          <Quizbar quizOptions={quizOptions} setQuizOptions={setQuizOptions} />

          <div className="col-span-5">
            <div className="w-full px-8 py-6 bg-white rounded-xl col-span-5 shadow-md hover:shadow-lg transition-shadow duration-200">
              <p className="text-xl font-semibold mb-6">Quiz Information</p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <input
                  {...register("name", {
                    required: "Quiz name cannot be empty",
                  })}
                  type="text"
                  value={quizData.name}
                  onChange={handleQuizDataChange}
                  placeholder="Enter Quiz name"
                  className={`border p-3 text-sm font-medium rounded-lg outline-none focus:ring-2 focus:ring-orange/30 transition-all duration-200
                  ${errors.name ? "border-red-500" : "border-gray-300"}`}
                  disabled={!activeNewQuestion}
                />
                <select
                  {...register("topic", {
                    required: "Topic cannot be empty",
                  })}
                  id="Topic"
                  value={quizData.topic}
                  onChange={handleQuizDataChange}
                  className={`bg-white border outline-none text-sm rounded-lg block w-full p-3 font-medium focus:ring-2 focus:ring-orange/30 transition-all duration-200
                    ${errors.topic ? "border-red-500" : "border-gray-300"}`}
                  disabled={!activeNewQuestion}
                >
                  <option value="">Select Topic</option>
                  <option value="math">Mathematics</option>
                  <option value="english">English</option>
                  <option value="physics">Physics</option>
                  <option value="history">History</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <select
                  {...register("difficulty", {
                    required: "Difficulty cannot be empty",
                  })}
                  id="Difficulty"
                  value={quizData.difficulty}
                  onChange={handleQuizDataChange}
                  className={`bg-white border outline-none text-sm rounded-lg block w-full p-3 font-medium focus:ring-2 focus:ring-orange/30 transition-all duration-200
                    ${
                      errors.difficulty ? "border-red-500" : "border-gray-300"
                    }`}
                  disabled={!activeNewQuestion}
                >
                  <option value="">Select Difficulty</option>
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  name="isPublic"
                  id="Display"
                  value={quizData.isPublic.toString()}
                  onChange={handleQuizDataChange}
                  className="bg-white border outline-none text-sm rounded-lg block w-full p-3 font-medium focus:ring-2 focus:ring-orange/30 transition-all duration-200 border-gray-300"
                  disabled={!activeNewQuestion}
                >
                  <option value="true">Public</option>
                  <option value="false">Private</option>
                </select>
              </div>
              <div className="relative">
                <input
                  accept="image/*"
                  {...register("imageUrl", {
                    required: "Image is required",
                  })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  type="file"
                  onChange={handleImageUpload}
                  id="image-upload"
                  disabled={!activeNewQuestion}
                />

                <label
                  htmlFor="image-upload"
                  className={`cursor-pointer flex items-center gap-2 mb-4 p-3 border border-dashed border-gray-300 rounded-lg hover:border-orange/50 transition-colors duration-200 ${
                    isUploading ? "opacity-50" : ""
                  }`}
                >
                  <HugeiconsIcon
                    size={24}
                    icon={ImageUploadIcon}
                    className="text-gray-500"
                  />
                  <p className="text-sm font-medium text-gray-700">
                    {isUploading
                      ? "Uploading image..."
                      : "Upload Quiz background image"}
                  </p>
                </label>
              </div>
              {errors.imageUrl && (
                <p className="mt-2 text-red-500 text-sm">
                  Please select a background image for the quiz
                </p>
              )}
              {isUploading && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="loader"></span>
                  <p className="text-sm text-gray-600">Processing image...</p>
                </div>
              )}
              {imageData && !isUploading && (
                <div className="mt-4">
                  <img
                    src={URL.createObjectURL(imageData)}
                    alt="Preview"
                    className="rounded-lg w-full max-h-48 object-cover"
                  />
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between mt-8 mb-6">
                <p className="text-xl font-semibold">
                  {questions.length} Questions ({totalScoreOfQuiz()} points)
                </p>
                <div className="flex gap-3">
                  {activeNewQuestion && (
                    <button
                      onClick={() => setIsSelectQuizModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 border border-darkblue text-darkblue rounded-lg hover:bg-darkblue hover:text-white transition-colors duration-200"
                    >
                      <i className="fa-solid fa-plus"></i>
                      <span className="font-medium">
                        Thêm câu hỏi từ ngân hàng đề
                      </span>
                    </button>
                  )}
                  {selectedQuestionBanks.length <= 0 && (
                    <button
                      onClick={activeNewQuestion ? handleSaveQuizz : undefined}
                      className="flex items-center gap-2 px-4 py-2 bg-darkblue text-white rounded-lg hover:bg-darkblue/90 transition-colors duration-200"
                    >
                      <i className="fa-solid fa-plus"></i>
                      <span className="font-medium">Tạo thủ công</span>
                    </button>
                  )}
                </div>
              </div>
              {questionsIsVoid && selectedQuestionBanks.length === 0 && (
                <div className="flex justify-center p-4 my-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-500 text-sm font-medium">
                    Please add at least one question or select from question
                    bank
                  </p>
                </div>
              )}

              {selectedQuestionBanks.length > 0 && (
                <div className="mt-8 space-y-4">
                  <p className="text-xl font-semibold mb-4">
                    Selected Question Banks
                  </p>
                  {selectedQuestionBanks.map((bank) => (
                    <div
                      key={bank.examSetId}
                      className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-lg">{bank.name}</h3>
                        <button
                          onClick={() => removeQuestionBank(bank.examSetId)}
                          className="text-red-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors duration-200"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-4">
                        {bank.sections.map((section, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 p-3 rounded-lg"
                          >
                            <span className="text-sm font-medium text-gray-700">
                              {section.difficulty === "easy"
                                ? "Easy"
                                : section.difficulty === "medium"
                                ? "Medium"
                                : "Hard"}
                            </span>
                            <p className="text-2xl font-semibold mt-1">
                              {section.numberOfQuestions}
                              <span className="text-sm font-normal text-gray-500 ml-1">
                                questions
                              </span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                {questions.map((question) => (
                  <div
                    key={`questionid-${question.questionId}`}
                    className="w-full px-8 py-6 mt-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex justify-between">
                      <div className="flex gap-3">
                        <div className="border cursor-grab p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                          <HugeiconsIcon icon={Drag04Icon} size={20} />
                        </div>
                        <div className="border p-2 rounded-lg flex items-center gap-2 bg-orange/5 border-orange/20">
                          <i className="fa-regular fa-circle-check text-orange"></i>
                          <p className="text-sm font-medium text-orange">
                            {question.questionType}
                          </p>
                        </div>
                        <select
                          name="timePerQuestion"
                          id={`time-${question.questionId}`}
                          value={question.timePerQuestion}
                          onChange={(e) =>
                            handleQuestionUpdate(e, question.questionId)
                          }
                          className="bg-white border outline-none text-sm rounded-lg block p-2 font-medium focus:ring-2 focus:ring-orange/30 transition-all duration-200 border-gray-300"
                        >
                          {TIME_OPTIONS.map((time) => (
                            <option
                              key={`time-${time}-${question.questionId}`}
                              value={time}
                            >
                              {time}s
                            </option>
                          ))}
                        </select>
                        <select
                          name="scorePerQuestion"
                          id={`score-${question.questionId}`}
                          value={question.scorePerQuestion}
                          onChange={(e) =>
                            handleQuestionUpdate(e, question.questionId)
                          }
                          className="bg-white border outline-none text-sm rounded-lg block p-2 font-medium focus:ring-2 focus:ring-orange/30 transition-all duration-200 border-gray-300"
                        >
                          {SCORE_OPTIONS.map((score) => (
                            <option
                              key={`score-${score}-${question.questionId}`}
                              value={score}
                            >
                              {score} points
                            </option>
                          ))}
                        </select>
                        <select
                          name="difficulty"
                          id={`difficulty-${question.questionId}`}
                          value={question.difficulty}
                          onChange={(e) =>
                            handleQuestionUpdate(e, question.questionId)
                          }
                          className="bg-white border outline-none text-sm rounded-lg block p-2 font-medium focus:ring-2 focus:ring-orange/30 transition-all duration-200 border-gray-300"
                        >
                          {DIFFICULTY_OPTIONS.map((option) => (
                            <option
                              key={`difficulty-${option.value}-${question.questionId}`}
                              value={option.value}
                            >
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => duplicateQuestion(question)}
                          className="border hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200 group"
                        >
                          <HugeiconsIcon
                            icon={Copy01Icon}
                            size={20}
                            className="group-hover:text-orange"
                          />
                        </button>
                        <button
                          onClick={() => handleEditClick(question)}
                          className="border hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200 flex items-center gap-2 group"
                        >
                          <HugeiconsIcon
                            icon={NoteEditIcon}
                            size={20}
                            className="group-hover:text-orange"
                          />
                          <span className="text-sm font-medium group-hover:text-orange">
                            Edit
                          </span>
                        </button>
                        <button
                          onClick={() => deleteQuestion(question.questionId)}
                          className="border hover:bg-red-50 p-2 rounded-lg transition-colors duration-200 group"
                        >
                          <HugeiconsIcon
                            icon={Delete01Icon}
                            size={20}
                            className="group-hover:text-red-500"
                          />
                        </button>
                      </div>
                    </div>
                    <div className="mt-6">
                      <p className="text-gray-800">{question.questionText}</p>
                      <p className="text-sm font-medium text-gray-600 mt-6 mb-3">
                        Answers
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        {question.answers.map((answer, index) => (
                          <div
                            key={`${question.questionId}-answer-${index}`}
                            className={`flex items-center gap-3 p-3 rounded-lg ${
                              answer.isCorrect
                                ? "bg-green-50 border border-green-100"
                                : "bg-red-50 border border-red-100"
                            }`}
                          >
                            {answer.isCorrect ? (
                              <HugeiconsIcon
                                icon={Tick01Icon}
                                size={20}
                                className="text-green-600"
                              />
                            ) : (
                              <HugeiconsIcon
                                icon={Cancel01Icon}
                                size={20}
                                className="text-red-500"
                              />
                            )}
                            <p className="text-sm font-medium">{answer.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {/* New Question */}
                {!activeNewQuestion && (
                  <div className="flex justify-center my-8">
                    <button
                      onClick={handleClickModal}
                      className="flex items-center gap-2 px-6 py-3 bg-darkblue text-white rounded-lg hover:bg-darkblue/90 transition-colors duration-200"
                    >
                      <i className="fa-solid fa-plus"></i>
                      <span className="font-medium">New Question</span>
                    </button>
                  </div>
                )}
              </div>
              <EditQuestionModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                question={currentQuestion}
                onSave={handleUpdateQuestion}
                TIME_OPTIONS={TIME_OPTIONS}
                SCORE_OPTIONS={SCORE_OPTIONS}
                DIFFICULTY_OPTIONS={DIFFICULTY_OPTIONS}
              />
            </div>
          </div>
        </main>

        {/* New Question Option Modal */}
        {isModal ? (
          <div
            onClick={handleClickModal}
            className="fixed left-0 top-0 right-0 bottom-0 z-[9999] bg-modal flex justify-center items-center"
          >
            <div
              onClick={(event) => event.stopPropagation()}
              className="bg-white px-8 pb-8 rounded-lg container mx-80"
            >
              <div className="flex my-1 justify-end">
                <div
                  onClick={handleClickModal}
                  className="w-5 h-5 my-1 flex justify-center items-center rounded hover:bg-gray-100 cursor-pointer"
                >
                  <i className="text-sm fa-solid fa-xmark"></i>
                </div>
              </div>
              <div className="border-1 rounded-lg grid grid-cols-2">
                <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-2 border-r">
                  <div
                    onClick={showFormQuestion}
                    className="flex items-center gap-2 hover:bg-gray-100 cursor-pointer p-2 rounded"
                  >
                    <div className="bg-darkblue text-background rounded h-8 w-8 flex items-center justify-center">
                      <HugeiconsIcon icon={CursorMagicSelection03Icon} />
                    </div>
                    <p className="font-semibold">Nhiều lựa chọn</p>
                  </div>
                  <div className="flex items-center gap-2 hover:bg-gray-100 cursor-pointer p-2 rounded">
                    <div className="bg-darkblue text-background rounded h-8 w-8 flex items-center justify-center">
                      <HugeiconsIcon icon={ArtboardToolIcon} />
                    </div>
                    <p className="font-semibold">Điền vào chỗ trống</p>
                  </div>
                  <div className="flex items-center gap-2 hover:bg-gray-100 cursor-pointer p-2 rounded">
                    <div className="bg-darkblue text-background rounded h-8 w-8 flex items-center justify-center">
                      <HugeiconsIcon icon={TextAlignJustifyCenterIcon} />
                    </div>
                    <p className="font-semibold">Đoạn văn</p>
                  </div>
                  <div className="flex items-center gap-2 hover:bg-gray-100 cursor-pointer p-2 rounded">
                    <div className="bg-darkblue text-background rounded h-8 w-8 flex items-center justify-center">
                      <HugeiconsIcon icon={Drag04Icon} />
                    </div>
                    <p className="font-semibold">Kéo và thả</p>
                  </div>
                  <div className="flex items-center gap-2 hover:bg-gray-100 cursor-pointer p-2 rounded">
                    <div className="bg-darkblue text-background rounded h-8 w-8 flex items-center justify-center">
                      <HugeiconsIcon icon={ArrowDown01Icon} />
                    </div>
                    <p className="font-semibold">Thả xuống</p>
                  </div>
                </div>
                <div className="bg-darkblue text-background">
                  <div className="p-8">
                    <p className="font-semibold mb-2">Thả xuống</p>
                    <p className="text-sm">
                      Thả xuống Nâng cấp phần điền vào chỗ trống của bạn thành
                      các câu hỏi thả xuống dễ dàng để sinh viên có thể chọn từ
                      danh sách các tùy chọn.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {isFormQuestion && (
          <div
            onClick={showFormQuestion}
            className="fixed left-0 top-0 right-0 bottom-0 bg-modal z-[9999] flex justify-center items-center"
          >
            <div
              onClick={(e: any) => e.stopPropagation()}
              className="bg-nude-light w-full max-w-6xl max-h-[90vh] container mx-auto p-8 rounded-lg"
            >
              <MultipleChoices
                quizId={quizId || ""}
                closeFormQuestion={showFormQuestion}
                getDataForm={handleGetDataForm}
              />
            </div>
          </div>
        )}
        <SelectQuizModal
          isOpen={isSelectQuizModalOpen}
          onClose={() => setIsSelectQuizModalOpen(false)}
          onAddQuestions={handleAddQuestionsFromBank}
          selectedBankIds={selectedBankIds}
        />
      </form>
    </div>
  );
}
