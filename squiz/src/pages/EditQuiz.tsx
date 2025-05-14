import { useNavigate, useParams } from "react-router";
import Quizbar from "../components/Quizbar";
import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import MultipleChoices from "../components/MultipleChoices";
import { useForm } from "react-hook-form";
import { Question } from "../types/Question";
import { EditQuestionModal } from "../components/EditQuestionModal";
import { HugeiconsIcon } from "@hugeicons/react";
import "../style/spinloader.css";
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

export default function EditQuiz() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getToken, userId } = useAuth();

  const handleClickModal: React.MouseEventHandler<HTMLDivElement> = () => {
    setIsModal((preVal) => !preVal);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm();

  const [isModal, setIsModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormQuestion, setIsFormQuestion] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [quizData, setQuizData] = useState({
    creator: "",
    name: "",
    topic: "",
    difficulty: "",
    isPublic: "public",
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

  // Add loading state
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((question) => ({
        ...question,
        timePerQuestion: quizOptions.timePerQuestion,
        scorePerQuestion: quizOptions.scorePerQuestion,
      }))
    );
  }, [quizOptions]);

  // Fetch quiz and questions
  const fetchQuiz = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      // Fetch quiz data
      const quizResponse = await fetch(`${API_BASE_URL}/quiz/${id}`);
      if (!quizResponse.ok) throw new Error("Quiz not found");

      const response = await quizResponse.json();

      if (!response.success) {
        throw new Error(response.message || "Failed to fetch quiz");
      }

      const quizData = response.data;
      console.log("Quiz data from response:", quizData);

      const updatedQuizData = {
        creator: quizData.creator || "",
        name: quizData.name || "",
        topic: quizData.topic || "",
        difficulty: quizData.difficulty || "",
        isPublic: quizData.isPublic || "public",
        questions: quizData.questions || [],
        imageUrl: quizData.imageUrl || null,
      };
      console.log("Updated quiz data:", updatedQuizData);
      setQuizData(updatedQuizData);

      // Set form values
      setValue("name", quizData.name || "");
      setValue("topic", quizData.topic || "");
      setValue("difficulty", quizData.difficulty || "");
      setValue("isPublic", quizData.isPublic || "public");

      // Set quiz options
      setQuizOptions({
        timePerQuestion: quizData.timePerQuestion || 30,
        scorePerQuestion: quizData.scorePerQuestion || 1,
      });

      try {
        // Fetch questions separately
        const questionsResponse = await fetch(
          `${API_BASE_URL}/question/quiz/${id}`
        );

        console.log("Questions response status:", questionsResponse.status);
        console.log(
          "Questions response headers:",
          Object.fromEntries(questionsResponse.headers.entries())
        );

        if (!questionsResponse.ok) {
          const errorText = await questionsResponse.text();
          console.error("Questions response error:", errorText);
          throw new Error(
            `Failed to fetch questions: ${questionsResponse.status} - ${errorText}`
          );
        }

        const questionsResult = await questionsResponse.json();
        console.log("Raw questions response:", questionsResult);

        // Check if the response has the expected structure
        if (!questionsResult || typeof questionsResult !== "object") {
          console.error("Invalid questions response format:", questionsResult);
          throw new Error("Invalid questions response format");
        }

        // If the response is an array, use it directly
        const questionsData = Array.isArray(questionsResult)
          ? questionsResult
          : questionsResult.data || questionsResult.questions || [];

        // Map _id to questionId for each question
        const mappedQuestions = questionsData.map((question: any) => ({
          ...question,
          questionId:
            question._id || question.questionId || Date.now().toString(),
          timePerQuestion:
            question.timePerQuestion || quizOptions.timePerQuestion,
          scorePerQuestion:
            question.scorePerQuestion || quizOptions.scorePerQuestion,
        }));

        setQuestions(mappedQuestions);
      } catch (questionsError) {
        console.error("Error fetching questions:", questionsError);
        setQuestions([]);
      }
    } catch (error) {
      console.error("Error fetching quiz data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("quizData changed:", quizData); 
    if (quizData) {
      setValue("name", quizData.name);
      setValue("topic", quizData.topic);
      setValue("difficulty", quizData.difficulty);
      setValue("isPublic", quizData.isPublic);
    }
  }, [quizData, setValue]);

  // Handle form input changes
  const handleQuizDataChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    console.log("Form field changed:", name, value); 
    setQuizData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Initialize form with default values
  useEffect(() => {
    if (quizData) {
      console.log("Setting initial form values:", quizData); // Debug log
      setValue("name", quizData.name);
      setValue("topic", quizData.topic);
      setValue("difficulty", quizData.difficulty);
      setValue("isPublic", quizData.isPublic);
    }
  }, []); // Run only once on mount

  // Fetch quiz data on mount
  useEffect(() => {
    fetchQuiz();
  }, [id]);

  const handleEditClick = (question: any) => {
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
      quizId: id || "",
      questionType: questionTypeMapping[data.questionType] || data.questionType,
      questionText: data.questionText,
      timePerQuestion: Number(data.timePerQuestion),
      scorePerQuestion: Number(data.scorePerQuestion),
      difficulty: data.difficulty,
      answers: data.answers,
    };
    setQuestions((prevVal) => [...prevVal, newQuestion]);
  };

  // Handle question update
  const handleUpdateQuestion = (updatedQuestion: Question) => {
    console.log("Updating question:", updatedQuestion);
    if (!updatedQuestion.questionId) {
      console.error("Cannot update question: missing questionId");
      return;
    }
    setQuestions((prev) =>
      prev.map((q) =>
        q.questionId === updatedQuestion.questionId ? updatedQuestion : q
      )
    );
  };

  // Handle question field update
  const handleQuestionFieldUpdate = (
    questionId: number | string,
    field: string,
    value: any
  ) => {
    if (!questionId) {
      console.error("Cannot update field: missing questionId");
      return;
    }
    console.log("Updating field:", { questionId, field, value });
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.questionId === questionId) {
          console.log("Found question to update:", q);
          return {
            ...q,
            [field]: value,
          };
        }
        return q;
      })
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setIsUploading(true);

      try {
        // Kiểm tra kích thước file
        if (file.size > 3 * 1024 * 1024) {
          // Nếu lớn hơn 3MB
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true, //Tăng hiệu suất
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
          // Nếu file nhỏ hơn 3MB, sử dụng trực tiếp
          setImageData(file);
        }
      } catch (error) {
        console.error("Error compressing image:", error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Save quiz
  const handleSaveQuiz = async () => {
    if (questions.length < 1) {
      return;
    }

    try {
      setIsSaving(true);
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      // First, update the quiz information
      const formData = new FormData();
      formData.append("creator", userId || "");
      formData.append("name", quizData.name);
      formData.append("topic", quizData.topic);
      formData.append("difficulty", quizData.difficulty);
      formData.append("isPublic", quizData.isPublic);
      if (imageData) {
        formData.append("imageUrl", imageData);
      }
      formData.append("timePerQuestion", String(quizOptions.timePerQuestion));
      formData.append("scorePerQuestion", String(quizOptions.scorePerQuestion));

      console.log("Updating quiz with data:", {
        name: quizData.name,
        topic: quizData.topic,
        difficulty: quizData.difficulty,
        isPublic: quizData.isPublic,
        timePerQuestion: quizOptions.timePerQuestion,
        scorePerQuestion: quizOptions.scorePerQuestion,
      });

      const response = await fetch(`${API_BASE_URL}/quiz/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to update quiz: ${response.status}`
        );
      }

      const quizResult = await response.json();
      if (!quizResult.success) {
        throw new Error(quizResult.message || "Failed to update quiz");
      }

      // Then, delete all existing questions for this quiz
      const deleteResponse = await fetch(
        `${API_BASE_URL}/question/quiz/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!deleteResponse.ok) {
        console.error(
          "Failed to delete existing questions:",
          await deleteResponse.text()
        );
        // Continue anyway as we'll overwrite the questions
      }

      // Finally, save the updated questions
      const updatedQuestions = questions.map((question) => ({
        ...question,
        quizId: id || "",
      }));

      const saveResult = await handleSaveQuestion(updatedQuestions);
      if (saveResult.success) {
        // Add a small delay before navigation
        setTimeout(() => {
          navigate(-1);
        }, 500);
      } else {
        throw new Error(saveResult.message || "Failed to save questions");
      }
    } catch (error) {
      console.error("Error updating quiz:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to update quiz. Please try again."
      );
    } finally {
      setIsSaving(false);
      
    }
  };

  const handleSaveQuestion = async (
    questionsToSave: Question[] = questions
  ) => {
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

  const totalScoreOfQuiz = () => {
    return questions.reduce((total, question) => {
      return total + Number(question.scorePerQuestion || 0);
    }, 0);
  };

  const showFormQuestion = () => {
    setIsFormQuestion((prevVal) => !prevVal);
    setIsModal((prevVal) => !prevVal);
  };

  const duplicateQuestion = (question: Question) => {
    const duplicatedQuestion = {
      ...question,
      questionId: Date.now(),
    };

    setQuestions((prevQuestions) => [...prevQuestions, duplicatedQuestion]);
  };

  const handleDeleteQuiz = async () => {
    try {
      setIsDeleting(true);
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      const response = await fetch(`${API_BASE_URL}/quiz/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to delete quiz: ${response.status}`
        );
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to delete quiz");
      }

      // Chuyển hướng về trang dashboard sau khi xóa
      setTimeout(() => {
        navigate(-1);
      }, 500);
    } catch (error) {
      console.error("Error deleting quiz:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (isLoading && !quizData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          <div className="text-xl">Loading quiz...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-10">
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <nav className="h-16 fixed left-0 right-0 border-b-1 z-10 bg-background py-2 px-4 flex justify-between items-center">
          <div className="flex items-center gap-5">
            <div
              onClick={() => navigate(-1)}
              className="cursor-pointer flex items-center justify-center rounded font-black hover:bg-gray-100 p-2"
            >
              <HugeiconsIcon icon={Backward01Icon} />
            </div>
            <div className="h-10 hover:bg-nude-light rounded cursor-pointer flex items-center">
              <p className="font-semibold">{quizData?.name || "Edit Quiz"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="border-1 p-3 rounded text-red-wine flex text-lg items-center gap-2 btn-hover"
            >
              <p className="font-semibold">Xóa Squiz</p>
            </button>
            <button
              onClick={handleSubmit(handleSaveQuiz)}
              className="flex items-center gap-5"
              disabled={isSaving}
            >
              <div className="p-3 flex items-center cursor-pointer bg-orange btn-hover rounded font-semibold text-lg">
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <span className="loader"></span>
                    <p className="pl-1">Đang cập nhật...</p>
                  </div>
                ) : (
                  <>
                    <p>Lưu Squiz</p>
                  </>
                )}
              </div>
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="pt-28 grid grid-cols-8 gap-8">
          {/* Sidebar */}
          <Quizbar quizOptions={quizOptions} setQuizOptions={setQuizOptions} />

          {/* Quiz Content */}
          <div className="col-span-5">
            {/* Quiz Information */}
            <div className="w-full px-8 py-5 bg-white rounded-lg col-span-5 box-shadow">
              <p className="text-xl mb-5">Thông tin Quiz</p>
              <div className="grid grid-cols-2 mb-2 gap-2">
                <input
                  {...register("name", {
                    required: "Tên quiz không được để trống",
                  })}
                  type="text"
                  value={quizData.name}
                  onChange={handleQuizDataChange}
                  placeholder="Nhập tên Quiz"
                  className={`border p-2.5 text-sm font-semibold rounded-lg ${
                    errors.name ? "border-red-wine" : "border-gray-300"
                  }`}
                />
                <select
                  {...register("topic", {
                    required: "Topic không được để trống",
                  })}
                  id="Topic"
                  name="topic"
                  value={quizData.topic}
                  onChange={handleQuizDataChange}
                  className={`bg-white border outline-none text-sm rounded-lg focus:ring-blue-500 block w-full p-2.5 font-semibold ${
                    errors.topic ? "border-red-wine" : "border-gray-300"
                  }`}
                >
                  <option value="">Chủ đề</option>
                  <option value="math">Toán</option>
                  <option value="english">Tiếng Anh</option>
                  <option value="physics">Vật lý</option>
                  <option value="history">Lịch sử</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  {...register("difficulty", {
                    required: "Độ khó không được để trống",
                  })}
                  id="Difficulty"
                  name="difficulty"
                  value={quizData.difficulty}
                  onChange={handleQuizDataChange}
                  className={`bg-white border outline-none text-sm rounded-lg focus:ring-blue-500 block w-full p-2.5 font-semibold ${
                    errors.difficulty ? "border-red-wine" : "border-gray-300"
                  }`}
                >
                  <option value="">Độ khó</option>
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  {...register("isPublic")}
                  id="Display"
                  name="isPublic"
                  value={quizData.isPublic}
                  onChange={handleQuizDataChange}
                  className="bg-white border outline-none border-gray-300 text-sm rounded-lg focus:ring-blue-500 block w-full p-2.5 font-semibold"
                >
                  <option value="public">Công khai</option>
                  <option value="private">Riêng tư</option>
                </select>
              </div>
              <div className="mt-5">
                <div className="relative">
                  <input
                    accept="image/*"
                    {...register("imageUrl", {
                      required:
                        !quizData?.imageUrl && !imageData && "Hình ảnh phải có",
                    })}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    type="file"
                    onChange={handleImageUpload}
                    id="image-upload"
                    disabled={isUploading}
                  />

                  <label
                    htmlFor="image-upload"
                    className={`cursor-pointer flex items-center gap-1 mt-5 mb-2 ${
                      isUploading ? "opacity-50" : ""
                    }`}
                  >
                    <HugeiconsIcon
                      size={30}
                      icon={ImageUploadIcon}
                      className="text-2xl text-gray-500 hover:text-orange transition-colors"
                    />{" "}
                    <p className="text-md font-semibold">
                      {isUploading
                        ? "Đang tải ảnh lên..."
                        : "Tải ảnh nền cho Squiz"}
                    </p>
                  </label>
                </div>
                {errors.imageUrl && (
                  <p className="mt-2 text-red-wine text-sm">
                    {errors.imageUrl.message?.toString()}
                  </p>
                )}
                {isUploading && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="loader"></span>
                    <p className="text-sm text-gray-600">Đang xử lý ảnh...</p>
                  </div>
                )}
                <div className="flex mt-2">
                  {imageData ? (
                    <img
                      src={URL.createObjectURL(imageData)}
                      alt="Quiz cover"
                      className="w-60 h-40 object-cover rounded"
                    />
                  ) : quizData?.imageUrl ? (
                    <img
                      src={quizData.imageUrl}
                      alt="Quiz cover"
                      className="w-60 h-40 object-cover rounded"
                    />
                  ) : null}
                </div>
              </div>
            </div>

            {/* Questions Section */}
            <div>
              <div className="flex justify-between mt-5">
                <p className="text-xl">
                  {questions.length} Câu hỏi ({totalScoreOfQuiz()} điểm)
                </p>
                <button
                  type="button"
                  onClick={showFormQuestion}
                  className="flex hover:bg-gray-50 cursor-pointer bg-white border-orange-semibold border-1 items-center gap-2 py-1 px-3 rounded font-semibold text-lg"
                >
                  <i className="fa-solid fa-plus"></i>
                  <p>Câu hỏi mới</p>
                </button>
              </div>

              {questions.length === 0 && (
                <div className="flex justify-center border border-red-500 p-4 my-4 rounded">
                  <p className="text-red-wine text-sm font-semibold">
                    Vui lòng nhập ít nhất 1 câu hỏi
                  </p>
                </div>
              )}

              {/* Questions List */}
              <div>
                {questions.map((question, index) => (
                  <div
                    key={question.questionId || `question-${index}`}
                    className="w-full px-8 py-5 mt-5 bg-white rounded-lg col-span-5 box-shadow"
                  >
                    <div className="flex justify-between">
                      <div className="flex gap-2">
                        <div className="border cursor-grab p-2 rounded flex items-center">
                          <HugeiconsIcon icon={Drag04Icon} size={20} />
                        </div>
                        <div className="border p-2 rounded flex items-center gap-2">
                          <i className="fa-regular fa-circle-check"></i>
                          <p className="text-sm">{question.questionType}</p>
                        </div>
                        <div>
                          <select
                            name="timePerQuestion"
                            id={`time-${question.questionId}`}
                            value={question.timePerQuestion}
                            onChange={(e) => {
                              console.log("Question being updated:", question);
                              handleQuestionFieldUpdate(
                                question.questionId,
                                "timePerQuestion",
                                Number(e.target.value)
                              );
                            }}
                            className="bg-white border outline-none border-gray-300 text-sm rounded-lg block w-full p-2.5"
                          >
                            {TIME_OPTIONS.map((time) => (
                              <option
                                key={`time-${time}-${question.questionId}`}
                                value={time}
                              >
                                {time} giây
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <select
                            name="scorePerQuestion"
                            id={`score-${question.questionId}`}
                            value={question.scorePerQuestion}
                            onChange={(e) => {
                              console.log("Question being updated:", question);
                              handleQuestionFieldUpdate(
                                question.questionId,
                                "scorePerQuestion",
                                Number(e.target.value)
                              );
                            }}
                            className="bg-white border outline-none border-gray-300 text-sm rounded-lg block w-full p-2.5 font-semibold"
                          >
                            {SCORE_OPTIONS.map((score) => (
                              <option
                                key={`score-${score}-${question.questionId}`}
                                value={score}
                              >
                                {score} điểm
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <select
                            name="difficulty"
                            id={`difficulty-${question.questionId}`}
                            value={question.difficulty}
                            onChange={(e) => {
                              console.log("Question being updated:", question);
                              handleQuestionFieldUpdate(
                                question.questionId,
                                "difficulty",
                                e.target.value
                              );
                            }}
                            className="bg-white border outline-none border-gray-300 text-sm rounded-lg block w-full p-2.5 font-semibold"
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
                      </div>
                      <div className="flex gap-2">
                        <div
                          onClick={() => duplicateQuestion(question)}
                          className="border hover:bg-gray-50 cursor-pointer p-2 rounded flex items-center gap-2"
                        >
                          <HugeiconsIcon icon={Copy01Icon} size={20} />
                        </div>
                        <div
                          onClick={() => handleEditClick(question)}
                          className="border hover:bg-gray-50 cursor-pointer p-2 rounded flex items-center gap-2"
                        >
                          <HugeiconsIcon icon={NoteEditIcon} size={20} />
                          <p className="text-sm">Chỉnh sửa</p>
                        </div>
                        <div
                          onClick={() => {
                            setQuestions((prev) =>
                              prev.filter(
                                (q) => q.questionId !== question.questionId
                              )
                            );
                          }}
                          className="border hover:bg-gray-50 cursor-pointer p-2 rounded flex items-center gap-2"
                        >
                          <HugeiconsIcon icon={Delete01Icon} size={20} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-5">
                      <p>{question.questionText}</p>
                      <p className="text-sm mt-5 mb-2 font-semibold">Answers</p>
                      <div className="grid grid-cols-2 grid-rows-2 gap-2">
                        {question.answers.map((answer, answerIndex) => (
                          <div
                            key={`answer-${question.questionId}-${answerIndex}`}
                            className="flex items-center gap-2"
                          >
                            {answer.isCorrect ? (
                              <HugeiconsIcon
                                icon={Tick01Icon}
                                size={24}
                                color="green"
                              />
                            ) : (
                              <HugeiconsIcon
                                icon={Cancel01Icon}
                                size={20}
                                color="red"
                              />
                            )}
                            <p>{answer.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {/* New Question */}
                <div className="flex justify-center mt-5 mb-10">
                  <div
                    onClick={showFormQuestion}
                    className="flex cursor-pointer bg-darkblue btn-hover text-background items-center gap-2 py-1 px-3 rounded font-semibold text-lg"
                  >
                    <i className="fa-solid fa-plus"></i>
                    <p>Câu hỏi mới</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* New Question Option Modal */}
        {isModal ? (
          <div
            onClick={handleClickModal}
            className="fixed left-0 top-0 right-0 bottom-0 bg-modal flex justify-center items-center"
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
                    onClick={() => {
                      setIsFormQuestion(true);
                    }}
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
            onClick={() => {
              setIsFormQuestion(false);
            }}
            className="fixed left-0 top-0 right-0 bottom-0 bg-modal flex justify-center items-center"
          >
            <div
              onClick={(e: any) => e.stopPropagation()}
              className="bg-nude-light p-8 rounded-lg"
            >
              <MultipleChoices
                closeFormQuestion={() => {
                  setIsFormQuestion(false);
                }}
                getDataForm={handleGetDataForm}
              />
            </div>
          </div>
        )}

        {/* Edit Question Modal */}
        <EditQuestionModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          question={currentQuestion}
          onSave={handleUpdateQuestion}
          TIME_OPTIONS={TIME_OPTIONS}
          SCORE_OPTIONS={SCORE_OPTIONS}
          DIFFICULTY_OPTIONS={DIFFICULTY_OPTIONS}
        />

        {/* Delete Confirm Modal */}
        {showDeleteModal && (
          <div
            onClick={() => setShowDeleteModal(false)}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-lg p-6 max-w-md w-full mx-4"
            >
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-orange rounded-full flex items-center justify-center mb-4">
                  <HugeiconsIcon
                    icon={Delete01Icon}
                    size={32}
                    className="text-white"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">Xác nhận xóa</h3>
                <p className="text-dim text-center mb-6">
                  Bạn có chắc chắn muốn xóa quiz này? Hành động này không thể
                  hoàn tác.
                </p>
                <div className="flex gap-4 w-full">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded btn-hover"
                    disabled={isDeleting}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleDeleteQuiz}
                    disabled={isDeleting}
                    className="flex-1 py-2 px-4 bg-orange text-darkblue font-semibold rounded btn-hover flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <>
                        <span className="loader"></span>
                        <span>Đang xóa...</span>
                      </>
                    ) : (
                      "Xóa"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
