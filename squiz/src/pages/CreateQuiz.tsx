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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [isModal, setIsModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); //Modal Update Question
  const [isFormQuestion, setIsFormQuestion] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isSaving, setIsSaving] = useState(false);
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

  const [questionsIsVoid, setQuestionsIsVoid] = useState(false);

  useEffect(() => {
    setQuestionsIsVoid(questions.length < 1);
  }, [questions]);

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
      quizId: "",
      questionType: questionTypeMapping[data.questionType] || data.questionType,
      questionText: data.questionText,
      timePerQuestion: Number(data.timePerQuestion) || quizOptions.timePerQuestion,
      scorePerQuestion: Number(data.scorePerQuestion) || quizOptions.scorePerQuestion,
      difficulty: data.difficulty,
      answers: data.answers,
    };
    setQuestions((prevVal) => [...prevVal, newQuestion]);
  };

  // UPDATE CAU HOI
  const handleQuestionUpdate = (e: React.ChangeEvent<HTMLSelectElement>, questionId: number | string) => {
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

    setQuestions((prevQuestions: Question[]) => [...prevQuestions, duplicatedQuestion]);
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
          console.log('Original file size:', file.size / 1024 / 1024, 'MB');
          console.log('Compressed file size:', compressedFile.size / 1024 / 1024, 'MB');
          setImageData(compressedFile);
        } else {
          // Nếu file nhỏ hơn 2MB, sử dụng trực tiếp
          setImageData(file);
        }
      } catch (error) {
        console.error('Error compressing image:', error);
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
    if (questions.length < 1) {
      setQuestionsIsVoid(true);
      return;
    }
    try {
      setIsSaving(true);
      const token = await getToken();
      const formData = new FormData();
      formData.append("creator", user?.id || "");
      formData.append("creatorInfo", JSON.stringify({
        name: user?.fullName,
        avatar: user?.imageUrl,
      }));
      formData.append("name", quizData.name);
      formData.append("topic", quizData.topic);
      formData.append("difficulty", quizData.difficulty);
      formData.append("isPublic", quizData.isPublic);
      formData.append("imageUrl", imageData || "");
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
      if (!quizResult.success) {
        throw new Error(quizResult.message || "Cannot created new Quiz");
      }

      const updatedQuestions = questions.map((question) => ({
        ...question,
        quizId: quizResult._id,
      }));
      const saveResult = await handleSaveQuestion(updatedQuestions);
      
      if (saveResult.success) {
        // Add a small delay before navigation
        setTimeout(() => {
          navigate("/dashboard/home", { replace: true });
        }, 500);
      } else {
        throw new Error(saveResult.message || "Failed to save questions");
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
            <div className=" h-10 hover:bg-nude-light rounded cursor-pointer flex items-center">
              <p className="font-semibold">Please enter Quizz name</p>
            </div>
          </div>
          <button
            onClick={handleSubmit(handleSaveQuiz)}
            className="flex items-center gap-5"
          >
            <div className="p-3 flex items-center cursor-pointer bg-orange btn-hover rounded font-semibold text-lg">
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <span className="loader"></span>
                  <p className="pl-1">Đang tạo Squiz...</p>
                </div>
              ) : (
                <>
                  <i className="fa-solid fa-floppy-disk"></i>
                  <p>Lưu Squiz</p>
                </>
              )}
            </div>
          </button>
        </nav>
        <main className="pt-28 grid grid-cols-8 gap-8">
          <Quizbar quizOptions={quizOptions} setQuizOptions={setQuizOptions} />

          <div className="col-span-5">
            <div className="w-full px-8 py-5 bg-white rounded-lg col-span-5 box-shadow">
              <p className="text-xl mb-5">Thông tin Squiz</p>
              <div className="grid grid-cols-2 mb-2 gap-2">
                <input
                  {...register("name", {
                    required: "Tên quiz không được để trống",
                  })}
                  type="text"
                  value={quizData.name}
                  onChange={handleQuizDataChange}
                  placeholder="Nhập tên Quiz"
                  className={`border p-2.5 text-sm font-semibold rounded-lg
                  ${errors.name ? "border-red-wine" : "border-gray-300"}`}
                />
                <select
                  {...register("topic", {
                    required: "Topic không được để trống",
                  })}
                  id="Topic"
                  value={quizData.topic}
                  onChange={handleQuizDataChange}
                  className={`bg-white  border outline-none border-gray-300  text-sm rounded-lg focus:ring-blue-500  block w-full p-2.5 font-semibold
                    ${errors.topic ? "border-red-wine" : "border-gray-300"}`}
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
                  value={quizData.difficulty}
                  onChange={handleQuizDataChange}
                  className={`bg-white  border outline-none border-gray-300  text-sm rounded-lg focus:ring-blue-500  block w-full p-2.5 font-semibold
                    ${
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
                  name="isPublic"
                  id="Display"
                  value={quizData.isPublic}
                  onChange={handleQuizDataChange}
                  className="bg-white  border outline-none border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 font-semibold dark:focus:ring-blue-500 dark:focus:border-blue-500"
                >
                  <option value="public">Công khai</option>
                  <option value="private">Riêng tư</option>
                </select>
              </div>
              <div className="relative">
                <input
                  accept="image/*"
                  {...register("imageUrl", {
                    required: "Hình ảnh phải có",
                  })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  type="file"
                  onChange={handleImageUpload}
                  id="image-upload"
                  disabled={isUploading}
                />

                <label
                  htmlFor="image-upload"
                  className={`cursor-pointer flex items-center gap-1 mt-5 mb-2 ${isUploading ? 'opacity-50' : ''}`}
                >
                  <HugeiconsIcon
                    size={30}
                    icon={ImageUploadIcon}
                    className="text-2xl text-gray-500 hover:text-orange transition-colors"
                  />{" "}
                  <p className="text-md font-semibold">
                    {isUploading ? 'Đang tải ảnh lên...' : 'Tải ảnh nền cho Squiz'}
                  </p>
                </label>
              </div>
              {errors.imageUrl && (
                <p className="mt-2 text-red-wine text-sm">
                  Vui lòng chọn ảnh nền cho squiz
                </p>
              )}
              {isUploading && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="loader"></span>
                  <p className="text-sm text-gray-600">Đang xử lý ảnh...</p>
                </div>
              )}
              {imageData && !isUploading && (
                <div className="flex">
                  <img
                    src={URL.createObjectURL(imageData)}
                    alt="image data"
                    className="rounded-lg w-80"
                  />
                </div>
              )}
            </div>

            <div>
              <div className="flex  justify-between mt-5">
                <p className="text-xl">
                  {questions.length} Câu hỏi ({totalScoreOfQuiz()} điểm)
                </p>
                <div
                  onClick={handleClickModal}
                  className="flex cursor-pointer bg-darkblue btn-hover text-background items-center gap-2 py-1 px-3 rounded font-semibold text-lg"
                >
                  <i className="fa-solid fa-plus"></i>
                  <p>Câu hỏi mới</p>
                </div>
              </div>
              {questionsIsVoid && (
                <div className="flex justify-center border border-red-500 p-2 my-2">
                  <p className="text-red-wine text-sm font-semibold">
                    Vui lòng nhập ít nhất 1 câu hỏi
                  </p>
                </div>
              )}

              <div>
                {questions.map((question) => (
                  <div
                    key={`questionid-${question.questionId}`}
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
                            onChange={(e) =>
                              handleQuestionUpdate(e, question.questionId)
                            }
                            className="bg-white border outline-none border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                          >
                            {TIME_OPTIONS.map((time) => (
                              <option key={`time-${time}-${question.questionId}`} value={time}>
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
                            onChange={(e) =>
                              handleQuestionUpdate(e, question.questionId)
                            }
                            className="bg-white border outline-none border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 font-semibold"
                          >
                            {SCORE_OPTIONS.map((score) => (
                              <option key={`score-${score}-${question.questionId}`} value={score}>
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
                            onChange={(e) =>
                              handleQuestionUpdate(e, question.questionId)
                            }
                            className="bg-white border outline-none border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 font-semibold"
                          >
                            {DIFFICULTY_OPTIONS.map((option) => (
                              <option key={`difficulty-${option.value}-${question.questionId}`} value={option.value}>
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
                          onClick={() => deleteQuestion(question.questionId)}
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
                        {question.answers.map((answer, index) => (
                          <div key={`${question.questionId}-answer-${index}`} className="flex items-center gap-2">
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
                    onClick={handleClickModal}
                    className="flex cursor-pointer bg-darkblue btn-hover text-background items-center gap-2 py-1 px-3 rounded font-semibold text-lg"
                  >
                    <i className="fa-solid fa-plus"></i>
                    <p>Câu hỏi mới</p>
                  </div>
                </div>
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
            className="fixed left-0 top-0 right-0 bottom-0 bg-modal flex justify-center items-center"
          >
            <div
              onClick={(e: any) => e.stopPropagation()}
              className="bg-nude-light p-8 rounded-lg"
            >
              <MultipleChoices
                closeFormQuestion={showFormQuestion}
                getDataForm={handleGetDataForm}
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
}