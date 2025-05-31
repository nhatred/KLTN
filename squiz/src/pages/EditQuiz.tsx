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

export default function EditQuiz() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getToken, userId } = useAuth();

  // Add state for unauthorized access
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  // Add useEffect to check authorization
  useEffect(() => {
    const checkAuthorization = async () => {
      if (!id || !userId) {
        setIsUnauthorized(true);
        return;
      }

      try {
        const token = await getToken();
        if (!token) {
          setIsUnauthorized(true);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/quiz/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          setIsUnauthorized(true);
          return;
        }

        const data = await response.json();

        const isSuccess = data.success;
        const isCreator = data.data.creator === userId;

        if (!isSuccess || !isCreator) {
          setIsUnauthorized(true);
          return;
        }

        setIsUnauthorized(false);
      } catch (error) {
        console.error("Error checking authorization:", error);
        setIsUnauthorized(true);
      }
    };

    checkAuthorization();
  }, [id, userId, getToken]);

  const handleClickModal = () => {
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
    timePerQuestion: 30,
    scorePerQuestion: 1,
    isPublic: true,
    questions: [{}],
    imageUrl: null,
    questionBankQueries: [],
    isExam: false,
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

  const [isSelectQuizModalOpen, setIsSelectQuizModalOpen] = useState(false);
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

  const [activeNewQuestion, setActiveNewQuestion] = useState(true);
  const [isExam, setIsExam] = useState(false);

  useEffect(() => {
    setIsExam(selectedQuestionBanks.length > 0);
  }, [selectedQuestionBanks]);

  if (isSelectQuizModalOpen) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "auto";
  }

  useEffect(() => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((question) => ({
        ...question,
        timePerQuestion: Number(quizOptions.timePerQuestion),
        scorePerQuestion: Number(quizOptions.scorePerQuestion),
      }))
    );

    // Also update the quiz data
    setQuizData((prev) => ({
      ...prev,
      timePerQuestion: Number(quizOptions.timePerQuestion),
      scorePerQuestion: Number(quizOptions.scorePerQuestion),
    }));
  }, [quizOptions]);

  // Fetch quiz and questions
  const fetchQuiz = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("No authentication token found");

      // Fetch quiz data
      const quizResponse = await fetch(`${API_BASE_URL}/quiz/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
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
        isPublic:
          typeof quizData.isPublic === "boolean" ? quizData.isPublic : true,
        questions: quizData.questions || [],
        imageUrl: quizData.imageUrl || null,
        timePerQuestion: Number(quizData.timePerQuestion || 30),
        scorePerQuestion: Number(quizData.scorePerQuestion || 1),
        questionBankQueries: quizData.questionBankQueries || [],
        isExam: quizData.isExam || false,
      };

      // Update quiz options with default values from quiz
      setQuizOptions({
        timePerQuestion: Number(quizData.timePerQuestion || 30),
        scorePerQuestion: Number(quizData.scorePerQuestion || 1),
      });

      console.log("Updated quiz data:", updatedQuizData);
      setQuizData(updatedQuizData);

      // Fetch questions
      const questionsResponse = await fetch(
        `${API_BASE_URL}/question/quiz/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!questionsResponse.ok) {
        throw new Error("Failed to fetch questions");
      }

      const questionsData = await questionsResponse.json();
      if (questionsData.success) {
        const formattedQuestions = questionsData.data.map((q: any) => {
          // Ensure each question has its own time and score values
          const timePerQuestion =
            q.timePerQuestion !== undefined
              ? Number(q.timePerQuestion)
              : Number(updatedQuizData.timePerQuestion);
          const scorePerQuestion =
            q.scorePerQuestion !== undefined
              ? Number(q.scorePerQuestion)
              : Number(updatedQuizData.scorePerQuestion);

          console.log(`Question ${q._id} original values:`, {
            timePerQuestion: q.timePerQuestion,
            scorePerQuestion: q.scorePerQuestion,
          });

          return {
            questionId: q._id,
            _id: q._id,
            quizId: q.quizId,
            questionType: q.questionType,
            questionText: q.questionText,
            timePerQuestion,
            scorePerQuestion,
            difficulty: q.difficulty,
            answers: q.answers,
            options: q.answers.map((answer: any) => answer.text),
          };
        });

        console.log(
          "Formatted questions with preserved values:",
          formattedQuestions
        );
        setQuestions(formattedQuestions);
      }

      // Set form values
      setValue("name", quizData.name || "");
      setValue("topic", quizData.topic || "");
      setValue("difficulty", quizData.difficulty || "");
      setValue(
        "isPublic",
        typeof quizData.isPublic === "boolean" ? quizData.isPublic : true
      );

      // If quiz is using question banks, update the state
      if (quizData.isExam && quizData.questionBankQueries?.length > 0) {
        setIsExam(true);
        setActiveNewQuestion(false);

        // Group queries by examSetId
        const questionBanks = new Map();
        quizData.questionBankQueries.forEach((query: any) => {
          if (!questionBanks.has(query.examSetId)) {
            questionBanks.set(query.examSetId, {
              examSetId: query.examSetId,
              name: query.examName || "Question Bank",
              sections: [],
            });
          }
          questionBanks.get(query.examSetId).sections.push({
            difficulty: query.difficulty,
            numberOfQuestions: query.limit,
          });
        });

        // Convert Map to array and set state
        setSelectedQuestionBanks(Array.from(questionBanks.values()));
      }

      // Clear questions if using question banks
      if (quizData.isExam) {
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
      [name]: name === "isPublic" ? value === "true" : value,
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
  const handleUpdateQuestion = async (updatedQuestion: Question) => {
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      // Send update to server
      const response = await fetch(
        `${API_BASE_URL}/question/${updatedQuestion._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedQuestion),
        }
      );

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to update question");
      }

      // Update local state with the response from server
      setQuestions((prev) =>
        prev.map((q) =>
          q.questionId === updatedQuestion.questionId ? result.data : q
        )
      );

      // Close the modal after successful update
      setIsModalOpen(false);
      setCurrentQuestion(null);
    } catch (error) {
      console.error("Error updating question:", error);
      alert("Failed to update question. Please try again.");
    }
  };

  // Handle question field update
  const handleQuestionFieldUpdate = async (
    questionId: string,
    field: string,
    value: any
  ) => {
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      // Find the question to update
      const questionToUpdate = questions.find((q) => q._id === questionId);
      if (!questionToUpdate) {
        throw new Error("Question not found");
      }

      // Create updated question data
      const updatedQuestion = {
        ...questionToUpdate,
        [field]: value,
        options: questionToUpdate.answers.map((answer) => answer.text), // Ensure options field is present
      };

      // Send update to server
      const response = await fetch(`${API_BASE_URL}/question/${questionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          questionText: updatedQuestion.questionText,
          questionType: updatedQuestion.questionType,
          difficulty: updatedQuestion.difficulty,
          timePerQuestion: Number(updatedQuestion.timePerQuestion),
          scorePerQuestion: Number(updatedQuestion.scorePerQuestion),
          options: updatedQuestion.answers.map((answer) => answer.text),
          answers: updatedQuestion.answers.map((answer) => ({
            text: answer.text,
            isCorrect: answer.isCorrect,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to update question: ${response.status}`
        );
      }

      const result = await response.json();
      if (result.success) {
        // Update local state with server response
        setQuestions(
          questions.map((q) =>
            q._id === questionId
              ? {
                  ...result.data,
                  timePerQuestion: Number(result.data.timePerQuestion),
                  scorePerQuestion: Number(result.data.scorePerQuestion),
                }
              : q
          )
        );
      } else {
        throw new Error(result.message || "Failed to update question");
      }
    } catch (err) {
      console.error("Error updating question field:", err);
      const error = err as Error;
      alert(error.message || "Failed to update question. Please try again.");
    }
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
    try {
      setIsSaving(true);
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      // Save the quiz first
      const formData = new FormData();
      formData.append("creator", userId || "");
      formData.append("name", quizData.name);
      formData.append("topic", quizData.topic);
      formData.append("difficulty", quizData.difficulty);
      formData.append("isPublic", quizData.isPublic.toString());
      formData.append("isExam", isExam.toString());
      formData.append("timePerQuestion", String(quizOptions.timePerQuestion));
      formData.append("scorePerQuestion", String(quizOptions.scorePerQuestion));

      // Add question bank queries if using exam mode
      if (isExam && selectedQuestionBanks.length > 0) {
        const questionBankQueries = selectedQuestionBanks.flatMap((bank) =>
          bank.sections.map((section) => ({
            examSetId: bank.examSetId,
            examName: bank.name,
            difficulty: section.difficulty,
            limit: section.numberOfQuestions,
          }))
        );
        formData.append(
          "questionBankQueries",
          JSON.stringify(questionBankQueries)
        );
      }

      // Add image if exists
      if (imageData) {
        formData.append("imageUrl", imageData);
      }

      const response = await fetch(`${API_BASE_URL}/quiz/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const quizResult = await response.json();
      if (quizResult.success) {
        // Fetch updated quiz data
        await fetchQuiz();
        navigate(-1);
      } else {
        throw new Error(quizResult.message || "Cannot update Quiz");
      }
    } catch (error) {
      console.error("Error saving quiz:", error);
      alert("Failed to save quiz. Please try again.");
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

  const duplicateQuestion = async (question: Question) => {
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      // First create the duplicated question
      const newQuestionData = {
        quizId: id,
        questionText: question.questionText,
        questionType: question.questionType,
        difficulty: question.difficulty,
        timePerQuestion: Number(question.timePerQuestion),
        scorePerQuestion: Number(question.scorePerQuestion),
        options: question.answers.map((answer) => answer.text),
        answers: question.answers.map((answer) => ({
          text: answer.text,
          isCorrect: answer.isCorrect,
        })),
      };

      console.log("Creating duplicated question with data:", newQuestionData);

      // Create new question in database
      const createResponse = await fetch(`${API_BASE_URL}/question`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newQuestionData),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(
          errorData.message ||
            `Failed to create duplicated question: ${createResponse.status}`
        );
      }

      const createResult = await createResponse.json();

      if (!createResult.success) {
        throw new Error(
          createResult.message || "Failed to create duplicated question"
        );
      }

      // Get the newly created question's ID
      const newQuestionId = createResult.question._id;

      // Get current quiz data first
      const quizResponse = await fetch(`${API_BASE_URL}/quiz/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!quizResponse.ok) {
        // If we can't get quiz data, delete the created question
        await fetch(`${API_BASE_URL}/question/${newQuestionId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        throw new Error("Failed to get current quiz data");
      }

      const quizData = await quizResponse.json();

      if (!quizData.success) {
        throw new Error(quizData.message || "Failed to get quiz data");
      }

      // Prepare form data with all current quiz data plus the new question
      const formData = new FormData();
      formData.append("creator", quizData.data.creator || userId || "");
      formData.append("name", quizData.data.name || "");
      formData.append("topic", quizData.data.topic || "");
      formData.append("difficulty", quizData.data.difficulty || "");
      formData.append("isPublic", String(quizData.data.isPublic));
      formData.append("isExam", String(quizData.data.isExam || false));
      formData.append(
        "timePerQuestion",
        String(quizData.data.timePerQuestion || 30)
      );
      formData.append(
        "scorePerQuestion",
        String(quizData.data.scorePerQuestion || 1)
      );

      // Add the new question to the questions array
      const updatedQuestions = [...questions.map((q) => q._id), newQuestionId];
      formData.append("questions", JSON.stringify(updatedQuestions));

      // If there's an existing image, include it
      if (quizData.data.imageUrl) {
        formData.append("imageUrl", quizData.data.imageUrl);
      }

      // Now update the quiz
      const quizUpdateResponse = await fetch(`${API_BASE_URL}/quiz/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!quizUpdateResponse.ok) {
        // If quiz update fails, try to delete the created question to maintain consistency
        await fetch(`${API_BASE_URL}/question/${newQuestionId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        throw new Error("Failed to update quiz with new question");
      }

      const quizUpdateResult = await quizUpdateResponse.json();

      if (!quizUpdateResult.success) {
        throw new Error(quizUpdateResult.message || "Failed to update quiz");
      }

      // Add the new question to local state
      const duplicatedQuestion = {
        ...createResult.question,
        questionId: createResult.question._id,
        _id: createResult.question._id,
        timePerQuestion: Number(question.timePerQuestion),
        scorePerQuestion: Number(question.scorePerQuestion),
        options: question.answers.map((answer) => answer.text),
      };

      console.log("Successfully duplicated question:", duplicatedQuestion);
      setQuestions([...questions, duplicatedQuestion]);

      // Show success message
      alert("Đã sao chép câu hỏi thành công!");
    } catch (error) {
      console.error("Error duplicating question:", error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Không thể sao chép câu hỏi. Vui lòng thử lại.");
      }
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      // Delete from server
      const response = await fetch(`${API_BASE_URL}/question/${questionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to delete question: ${response.status}`
        );
      }

      const result = await response.json();
      // Check for success flag or message indicating success
      if (result.success || result.message.includes("xóa thành công")) {
        // Refresh the questions list or remove the question from state
        setQuestions(questions.filter((q) => q._id !== questionId));
      } else {
        throw new Error(result.message || "Failed to delete question");
      }
    } catch (err) {
      console.error("Error deleting question:", err);
      // Only show error if it's not a success message
      const error = err as Error;
      if (!error.message.includes("xóa thành công")) {
        alert(error.message || "Failed to delete question. Please try again.");
      }
    }
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

  const handleAddQuestionsFromBank = async (
    questionBankQueries: Array<{
      examSetId: string;
      difficulty: string;
      limit: number;
    }>,
    examName: string
  ) => {
    try {
      setIsSaving(true);
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      // Get existing questionBankQueries from current quiz
      const quizResponse = await fetch(`${API_BASE_URL}/quiz/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!quizResponse.ok) {
        throw new Error("Failed to fetch current quiz data");
      }

      const quizData = await quizResponse.json();
      const existingQueries = quizData.data.questionBankQueries || [];

      // Add examName to each query before saving
      const queriesWithNames = questionBankQueries.map((query) => ({
        ...query,
        examName,
      }));

      // Combine existing and new queries
      const updatedQueries = [...existingQueries, ...queriesWithNames];

      // Update quiz with combined question bank queries
      const formData = new FormData();
      formData.append("creator", userId || "");
      formData.append("name", quizData.data.name);
      formData.append("topic", quizData.data.topic);
      formData.append("difficulty", quizData.data.difficulty);
      formData.append("isPublic", quizData.data.isPublic);
      formData.append("isExam", "true"); // Always set isExam to true when adding from question bank
      formData.append("timePerQuestion", String(quizOptions.timePerQuestion));
      formData.append("scorePerQuestion", String(quizOptions.scorePerQuestion));
      formData.append("questionBankQueries", JSON.stringify(updatedQueries));

      // Nếu có ảnh hiện tại, thêm vào formData
      if (imageData) {
        formData.append("imageUrl", imageData);
      } else if (quizData.data.imageUrl) {
        formData.append("imageUrl", quizData.data.imageUrl);
      }

      const updateResponse = await fetch(`${API_BASE_URL}/quiz/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(
          errorData.message || "Failed to update quiz with question bank"
        );
      }

      const updateResult = await updateResponse.json();

      if (!updateResult.success) {
        throw new Error(updateResult.message || "Failed to update quiz");
      }

      // Add to selected banks list
      const sections = questionBankQueries.map((query) => ({
        difficulty: query.difficulty,
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

      // Clear manual questions if any
      setQuestions([]);
      setActiveNewQuestion(false);
      setIsSelectQuizModalOpen(false);

      // Update local state with new quiz data
      setQuizData({
        ...quizData.data,
        questionBankQueries: updatedQueries,
        isExam: true,
      });

      // Set isExam to true since we now have question banks
      setIsExam(true);

      // Show success message
      alert("Đã thêm câu hỏi từ ngân hàng đề thành công!");
    } catch (error) {
      console.error("Error adding questions from bank:", error);
      alert("Failed to add questions from bank. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Update removeQuestionBank function to handle questionBankQueries
  const removeQuestionBank = async (examSetId: string) => {
    try {
      setIsSaving(true);
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      // Get current quiz data
      const quizResponse = await fetch(`${API_BASE_URL}/quiz/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!quizResponse.ok) {
        throw new Error("Failed to fetch current quiz data");
      }

      const quizData = await quizResponse.json();
      const currentQueries = quizData.data.questionBankQueries || [];

      // Filter out the removed bank's queries
      const updatedQueries = currentQueries.filter(
        (query: any) => query.examSetId !== examSetId
      );

      // Remove bank from selected list
      setSelectedQuestionBanks((prev) =>
        prev.filter((bank) => bank.examSetId !== examSetId)
      );

      // Update quiz with filtered queries
      const formData = new FormData();
      formData.append("creator", userId || "");
      formData.append("name", quizData.data.name);
      formData.append("topic", quizData.data.topic);
      formData.append("difficulty", quizData.data.difficulty);
      formData.append("isPublic", quizData.data.isPublic);
      formData.append("isExam", String(updatedQueries.length > 0));
      formData.append("timePerQuestion", String(quizOptions.timePerQuestion));
      formData.append("scorePerQuestion", String(quizOptions.scorePerQuestion));
      formData.append("questionBankQueries", JSON.stringify(updatedQueries));

      const updateResponse = await fetch(`${API_BASE_URL}/quiz/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to update quiz after removing question bank");
      }

      const updateResult = await updateResponse.json();

      if (!updateResult.success) {
        throw new Error(updateResult.message || "Failed to update quiz");
      }

      // If no more banks, allow manual questions
      if (updatedQueries.length === 0) {
        setActiveNewQuestion(true);
        setIsExam(false);
      }
    } catch (error) {
      console.error("Error removing question bank:", error);
      alert("Failed to remove question bank. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Update fetchQuestionBanks in useEffect
  useEffect(() => {
    const fetchQuestionBanks = async () => {
      if (!id) return;

      try {
        const token = await getToken();
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/quiz/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return;

        const data = await response.json();
        if (data.success && data.data.isExam) {
          setIsExam(true);
          setActiveNewQuestion(false);

          // Group queries by examSetId
          const questionBanks = new Map();
          data.data.questionBankQueries?.forEach((query: any) => {
            if (!questionBanks.has(query.examSetId)) {
              questionBanks.set(query.examSetId, {
                examSetId: query.examSetId,
                name: query.examName || "Question Bank",
                sections: [],
              });
            }
            questionBanks.get(query.examSetId).sections.push({
              difficulty: query.difficulty,
              numberOfQuestions: query.limit,
            });
          });

          // Convert Map to array and set state
          setSelectedQuestionBanks(Array.from(questionBanks.values()));
        }
      } catch (error) {
        console.error("Error fetching question banks:", error);
      }
    };

    fetchQuestionBanks();
  }, [id, getToken]);

  const handleApplyToAll = async () => {
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      // Update all questions with current quizOptions
      const updateQuestionsPromises = questions.map(async (question) => {
        if (!question._id) return;

        try {
          const response = await fetch(
            `${API_BASE_URL}/question/${question._id}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                ...question,
                timePerQuestion: Number(quizOptions.timePerQuestion),
                scorePerQuestion: Number(quizOptions.scorePerQuestion),
                options: question.answers.map((answer) => answer.text),
                answers: question.answers.map((answer) => ({
                  text: answer.text,
                  isCorrect: answer.isCorrect,
                })),
              }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.message ||
                `Failed to update question: ${response.status}`
            );
          }

          return await response.json();
        } catch (error) {
          console.error("Error updating question:", error);
          throw error;
        }
      });

      // Wait for all question updates to complete
      await Promise.all(updateQuestionsPromises);

      // Update local state
      setQuestions(
        questions.map((question) => ({
          ...question,
          timePerQuestion: Number(quizOptions.timePerQuestion),
          scorePerQuestion: Number(quizOptions.scorePerQuestion),
        }))
      );

      alert("Đã cập nhật tất cả câu hỏi thành công!");
    } catch (error) {
      console.error("Error applying to all questions:", error);
      alert("Không thể cập nhật tất cả câu hỏi. Vui lòng thử lại.");
    }
  };

  const handleQuestionCreated = (newQuestion: any) => {
    // Add the new question to the questions array
    setQuestions((prevQuestions) => [...prevQuestions, newQuestion]);
  };

  if (isLoading && !quizData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          <div className="text-xl">Đang tải quiz...</div>
        </div>
      </div>
    );
  }

  if (isUnauthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-2xl font-semibold text-red-wine mb-4">
          Bạn không có quyền chỉnh sửa quiz này
        </div>
        <button
          onClick={() => {
            navigate("/dashboard/my-quiz", { replace: true });
          }}
          className="px-4 py-2 bg-orange text-white rounded btn-hover"
        >
          Quay lại
        </button>
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
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-3 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors duration-200"
            >
              <HugeiconsIcon icon={Delete01Icon} size={20} />
              <span className="font-medium">Xóa quiz</span>
            </button>
            <button
              onClick={handleSubmit(handleSaveQuiz)}
              className="flex items-center gap-2"
              disabled={isSaving}
            >
              <div className="p-3 flex items-center cursor-pointer bg-orange hover:bg-orange/90 transition-colors duration-200 rounded-lg font-semibold text-lg">
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <span className="loader"></span>
                    <p className="pl-1">Đang cập nhật quiz...</p>
                  </div>
                ) : (
                  <>
                    <i className="fa-solid fa-floppy-disk mr-2"></i>
                    <p>Lưu quiz</p>
                  </>
                )}
              </div>
            </button>
          </div>
        </nav>

        <main className="pt-28 pb-20 grid grid-cols-8 gap-8">
          {/* Sidebar */}
          <Quizbar
            quizOptions={quizOptions}
            setQuizOptions={setQuizOptions}
            onApplyToAll={handleApplyToAll}
          />

          {/* Quiz Content */}
          <div className="col-span-5">
            {/* Quiz Information */}
            <div className="w-full px-8 py-6 bg-white rounded-xl col-span-5 shadow-md hover:shadow-lg transition-shadow duration-200">
              <p className="text-xl font-semibold mb-6">Thông tin quiz</p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <input
                  {...register("name", {
                    required: "Quiz name cannot be empty",
                  })}
                  type="text"
                  value={quizData.name}
                  onChange={handleQuizDataChange}
                  placeholder="Nhập tên quiz"
                  className={`border p-3 text-sm font-medium rounded-lg outline-none focus:ring-2 focus:ring-orange/30 transition-all duration-200
                  ${errors.name ? "border-red-500" : "border-gray-300"}`}
                />
                <select
                  {...register("topic", {
                    required: "Topic cannot be empty",
                  })}
                  id="Topic"
                  name="topic"
                  value={quizData.topic}
                  onChange={handleQuizDataChange}
                  className={`bg-white border outline-none text-sm rounded-lg block w-full p-3 font-medium focus:ring-2 focus:ring-orange/30 transition-all duration-200
                  ${errors.topic ? "border-red-500" : "border-gray-300"}`}
                >
                  <option value="">Chọn chủ đề</option>
                  <option value="math">Toán học</option>
                  <option value="english">Tiếng Anh</option>
                  <option value="physics">Vật lý</option>
                  <option value="history">Lịch sử</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <select
                  {...register("difficulty", {
                    required: "Difficulty cannot be empty",
                  })}
                  id="Difficulty"
                  name="difficulty"
                  value={quizData.difficulty}
                  onChange={handleQuizDataChange}
                  className={`bg-white border outline-none text-sm rounded-lg block w-full p-3 font-medium focus:ring-2 focus:ring-orange/30 transition-all duration-200
                  ${errors.difficulty ? "border-red-500" : "border-gray-300"}`}
                >
                  <option value="">Chọn độ khó</option>
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
                  value={String(quizData.isPublic)}
                  onChange={handleQuizDataChange}
                  className="bg-white border outline-none text-sm rounded-lg block w-full p-3 font-medium focus:ring-2 focus:ring-orange/30 transition-all duration-200 border-gray-300"
                >
                  <option value="true">Công khai</option>
                  <option value="false">Riêng tư</option>
                </select>
              </div>
              <div className="relative">
                <input
                  accept="image/*"
                  {...register("imageUrl", {
                    required:
                      !quizData?.imageUrl &&
                      !imageData &&
                      "Quiz image is required",
                  })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  type="file"
                  onChange={handleImageUpload}
                  id="image-upload"
                  disabled={isUploading}
                />
                <label
                  htmlFor="image-upload"
                  className={`cursor-pointer flex items-center gap-2 p-3 border border-dashed border-gray-300 rounded-lg hover:border-orange/50 transition-colors duration-200 ${
                    isUploading ? "opacity-50" : ""
                  }`}
                >
                  <HugeiconsIcon
                    icon={ImageUploadIcon}
                    size={24}
                    className="text-gray-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {isUploading ? "Đang tải ảnh..." : "Tải ảnh nền quiz"}
                  </span>
                </label>
              </div>
              {errors.imageUrl && (
                <p className="mt-2 text-red-500 text-sm">
                  {errors.imageUrl.message?.toString()}
                </p>
              )}
              {isUploading && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="loader"></span>
                  <p className="text-sm text-gray-600">Đang xử lý ảnh...</p>
                </div>
              )}
              <div className="mt-4">
                {imageData ? (
                  <img
                    src={URL.createObjectURL(imageData)}
                    alt="Preview"
                    className="rounded-lg w-full max-h-48 object-cover"
                  />
                ) : quizData?.imageUrl ? (
                  <img
                    src={quizData.imageUrl}
                    alt="Quiz cover"
                    className="rounded-lg w-full max-h-48 object-cover"
                  />
                ) : null}
              </div>
            </div>

            {/* Questions Section */}
            <div>
              <div className="flex justify-between mt-8 mb-6">
                <p className="text-xl font-semibold">
                  {questions.length} câu hỏi ({totalScoreOfQuiz()} điểm)
                </p>
                <div className="flex gap-3">
                  {!questions.length && (
                    <button
                      onClick={() => setIsSelectQuizModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 border border-darkblue text-darkblue rounded-lg hover:bg-darkblue hover:text-white transition-colors duration-200"
                    >
                      <i className="fa-solid fa-plus"></i>
                      <span className="font-medium">
                        Thêm câu hỏi từ ngân hàng đề thi
                      </span>
                    </button>
                  )}
                  {!isExam && (
                    <button
                      onClick={handleClickModal}
                      className="flex items-center gap-2 px-4 py-2 bg-darkblue text-white rounded-lg hover:bg-darkblue/90 transition-colors duration-200"
                    >
                      <i className="fa-solid fa-plus"></i>
                      <span className="font-medium">Nhập câu hỏi thủ công</span>
                    </button>
                  )}
                </div>
              </div>

              {selectedQuestionBanks.length > 0 && (
                <div className="mt-8 space-y-4">
                  <p className="text-xl font-semibold mb-4">
                    Ngân hàng đề thi đã chọn
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
                          <HugeiconsIcon
                            icon={Delete01Icon}
                            size={20}
                            className="group-hover:text-red-500"
                          />
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
                                ? "Dễ"
                                : section.difficulty === "medium"
                                ? "Trung bình"
                                : "Khó"}
                            </span>
                            <p className="text-2xl font-semibold mt-1">
                              {section.numberOfQuestions}
                              <span className="text-sm font-normal text-gray-500 ml-1">
                                câu hỏi
                              </span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {questions.length === 0 && selectedQuestionBanks.length === 0 && (
                <div className="flex justify-center p-4 my-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-500 text-sm font-medium">
                    Vui lòng thêm ít nhất một câu hỏi hoặc chọn từ ngân hàng đề
                    thi
                  </p>
                </div>
              )}

              {/* Question List */}
              {!isExam &&
                questions.map((question, index) => {
                  // Skip if question._id is undefined
                  if (!question._id) return null;

                  const questionId = question._id;

                  return (
                    <div
                      key={questionId}
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
                            id={`time-${questionId}`}
                            value={Number(question.timePerQuestion)}
                            onChange={(e) => {
                              console.log("Updating time:", e.target.value);
                              handleQuestionFieldUpdate(
                                questionId,
                                "timePerQuestion",
                                Number(e.target.value)
                              );
                            }}
                            className="bg-white border outline-none text-sm rounded-lg block p-2 font-medium focus:ring-2 focus:ring-orange/30 transition-all duration-200 border-gray-300"
                          >
                            {TIME_OPTIONS.map((time) => (
                              <option
                                key={`time-${time}-${questionId}`}
                                value={time}
                              >
                                {time}s
                              </option>
                            ))}
                          </select>
                          <select
                            name="scorePerQuestion"
                            id={`score-${questionId}`}
                            value={Number(question.scorePerQuestion)}
                            onChange={(e) => {
                              console.log("Updating score:", e.target.value);
                              handleQuestionFieldUpdate(
                                questionId,
                                "scorePerQuestion",
                                Number(e.target.value)
                              );
                            }}
                            className="bg-white border outline-none text-sm rounded-lg block p-2 font-medium focus:ring-2 focus:ring-orange/30 transition-all duration-200 border-gray-300"
                          >
                            {SCORE_OPTIONS.map((score) => (
                              <option
                                key={`score-${score}-${questionId}`}
                                value={score}
                              >
                                {score} điểm
                              </option>
                            ))}
                          </select>
                          <select
                            name="difficulty"
                            id={`difficulty-${questionId}`}
                            value={question.difficulty}
                            onChange={(e) => {
                              handleQuestionFieldUpdate(
                                questionId,
                                "difficulty",
                                e.target.value
                              );
                            }}
                            className="bg-white border outline-none text-sm rounded-lg block p-2 font-medium focus:ring-2 focus:ring-orange/30 transition-all duration-200 border-gray-300"
                          >
                            {DIFFICULTY_OPTIONS.map((option) => (
                              <option
                                key={`difficulty-${option.value}-${questionId}`}
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
                              Sửa
                            </span>
                          </button>
                          <button
                            onClick={() =>
                              question._id
                                ? handleDeleteQuestion(question._id)
                                : null
                            }
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
                          Câu trả lời
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          {question.answers.map((answer, answerIndex) => (
                            <div
                              key={`answer-${questionId}-${answerIndex}`}
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
                              <p className="text-sm font-medium">
                                {answer.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}

              {/* New Question Button */}
              {!isExam && questions.length > 0 && (
                <div className="flex justify-center my-8">
                  <button
                    onClick={handleClickModal}
                    className="flex items-center gap-2 px-6 py-3 bg-darkblue text-white rounded-lg hover:bg-darkblue/90 transition-colors duration-200"
                  >
                    <i className="fa-solid fa-plus"></i>
                    <span className="font-medium">Thêm câu hỏi</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* New Question Option Modal */}
        {isModal && (
          <div
            onClick={handleClickModal}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div
              onClick={(event) => event.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 transform transition-all duration-200 scale-100"
            >
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-2xl font-bold">Thêm câu hỏi mới</h2>
                <button
                  onClick={handleClickModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="w-6 h-6" />
                </button>
              </div>
              <div className="grid grid-cols-2">
                <div className="p-6 border-r">
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={showFormQuestion}
                      className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-lg transition-colors duration-200 group"
                    >
                      <div className="bg-darkblue text-white rounded-lg h-12 w-12 flex items-center justify-center">
                        <HugeiconsIcon icon={CursorMagicSelection03Icon} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold group-hover:text-darkblue transition-colors">
                          Câu hỏi đa lựa chọn
                        </p>
                        <p className="text-sm text-gray-500">
                          Tạo một câu hỏi đa lựa chọn
                        </p>
                      </div>
                    </button>
                    <button className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-lg transition-colors duration-200 group">
                      <div className="bg-darkblue text-white rounded-lg h-12 w-12 flex items-center justify-center">
                        <HugeiconsIcon icon={ArtboardToolIcon} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold group-hover:text-darkblue transition-colors">
                          Điền vào chỗ trống
                        </p>
                        <p className="text-sm text-gray-500">
                          Tạo một câu hỏi điền vào chỗ trống
                        </p>
                      </div>
                    </button>
                    <button className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-lg transition-colors duration-200 group">
                      <div className="bg-darkblue text-white rounded-lg h-12 w-12 flex items-center justify-center">
                        <HugeiconsIcon icon={TextAlignJustifyCenterIcon} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold group-hover:text-darkblue transition-colors">
                          Paragraph
                        </p>
                        <p className="text-sm text-gray-500">
                          Tạo một câu hỏi đoạn văn
                        </p>
                      </div>
                    </button>
                    <button className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-lg transition-colors duration-200 group">
                      <div className="bg-darkblue text-white rounded-lg h-12 w-12 flex items-center justify-center">
                        <HugeiconsIcon icon={Drag04Icon} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold group-hover:text-darkblue transition-colors">
                          Drag & Drop
                        </p>
                        <p className="text-sm text-gray-500">
                          Tạo một câu hỏi kéo và thả
                        </p>
                      </div>
                    </button>
                    <button className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-lg transition-colors duration-200 group">
                      <div className="bg-darkblue text-white rounded-lg h-12 w-12 flex items-center justify-center">
                        <HugeiconsIcon icon={ArrowDown01Icon} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold group-hover:text-darkblue transition-colors">
                          Dropdown
                        </p>
                        <p className="text-sm text-gray-500">
                          Tạo một câu hỏi dropdown
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-darkblue to-blue-800 text-white p-8">
                  <h3 className="text-xl font-bold mb-4">Loại câu hỏi</h3>
                  <p className="text-blue-100 mb-6">
                    Chọn từ các loại câu hỏi khác nhau để tạo ra các quiz thú vị
                    và tương tác. Mỗi loại câu hỏi cung cấp các cách để kiểm tra
                    kiến thức và hiểu biết.
                  </p>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <p className="text-sm font-medium">Pro Tip</p>
                    <p className="text-sm text-blue-100">
                      Trộn các loại câu hỏi khác nhau để giữ quiz thú vị và kiểm
                      tra các kỹ năng khác nhau.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Question Form Modal */}
        {isFormQuestion && id && (
          <div
            onClick={() => setIsFormQuestion(false)}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 p-6 transform transition-all duration-200 scale-100"
            >
              <MultipleChoices
                quizId={id}
                closeFormQuestion={() => setIsFormQuestion(false)}
                getDataForm={handleGetDataForm}
                onQuestionCreated={handleQuestionCreated}
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
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 transform transition-all duration-200 scale-100"
            >
              <div className="p-6">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <HugeiconsIcon
                      icon={Delete01Icon}
                      size={32}
                      className="text-red-500"
                    />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Xóa quiz</h3>
                  <p className="text-gray-600 text-center mb-6">
                    Bạn có chắc chắn muốn xóa quiz này không? Hành động này
                    không thể hoàn tác.
                  </p>
                  <div className="flex gap-4 w-full">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
                      disabled={isDeleting}
                    >
                      Hủy bỏ
                    </button>
                    <button
                      onClick={handleDeleteQuiz}
                      disabled={isDeleting}
                      className="flex-1 py-2 px-4 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      {isDeleting ? (
                        <>
                          <span className="loader"></span>
                          <span>Đang xóa...</span>
                        </>
                      ) : (
                        "Delete Quiz"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
      {/* Select Quiz Modal */}
      {isSelectQuizModalOpen && (
        <SelectQuizModal
          isOpen={isSelectQuizModalOpen}
          onClose={() => setIsSelectQuizModalOpen(false)}
          onAddQuestions={handleAddQuestionsFromBank}
          selectedBankIds={selectedBankIds}
        />
      )}
    </div>
  );
}
