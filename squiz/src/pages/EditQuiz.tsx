import { NavLink, useParams, useNavigate } from "react-router";
import Quizbar from "../components/Quizbar";
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import MultipleChoices from "../components/MultipleChoices";
import { useForm } from "react-hook-form";
import { Quiz } from "../types/Quiz";
import { Question } from "../types/Question";
import { toast } from "react-hot-toast"; // Assuming you use react-hot-toast for notifications

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

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm();

  // State
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [imageData, setImageData] = useState<File | null>(null);
  const [isModal, setIsModal] = useState(false);
  const [isFormQuestion, setIsFormQuestion] = useState(false);
  const [quizOptions, setQuizOptions] = useState({
    timePerQuestion: 30,
    scorePerQuestion: 1,
  });

  // Fetch quiz and questions
  const fetchQuiz = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const quizResponse = await fetch(`${API_BASE_URL}/quiz/${id}`);
      if (!quizResponse.ok) throw new Error("Quiz not found");

      const quizData = await quizResponse.json();
      setQuiz(quizData);
      // Set form values
      setValue("name", quizData.name);
      setValue("topic", quizData.topic);
      setValue("difficulty", quizData.difficulty);
      setValue("isPublic", quizData.isPublic);

      const questionsResponse = await fetch(
        `${API_BASE_URL}/question/quiz/${id}`
      );
      if (!questionsResponse.ok) throw new Error("Failed to fetch questions");

      const questionsData = await questionsResponse.json();
      setQuestions(questionsData);
    } catch (error) {
      console.error("Error fetching quiz data:", error);
      toast.error("Failed to load quiz. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [id, setValue]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);
  useEffect(() => {
    console.log("Quiz updated:", quiz);
  }, [quiz]);
  // Modal handlers
  const toggleModal = useCallback(() => {
    setIsModal((prev) => !prev);
  }, []);

  const toggleFormQuestion = useCallback(() => {
    setIsFormQuestion((prev) => !prev);
    setIsModal((prev) => !prev);
  }, []);

  // Question handlers
  const handleQuestionUpdate = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
      questionId: number | string
    ) => {
      const { name, value } = e.target;

      setQuestions((prevQuestions) =>
        prevQuestions.map((question) =>
          question.questionId === questionId
            ? {
                ...question,
                [name]: value,
              }
            : question
        )
      );
    },
    []
  );

  const duplicateQuestion = useCallback((questionToDuplicate: Question) => {
    const duplicatedQuestion = {
      ...questionToDuplicate,
      questionId: Date.now(),
    };

    setQuestions((prevQuestions) => [...prevQuestions, duplicatedQuestion]);
    toast.success("Question duplicated");
  }, []);

  const deleteQuestion = useCallback((questionId: number | string) => {
    setQuestions((prevQuestions) =>
      prevQuestions.filter((q) => q.questionId !== questionId)
    );
    toast.success("Question deleted");
  }, []);

  const handleAddQuestion = useCallback(
    (data: any) => {
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
        questionType:
          questionTypeMapping[data.questionType] || data.questionType,
        questionText: data.questionText,
        timePerQuestion: Number(data.timePerQuestion),
        scorePerQuestion: Number(data.scorePerQuestion),
        difficulty: data.difficulty,
        answers: data.answers,
      };

      setQuestions((prev) => [...prev, newQuestion]);
      toast.success("Question added");
    },
    [id]
  );

  // Image handler
  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        setImageData(e.target.files[0]);
      }
    },
    []
  );

  // Quiz info handler
  const handleQuizDataChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;

      setQuiz((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          [name]: value,
        };
      });
    },
    []
  );

  // Save handlers
  const saveQuiz = async (formData: any) => {
    if (questions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }

    setIsLoading(true);

    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      // Create FormData for quiz with image
      const quizFormData = new FormData();
      quizFormData.append("creator", userId || "");
      quizFormData.append("name", formData.name);
      quizFormData.append("topic", formData.topic);
      quizFormData.append("difficulty", formData.difficulty);
      quizFormData.append("isPublic", formData.isPublic || "public");

      if (imageData) {
        quizFormData.append("imageUrl", imageData);
      }

      quizFormData.append(
        "timePerQuestion",
        String(quizOptions.timePerQuestion)
      );
      quizFormData.append(
        "scorePerQuestion",
        String(quizOptions.scorePerQuestion)
      );

      // Save quiz
      const method = id ? "PUT" : "POST";
      const url = id ? `${API_BASE_URL}/quiz/${id}` : `${API_BASE_URL}/quiz`;

      const quizResponse = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: quizFormData,
      });

      if (!quizResponse.ok) throw new Error("Failed to save quiz");

      const quizResult = await quizResponse.json();
      const quizId = quizResult._id || id;

      if (!quizId) throw new Error("Invalid quiz ID");

      // Update questions with quiz ID
      const updatedQuestions = questions.map((question) => ({
        ...question,
        quizId,
      }));

      // Save questions
      await saveQuestions(updatedQuestions, token);

      toast.success("Quiz saved successfully");
      navigate("/dashboard"); // Redirect to dashboard or quiz list
    } catch (error) {
      console.error("Error saving quiz:", error);
      toast.error("Failed to save quiz. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveQuestions = async (questionsToSave: Question[], token: string) => {
    try {
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

      if (!response.ok) throw new Error("Failed to save questions");

      const result = await response.json();
      if (result.success) {
        setQuestions(result.questions);
      }

      return result;
    } catch (error) {
      console.error("Error saving questions:", error);
      throw error;
    }
  };

  // Calculations
  const calculateTotalScore = useCallback(() => {
    return questions.reduce((total, question) => {
      return total + Number(question.scorePerQuestion || 0);
    }, 0);
  }, [questions]);

  if (isLoading && !quiz) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">Loading quiz...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-10">
      <form onSubmit={handleSubmit(saveQuiz)}>
        {/* Navigation Bar */}
        <nav className="h-16 fixed left-0 right-0 border-b-1 border-orange-600 bg-orange-soft py-2 px-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-5">
            <NavLink to="/">
              <div className="border-1 bg-white w-8 h-8 flex items-center justify-center rounded font-black">
                <i className="fa-solid fa-arrow-left"></i>
              </div>
            </NavLink>
            <div className="h-10 px-2 hover:bg-nude-light rounded cursor-pointer flex items-center">
              <p className="font-semibold">{quiz?.name || "New Quiz"}</p>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-5"
          >
            <div className="p-3 flex items-center gap-2 cursor-pointer bg-nude-semibold btn-hover rounded font-semibold text-lg">
              {isLoading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <i className="fa-solid fa-floppy-disk"></i>
                  <p>Save</p>
                </>
              )}
            </div>
          </button>
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
                  defaultValue={quiz?.name}
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
                  defaultValue={quiz?.topic}
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
                  defaultValue={quiz?.difficulty}
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
                  defaultValue={quiz?.isPublic || "public"}
                  onChange={handleQuizDataChange}
                  className="bg-white border outline-none border-gray-300 text-sm rounded-lg focus:ring-blue-500 block w-full p-2.5 font-semibold"
                >
                  <option value="public">Công khai</option>
                  <option value="private">Riêng tư</option>
                </select>
              </div>
              <div className="mt-5">
                <input
                  {...register("imageUrl", {
                    required:
                      !quiz?.imageUrl && !imageData && "Hình ảnh phải có",
                  })}
                  accept="image/*"
                  className="mb-2"
                  type="file"
                  onChange={handleImageUpload}
                />
                {errors.imageUrl && (
                  <p className="mt-2 text-red-wine text-sm">
                    {errors.imageUrl.message?.toString()}
                  </p>
                )}
                <div className="flex mt-2">
                  {imageData ? (
                    <img
                      src={URL.createObjectURL(imageData)}
                      alt="Quiz cover"
                      className="w-60 h-40 object-cover rounded"
                    />
                  ) : quiz?.imageUrl ? (
                    <img
                      src={quiz.imageUrl}
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
                  {questions.length} Câu hỏi ({calculateTotalScore()} điểm)
                </p>
                <button
                  type="button"
                  onClick={toggleModal}
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
                    key={question.questionId || index}
                    className="w-full px-8 py-5 mt-5 bg-white rounded-lg col-span-5 box-shadow"
                  >
                    <div className="flex justify-between">
                      <div className="flex gap-2">
                        <div className="border cursor-grab p-2 rounded flex items-center">
                          <i className="fa-solid fa-align-justify"></i>
                        </div>
                        <div className="border p-2 rounded flex items-center gap-2">
                          <i className="fa-regular fa-circle-check"></i>
                          <p className="text-sm">
                            {question.questionType ===
                            QUESTION_TYPES.MULTIPLE_CHOICE
                              ? "Nhiều lựa chọn"
                              : question.questionType ===
                                QUESTION_TYPES.FILL_IN_BLANK
                              ? "Điền vào chỗ trống"
                              : question.questionType ===
                                QUESTION_TYPES.PARAGRAPH
                              ? "Đoạn văn"
                              : question.questionType ===
                                QUESTION_TYPES.DRAG_AND_DROP
                              ? "Kéo và thả"
                              : "Thả xuống"}
                          </p>
                        </div>
                        <div>
                          <select
                            name="timePerQuestion"
                            id="time"
                            value={question.timePerQuestion}
                            onChange={(e) =>
                              handleQuestionUpdate(e, question.questionId)
                            }
                            className="bg-white border outline-none border-gray-300 text-sm rounded-lg block w-full p-2.5"
                          >
                            {TIME_OPTIONS.map((time) => (
                              <option key={time} value={time}>
                                {time} giây
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <select
                            name="scorePerQuestion"
                            id="score"
                            value={question.scorePerQuestion}
                            onChange={(e) =>
                              handleQuestionUpdate(e, question.questionId)
                            }
                            className="bg-white border outline-none border-gray-300 text-sm rounded-lg block w-full p-2.5 font-semibold"
                          >
                            {SCORE_OPTIONS.map((score) => (
                              <option key={score} value={score}>
                                {score} điểm
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <select
                            name="difficulty"
                            id="difficulty"
                            value={question.difficulty}
                            onChange={(e) =>
                              handleQuestionUpdate(e, question.questionId)
                            }
                            className="bg-white border outline-none border-gray-300 text-sm rounded-lg block w-full p-2.5 font-semibold"
                          >
                            {DIFFICULTY_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => duplicateQuestion(question)}
                          className="border hover:bg-gray-50 cursor-pointer p-2 rounded flex items-center gap-2"
                        >
                          <i className="fa-regular fa-copy"></i>
                        </button>
                        <button
                          type="button"
                          className="border hover:bg-gray-50 cursor-pointer p-2 rounded flex items-center gap-2"
                        >
                          <i className="fa-regular fa-pen-to-square"></i>
                          <p className="text-sm">Chỉnh sửa</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteQuestion(question.questionId)}
                          className="border hover:bg-gray-50 cursor-pointer p-2 rounded flex items-center gap-2"
                        >
                          <i className="fa-regular fa-trash-can"></i>
                        </button>
                      </div>
                    </div>
                    <div className="mt-5">
                      <p className="font-medium">{question.questionText}</p>
                      <p className="text-sm mt-5 mb-2 font-semibold">Answers</p>
                      <div className="grid grid-cols-2 gap-2">
                        {question.answers &&
                          question.answers.map((answer, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 p-2 border rounded bg-gray-50"
                            >
                              {answer.isCorrect ? (
                                <i className="text-emerald fa-solid fa-check"></i>
                              ) : (
                                <i className="text-red-wine fa-solid fa-xmark"></i>
                              )}
                              <p>{answer.text}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add New Question Button */}
                <div className="flex justify-center mt-5">
                  <button
                    type="button"
                    onClick={toggleModal}
                    className="flex hover:bg-gray-50 cursor-pointer bg-white border-orange-semibold border-1 items-center gap-2 py-1 px-3 rounded font-semibold text-lg"
                  >
                    <i className="text-sm fa-solid fa-plus"></i>
                    <p className="text-sm">Câu hỏi mới</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
        {/* Question Type Modal */}
        {isModal && (
          <div
            onClick={toggleModal}
            className="fixed left-0 top-0 right-0 bottom-0 bg-modal flex justify-center items-center z-20"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white px-8 pb-8 rounded-lg container mx-80"
            >
              <div className="flex my-1 justify-end">
                <button
                  type="button"
                  onClick={toggleModal}
                  className="w-5 h-5 my-1 flex justify-center items-center rounded hover:bg-gray-100 cursor-pointer"
                >
                  <i className="text-sm fa-solid fa-xmark"></i>
                </button>
              </div>
              <div className="border-1 rounded-lg grid grid-cols-2">
                <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-2 border-r">
                  <button
                    type="button"
                    onClick={toggleFormQuestion}
                    className="flex items-center gap-2 hover:bg-gray-100 cursor-pointer p-2 rounded"
                  >
                    <div className="bg-orange-soft rounded h-8 w-8 flex items-center justify-center">
                      <i className="text-xl fa-regular fa-circle-check"></i>
                    </div>
                    <p className="font-semibold">Nhiều lựa chọn</p>
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 hover:bg-gray-100 cursor-pointer p-2 rounded"
                  >
                    <div className="bg-orange-soft rounded h-8 w-8 flex items-center justify-center">
                      <i className="fa-regular fa-square"></i>
                    </div>
                    <p className="font-semibold">Điền vào chỗ trống</p>
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 hover:bg-gray-100 cursor-pointer p-2 rounded"
                  >
                    <div className="bg-orange-soft rounded h-8 w-8 flex items-center justify-center">
                      <i className="fa-solid fa-bars-staggered"></i>
                    </div>
                    <p className="font-semibold">Đoạn văn</p>
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 hover:bg-gray-100 cursor-pointer p-2 rounded"
                  >
                    <div className="bg-orange-soft rounded h-8 w-8 flex items-center justify-center">
                      <i className="fa-regular fa-hand"></i>
                    </div>
                    <p className="font-semibold">Kéo và thả</p>
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 hover:bg-gray-100 cursor-pointer p-2 rounded"
                  >
                    <div className="bg-orange-soft rounded h-8 w-8 flex items-center justify-center">
                      <i className="fa-regular fa-square-caret-down"></i>
                    </div>
                    <p className="font-semibold">Thả xuống</p>
                  </button>
                </div>
                <div className="bg-nude-light">
                  <div className="p-8">
                    <p className="font-semibold mb-2">Chọn loại câu hỏi</p>
                    <p className="text-sm">
                      Chọn loại câu hỏi phù hợp để tạo quiz đa dạng và hiệu quả
                      cho người học.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Question Form Modal */}
        {isFormQuestion && (
          <div
            onClick={toggleFormQuestion}
            className="fixed left-0 top-0 right-0 bottom-0 bg-modal flex justify-center items-center z-20"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-nude-light p-8 rounded-lg"
            >
              <MultipleChoices
                closeFormQuestion={toggleFormQuestion}
                getDataForm={handleAddQuestion}
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
