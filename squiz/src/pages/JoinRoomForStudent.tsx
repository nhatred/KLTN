import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import {
  Share08Icon,
  Copy01Icon,
  UserGroup03Icon,
  CheckmarkCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  Logout02Icon,
  ClockIcon,
} from "@hugeicons/core-free-icons";
import "../style/button.css";
import { useParams, useNavigate, useLocation } from "react-router";
import { useAuth, useUser } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import QuizResults from "../components/QuizResults";
import SpinnerLoading from "../components/SpinnerLoading";

interface ServerResponse {
  success: boolean;
  message?: string;
  data?: any;
}

interface SocketResponse {
  success: boolean;
  message?: string;
  data?: any;
}

interface Room {
  _id: string;
  roomCode: string;
  examSetId: string;
  host: {
    _id: string;
    name: string;
    imageUrl: string;
  };
  startTime: string;
  endTime: string;
  status: string;
  participants: Array<{
    _id: string;
    user: {
      _id: string;
      name: string;
      imageUrl: string;
    };
  }>;
  durationMinutes: number;
  quiz?: any; // For backward compatibility
  questionOrder: Question[];
}

interface Participant {
  _id: string;
  user: {
    _id: string;
    name: string;
    imageUrl: string;
  };
}

interface Answer {
  _id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  _id: string;
  questionText: string;
  answers: Answer[];
  questionType: string;
  scorePerQuestion: number;
  difficulty: string;
  options: Answer[];
  dragDropPairs: any[];
}

interface QuizResults {
  score: number;
  stats: {
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    correctPercentage: number;
  };
  answers: Answer[];
}

interface ParticipantInfo {
  _id: string;
  user: {
    _id: string;
    name: string;
    imageUrl: string;
  };
}

interface ParticipantResponse extends SocketResponse {
  data?: ParticipantInfo;
}

// Add interface for User
interface User {
  _id: string;
  name: string;
  email: string;
  imageUrl: string;
}

// Add these interfaces at the top with other interfaces
interface ParticipantData {
  success: boolean;
  room?: Room;
  remainingQuestions?: Question[];
  message?: string;
}

interface QuestionProgress {
  answered: number;
  total: number;
  score: number;
}

interface AnsweredQuestion {
  questionId: string;
  answerId: string;
}

interface QuestionUpdateData {
  remaining: Question[];
  answered: AnsweredQuestion[];
  progress: QuestionProgress;
  currentQuestion: Question | null;
  lastSubmission?: {
    questionId: string;
    isCorrect: boolean;
    score: number;
    isLastQuestion: boolean;
  };
}

interface SubmissionResponse {
  success: boolean;
  message?: string;
  data?: QuestionUpdateData;
}

interface QuizAnswer {
  questionId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  question: string;
}

export default function JoinRoomForStudent() {
  const { code } = useParams();
  const { getToken, userId } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [endTimeRemaining, setEndTimeRemaining] = useState("");
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => {
    const savedIndex = localStorage.getItem(`quiz_current_question_${code}`);
    console.log(
      "[INIT] Restoring question index from localStorage:",
      savedIndex
    );
    return savedIndex ? parseInt(savedIndex) : 0;
  });
  const [showQuestions, setShowQuestions] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >(() => {
    const savedAnswers = localStorage.getItem(`quiz_answers_${code}`);
    return savedAnswers ? JSON.parse(savedAnswers) : {};
  });
  const [copied, setCopied] = useState({ url: false, code: false });
  const [submitted, setSubmitted] = useState(() => {
    const savedState = localStorage.getItem(`quiz_submitted_${code}`);
    return savedState === "true";
  });
  const [animateQuestion, setAnimateQuestion] = useState(true);
  const [direction, setDirection] = useState(0);
  const [quizResults, setQuizResults] = useState(() => {
    const savedResults = localStorage.getItem(`quiz_results_${code}`);
    if (savedResults) {
      try {
        return JSON.parse(savedResults);
      } catch (e) {
        console.error("Error parsing saved results:", e);
        return null;
      }
    }
    return null;
  });
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [remainingQuestions, setRemainingQuestions] = useState<Question[]>([]);
  const [answeredQuestions, setAnsweredQuestions] = useState<
    AnsweredQuestion[]
  >([]);
  const [progress, setProgress] = useState<QuestionProgress>({
    answered: 0,
    total: 0,
    score: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roomStatus, setRoomStatus] = useState("waiting");
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Animation settings
  const answerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: [0.43, 0.13, 0.23, 0.96],
      },
    }),
    selected: {
      scale: 0.98,
      boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.2)",
      transition: { duration: 0.2 },
    },
    hover: {
      y: -5,
      boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
      transition: { duration: 0.3 },
    },
  };

  const questionVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 500 : -500,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: [0.43, 0.13, 0.23, 0.96],
      },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 500 : -500,
      opacity: 0,
      transition: {
        duration: 0.4,
        ease: [0.43, 0.13, 0.23, 0.96],
      },
    }),
  };

  // Effects
  useEffect(() => {
    if (submitted) {
      localStorage.setItem(`quiz_submitted_${code}`, "true");
    }
  }, [submitted, code]);

  useEffect(() => {
    if (quizResults) {
      localStorage.setItem(`quiz_results_${code}`, JSON.stringify(quizResults));
    }
  }, [quizResults, code]);

  useEffect(() => {
    return () => {
      if (!submitted) {
        localStorage.removeItem(`quiz_answers_${code}`);
        localStorage.removeItem(`quiz_current_question_${code}`);
      }
    };
  }, [submitted, code]);

  useEffect(() => {
    if (location.state?.endTime) {
      const newEndTime = new Date(location.state.endTime);
      setEndTime(newEndTime);
    }
  }, [location.state]);

  const updateTimeRemaining = () => {
    if (endTime) {
      const now = new Date();
      const remaining = endTime.getTime() - now.getTime();

      if (remaining <= 0) {
        setTimeRemaining("00:00:00");
        setRoomStatus("completed");
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      setTimeRemaining(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    }
  };

  useEffect(() => {
    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  const handleJoinRoom = useCallback(
    async (roomData: any) => {
      try {
        if (!socket) {
          throw new Error("Socket connection not available");
        }

        console.log("[JOIN] Starting join room process with data:", {
          roomCode: roomData.roomCode,
          userId,
          userName: user?.fullName,
        });

        // Join room using Socket.IO
        return new Promise((resolve, reject) => {
          const joinData = {
            roomCode: roomData.roomCode,
            userId,
            user: {
              _id: userId,
              name: user?.fullName,
              imageUrl: user?.imageUrl,
            },
            deviceInfo: {
              browser: navigator.userAgent,
              timestamp: new Date().toISOString(),
            },
          };

          console.log("[JOIN] Emitting joinRoom event with data:", joinData);

          socket.emit("joinRoom", joinData, async (response: any) => {
            console.log("[JOIN] Received joinRoom response:", response);

            if (!response.success) {
              console.error("[JOIN] Join room failed:", response.message);
              reject(new Error(response.message || "Failed to join room"));
              return;
            }

            try {
              // If we have questions from the response, use them
              if (
                response.remainingQuestions &&
                response.remainingQuestions.length > 0
              ) {
                console.log("[JOIN] Questions received from server:", {
                  count: response.remainingQuestions.length,
                  firstTwoQuestions: response.remainingQuestions
                    .slice(0, 2)
                    .map((q: any) => ({
                      id: q._id,
                      text: q.questionText?.substring(0, 30) + "...",
                    })),
                });

                // Set questions immediately
                setQuestions(response.remainingQuestions);
                setShowQuestions(true);

                // Create room data with shuffled questions
                const roomWithShuffledQuestions = {
                  ...roomData,
                  questionOrder: response.remainingQuestions,
                };

                console.log("[JOIN] Setting room with shuffled questions:", {
                  roomId: roomWithShuffledQuestions._id,
                  questionCount: response.remainingQuestions.length,
                });

                resolve(roomWithShuffledQuestions);
              } else {
                console.error("[JOIN] No questions received from server");
                reject(new Error("No questions received from server"));
              }
            } catch (error) {
              console.error("[JOIN] Error in join room callback:", error);
              reject(error);
            }
          });
        });
      } catch (error) {
        console.error("[JOIN] Error in handleJoinRoom:", error);
        throw error;
      }
    },
    [socket, userId, user]
  );

  // Add effect to monitor questions state
  useEffect(() => {
    if (questions.length > 0) {
      console.log("[QUESTIONS] Questions state updated:", {
        total: questions.length,
        currentIndex: currentQuestionIndex,
        currentQuestion: questions[currentQuestionIndex]
          ? {
              id: questions[currentQuestionIndex]._id,
              text:
                questions[currentQuestionIndex].questionText?.substring(0, 30) +
                "...",
            }
          : null,
        firstTwoQuestions: questions.slice(0, 2).map((q) => ({
          id: q._id,
          text: q.questionText?.substring(0, 30) + "...",
        })),
      });
    }
  }, [questions, currentQuestionIndex]);

  // Add effect to monitor room state
  useEffect(() => {
    if (room) {
      console.log("[ROOM] Room state updated:", {
        roomId: room._id,
        questionOrderLength: room.questionOrder?.length,
        firstTwoQuestionsInOrder: room.questionOrder?.slice(0, 2).map((q) => ({
          id: q._id,
          text: q.questionText?.substring(0, 30) + "...",
        })),
      });
    }
  }, [room]);

  const fetchAllUsers = useCallback(async () => {
    try {
      console.log("Starting to fetch all users...");
      const token = await getToken();

      const response = await fetch("http://localhost:5000/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch users. Status: ${response.status}`);
        const errorText = await response.text();
        console.error("Error response:", errorText);
        return;
      }

      const data = await response.json();
      console.log("Raw API Response:", data);

      if (data.success && Array.isArray(data.data)) {
        console.log("\n=== ALL USERS IN DATABASE ===");
        console.log(`Total users found: ${data.data.length}`);

        data.data.forEach((user: User, index: number) => {
          console.log(`\nUser ${index + 1}:`, {
            id: user._id,
            name: user.name,
            email: user.email,
            imageUrl: user.imageUrl,
          });
        });

        setAllUsers(data.data);
      } else {
        console.error("Invalid response format:", data);
      }
    } catch (error) {
      console.error("Error in fetchAllUsers:", error);
    }
  }, [getToken]);

  // Update getRoom to handle questions properly
  const getRoom = useCallback(async () => {
    try {
      setLoading(true);

      if (!user || !userId) {
        console.log("Waiting for user data...");
        return;
      }

      const token = await getToken();
      if (!token) {
        console.error("No authentication token available");
        setLoading(false);
        return;
      }

      // First fetch room data
      console.log("Fetching room data...");
      const response = await fetch(
        `http://localhost:5000/api/quizRoom/code/${code}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        console.log("Room data received:", {
          roomId: data.data._id,
          status: data.data.status,
          participants: data.data.participants?.length,
          quiz: data.data.quiz?._id,
        });

        // Check if user is already a participant
        const isParticipant = data.data.participants?.some((p: any) => {
          const participantUserId =
            typeof p.user === "string" ? p.user : p.user?._id;
          const isMatch = participantUserId === userId;
          console.log("Checking participant:", {
            participantId: p._id,
            participantUserId,
            currentUserId: userId,
            isMatch,
          });
          return isMatch;
        });
        console.log("Is user a participant?", isParticipant);

        if (isParticipant) {
          // Get existing participant's questions
          console.log("Fetching existing participant's questions...");
          const participantResponse = await fetch(
            `http://localhost:5000/api/participant/status/${userId}?roomId=${data.data._id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (participantResponse.ok) {
            const participantData = await participantResponse.json();
            console.log("Received participant data:", {
              success: participantData.success,
              remainingQuestions:
                participantData.data?.remainingQuestions?.length,
              answeredQuestions:
                participantData.data?.answeredQuestions?.length,
            });

            if (participantData.success && participantData.data) {
              console.log("Setting questions from existing participant:", {
                questionCount: participantData.data.remainingQuestions?.length,
                sampleQuestions: participantData.data.remainingQuestions
                  ?.slice(0, 2)
                  .map((q: any) => ({
                    id: q._id,
                    text: q.questionText?.substring(0, 30) + "...",
                  })),
              });
              const remainingQuestions =
                participantData.data.remainingQuestions || [];
              setQuestions(remainingQuestions);
              setShowQuestions(true);

              // Set room data with participant's questions
              setRoom({
                ...data.data,
                questionOrder: remainingQuestions,
              });
            } else {
              console.error(
                "Failed to get participant data:",
                participantData.message
              );
            }
          } else {
            console.error(
              "Failed to fetch participant status:",
              participantResponse.statusText
            );
          }
        } else {
          // Join room as a new participant
          console.log("Joining room as new participant...");
          const joinResponse = await handleJoinRoom(data.data);
          console.log("Join room response:", {
            roomId: (joinResponse as Room)._id,
            questionCount: (joinResponse as Room).questionOrder?.length,
            sampleQuestions: (joinResponse as Room).questionOrder
              ?.slice(0, 2)
              .map((q: any) => ({
                id: q._id,
                text: q.questionText?.substring(0, 30) + "...",
              })),
          });
          setRoom(joinResponse as Room);
        }
      } else {
        throw new Error(data.message || "Không thể tải dữ liệu phòng");
      }
    } catch (error) {
      console.error("Error in getRoom:", error);
    } finally {
      setLoading(false);
    }
  }, [code, getToken, user, userId, handleJoinRoom]);

  useEffect(() => {
    getRoom();
  }, [getRoom]);

  // Update getRoom function to fetch users after room data
  useEffect(() => {
    if (user && userId) {
      console.log("Initial users fetch...");
      fetchAllUsers();
    }
  }, [user, userId, fetchAllUsers]);

  // Add separate useEffect for initial users fetch
  useEffect(() => {
    if (user && userId) {
      console.log("Initial users fetch...");
      fetchAllUsers();
    }
  }, [user, userId, fetchAllUsers]);

  // Add debug logging for state changes
  useEffect(() => {
    console.log("Current allUsers state:", allUsers);
  }, [allUsers]);

  const handleConfirm = useCallback(async () => {
    try {
      if (
        quizResults &&
        quizResults.answers &&
        quizResults.answers.length > 0
      ) {
        alert("Bạn đã nộp bài thi này rồi!");
        setShowConfirmModal(false);
        return;
      }

      if (!socket || !room || !userId || !user) {
        throw new Error(
          "Không thể kết nối đến server hoặc không tìm thấy thông tin người dùng"
        );
      }

      setIsSubmitting(true);

      // Gửi submission cho câu hỏi cuối cùng với isLastQuestion = true
      const currentQuestion = questions[currentQuestionIndex];
      const currentAnswerId = selectedAnswers[currentQuestion._id];

      try {
        // Trước khi nộp bài, gửi thông tin về tổng số câu hỏi thực tế
        const token = await getToken();
        const finalResponse = await fetch(
          "http://localhost:5000/api/submission/participation",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              roomId: room._id,
              userId: userId,
              totalQuestions: questions.length, // Thêm thông tin về tổng số câu hỏi
              answeredQuestions: Object.keys(selectedAnswers).length, // Thêm thông tin về số câu đã trả lời
            }),
          }
        );

        if (!finalResponse.ok) {
          throw new Error("Failed to finalize submission");
        }

        const finalData = await finalResponse.json();
        console.log("Final submission response:", finalData);

        // Fetch quiz results
        const resultsResponse = await fetch(
          `http://localhost:5000/api/submission/results?roomId=${room._id}&userId=${userId}`,
          {
            headers: {
              Authorization: `Bearer ${await getToken()}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (resultsResponse.ok) {
          const resultsData = await resultsResponse.json();
          console.log("Quiz results:", resultsData);

          if (resultsData.success) {
            // Đảm bảo totalQuestions khớp với số câu hỏi thực tế
            const correctedResults = {
              ...resultsData.data,
              totalQuestions: questions.length,
              stats: {
                ...resultsData.data.stats,
                totalQuestions: questions.length,
                correctPercentage:
                  (resultsData.data.stats.correctAnswers / questions.length) *
                  100,
              },
            };

            // Cập nhật UI với kết quả đã được điều chỉnh
            setSubmitted(true);
            setQuizResults(correctedResults);

            // Lưu kết quả đã điều chỉnh vào localStorage
            localStorage.setItem(`quiz_submitted_${code}`, "true");
            localStorage.setItem(
              `quiz_results_${code}`,
              JSON.stringify(correctedResults)
            );

            // Clear other localStorage items
            localStorage.removeItem(`quiz_answers_${code}`);
            localStorage.removeItem(`quiz_current_question_${code}`);
            localStorage.removeItem(`quiz_progress_${code}`);

            // Leave room
            socket.emit("leaveRoom", {
              roomId: room._id,
              participantId: userId,
            });
          } else {
            throw new Error("Failed to get quiz results");
          }
        } else {
          throw new Error("Failed to fetch quiz results");
        }
      } catch (error) {
        console.error("Error in submission completion:", error);
        alert(
          error instanceof Error
            ? error.message
            : "Có lỗi xảy ra khi nộp bài. Vui lòng thử lại."
        );
      } finally {
        setIsSubmitting(false);
        setShowConfirmModal(false);
      }
    } catch (error) {
      console.error("Error in handleConfirm:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi nộp bài. Vui lòng thử lại."
      );
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  }, [
    quizResults,
    socket,
    room,
    userId,
    user,
    questions,
    currentQuestionIndex,
    selectedAnswers,
    code,
    getToken,
  ]);

  // Khai báo handleTimeUp trước
  const handleTimeUp = useCallback(async () => {
    try {
      if (submitted) return;

      console.log("Time's up! Processing unanswered questions...");

      // Đánh dấu tất cả câu hỏi chưa trả lời là sai
      const unansweredQuestions = questions.filter(
        (q) => !selectedAnswers[q._id]
      );
      console.log("Unanswered questions:", unansweredQuestions.length);

      if (unansweredQuestions.length > 0) {
        // Với mỗi câu chưa trả lời, chọn đáp án đầu tiên (sẽ được đánh là sai)
        const newAnswers = { ...selectedAnswers };
        unansweredQuestions.forEach((q) => {
          if (q.answers && q.answers.length > 0) {
            newAnswers[q._id] = q.answers[0]._id;
          }
        });

        setSelectedAnswers(newAnswers);
        localStorage.setItem(
          `quiz_answers_${code}`,
          JSON.stringify(newAnswers)
        );
      }

      // Tự động kích hoạt nộp bài
      await handleConfirm();
    } catch (error) {
      console.error("Error in handleTimeUp:", error);
    }
  }, [questions, selectedAnswers, submitted, code, handleConfirm]);

  // Sau đó khai báo calculateTimeRemaining
  const calculateTimeRemaining = useCallback(() => {
    if (!room?.startTime) return;

    const startTime = new Date(room.startTime).getTime();
    const now = new Date().getTime();
    const difference = startTime - now;

    if (difference <= 0) {
      setTimeRemaining("Phòng thi đã bắt đầu");
      setShowQuestions(true);

      const endTime = new Date(startTime + room.durationMinutes * 60 * 1000);
      const endTimeDifference = endTime.getTime() - now;

      if (endTimeDifference <= 0) {
        setEndTimeRemaining("Phòng thi đã kết thúc");
        setShowQuestions(false);

        // Xử lý hết giờ nếu chưa nộp bài
        if (!submitted) {
          handleTimeUp();
        }
      } else {
        const hours = Math.floor(endTimeDifference / (1000 * 60 * 60));
        const minutes = Math.floor(
          (endTimeDifference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((endTimeDifference % (1000 * 60)) / 1000);

        setEndTimeRemaining(
          `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`
        );

        // Add urgent animation when less than 5 minutes remain
        if (progressRef.current && endTimeDifference < 300000) {
          progressRef.current.classList.add("urgent");
        } else if (progressRef.current) {
          progressRef.current.classList.remove("urgent");
        }
      }
      return;
    }

    const minutes = Math.floor(difference / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    setTimeRemaining(`Phòng thi bắt đầu sau ${minutes} phút ${seconds} giây`);
    setEndTimeRemaining("");
  }, [room, submitted, handleTimeUp]);

  // Cuối cùng là useEffect cho việc tính thời gian
  useEffect(() => {
    if (room?.status === "scheduled" || room?.status === "active") {
      calculateTimeRemaining();
      timerRef.current = setInterval(() => {
        const now = new Date().getTime();

        if (room.startTime) {
          const startTime = new Date(room.startTime).getTime();
          const endTime = startTime + room.durationMinutes * 60 * 1000;
          const timeLeft = endTime - now;

          if (timeLeft <= 0 && !submitted) {
            // Clear interval
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }

            // Xử lý hết giờ
            handleTimeUp();
            return;
          }

          // Cập nhật hiển thị thời gian
          calculateTimeRemaining();
        }
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [
    room?.status,
    calculateTimeRemaining,
    room?.startTime,
    room?.durationMinutes,
    submitted,
    handleTimeUp,
  ]);

  // Update socket event handlers
  useEffect(() => {
    if (!socket || !room) return;

    console.log("Setting up socket listeners for room:", room._id);

    // Listen for participant updates
    socket.on("participantJoined", async (data) => {
      console.log("Received participantJoined event:", data);

      if (data.roomId === room._id) {
        // Fetch the latest room data
        try {
          const token = await getToken();
          const response = await fetch(
            `http://localhost:5000/api/quizRoom/code/${code}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            const updatedData = await response.json();
            if (updatedData.success) {
              console.log("Updated room data:", updatedData.data);
              setRoom(updatedData.data);
              // Fetch latest user data
              await fetchAllUsers();
            }
          }
        } catch (error) {
          console.error("Error updating room data:", error);
        }
      }
    });

    // Add question update listener
    socket.on("questionsUpdate", (data) => {
      console.log("Received questions update:", data);

      if (data.remaining) {
        setQuestions(data.remaining);
      }

      if (data.answered) {
        setAnsweredQuestions(data.answered);
      }

      if (data.progress) {
        setProgress(data.progress);
      }

      // Lưu state vào localStorage
      localStorage.setItem(
        `quiz_progress_${code}`,
        JSON.stringify(data.progress)
      );
      localStorage.setItem(
        `quiz_answers_${code}`,
        JSON.stringify(
          data.answered.reduce((acc: any, curr: any) => {
            acc[curr.questionId] = curr.answerId;
            return acc;
          }, {})
        )
      );
    });

    // Listen for participant left
    socket.on("participantLeft", async (data) => {
      console.log("Received participantLeft event:", data);

      if (data.roomId === room._id) {
        // Fetch the latest room data
        try {
          const token = await getToken();
          const response = await fetch(
            `http://localhost:5000/api/quizRoom/code/${code}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            const updatedData = await response.json();
            if (updatedData.success) {
              console.log(
                "Updated room data after participant left:",
                updatedData.data
              );
              setRoom(updatedData.data);
            }
          }
        } catch (error) {
          console.error("Error updating room data:", error);
        }
      }
    });

    // Add room status update listener
    socket.on("roomStatusChanged", async (data) => {
      console.log("Received roomStatusChanged event:", data);

      if (data.roomId === room._id) {
        try {
          const token = await getToken();
          // First get updated room data
          const response = await fetch(
            `http://localhost:5000/api/quizRoom/code/${code}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            const updatedData = await response.json();
            if (updatedData.success) {
              console.log("Room status updated:", updatedData.data);
              setRoom(updatedData.data);

              // If room is now active, fetch participant questions
              if (updatedData.data.status === "active") {
                console.log("Room is now active, fetching questions...");
                const participantResponse = await fetch(
                  `http://localhost:5000/api/participant/status/${userId}?roomId=${updatedData.data._id}`,
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                    },
                  }
                );

                if (participantResponse.ok) {
                  const participantData = await participantResponse.json();
                  console.log("Received participant data:", participantData);

                  if (participantData.success && participantData.data) {
                    console.log("Setting questions from participant data:", {
                      questionCount:
                        participantData.data.remainingQuestions?.length,
                    });
                    const remainingQuestions =
                      participantData.data.remainingQuestions || [];
                    setQuestions(remainingQuestions);
                    setShowQuestions(true);
                  } else {
                    console.error(
                      "Failed to get participant data:",
                      participantData.message
                    );
                  }
                } else {
                  console.error(
                    "Failed to fetch participant status:",
                    participantResponse.statusText
                  );
                }
              } else if (updatedData.data.status === "completed") {
                setShowQuestions(false);
                if (!submitted) {
                  handleConfirm();
                }
              }
            }
          }
        } catch (error) {
          console.error("Error updating room status:", error);
        }
      }
    });

    // Add periodic room status check
    const statusCheckInterval = setInterval(async () => {
      try {
        const token = await getToken();
        const response = await fetch(
          `http://localhost:5000/api/quizRoom/code/${code}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const updatedData = await response.json();
          if (updatedData.success && updatedData.data.status !== room.status) {
            console.log("Room status updated from polling:", updatedData.data);
            setRoom(updatedData.data);

            // If room is now active, fetch participant questions
            if (updatedData.data.status === "active") {
              console.log(
                "Room is now active, fetching questions from polling..."
              );
              const participantResponse = await fetch(
                `http://localhost:5000/api/participant/status/${userId}?roomId=${updatedData.data._id}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                }
              );

              if (participantResponse.ok) {
                const participantData = await participantResponse.json();
                console.log(
                  "Received participant data from polling:",
                  participantData
                );

                if (participantData.success && participantData.data) {
                  console.log(
                    "Setting questions from participant data (polling):",
                    {
                      questionCount:
                        participantData.data.remainingQuestions?.length,
                    }
                  );
                  const remainingQuestions =
                    participantData.data.remainingQuestions || [];
                  setQuestions(remainingQuestions);
                  setShowQuestions(true);
                } else {
                  console.error(
                    "Failed to get participant data from polling:",
                    participantData.message
                  );
                }
              } else {
                console.error(
                  "Failed to fetch participant status from polling:",
                  participantResponse.statusText
                );
              }
            } else if (updatedData.data.status === "completed") {
              setShowQuestions(false);
              if (!submitted) {
                handleConfirm();
              }
            }
          }
        }
      } catch (error) {
        console.error("Error in periodic status check:", error);
      }
    }, 5000); // Check every 5 seconds

    // Join the room's socket channel
    socket.emit("joinUserRoomManager", room._id);

    return () => {
      socket.off("participantJoined");
      socket.off("participantLeft");
      socket.off("roomStatusChanged");
      socket.off("questionsUpdate");
      clearInterval(statusCheckInterval);
    };
  }, [socket, room, code, getToken, fetchAllUsers, submitted, handleConfirm]);

  // Update room status effect to handle questions
  useEffect(() => {
    if (room?.status === "active") {
      setShowQuestions(true);
    } else if (room?.status === "completed" && !submitted) {
      handleConfirm();
    }
  }, [room?.status, submitted, handleConfirm]);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  const handleAnswerSelect = useCallback(
    async (questionId: string, answerId: string) => {
      if (!questionId || !socket || !room?._id) return;

      setSelectedAnswers((prev: any) => {
        const newAnswers = {
          ...prev,
          [questionId]: answerId,
        };

        localStorage.setItem(
          `quiz_answers_${code}`,
          JSON.stringify(newAnswers)
        );

        return newAnswers;
      });

      // Gửi submission ngay khi chọn đáp án
      try {
        const currentQuestion = questions[currentQuestionIndex];
        const isLastQuestion = currentQuestionIndex === questions.length - 1;

        socket.emit(
          "submitAnswerRoom",
          {
            userId,
            roomId: room._id,
            questionId,
            answerId,
            clientTimestamp: new Date().toISOString(),
            isLastQuestion: false,
          },
          (response: SubmissionResponse) => {
            if (response.success) {
              console.log("Answer submitted successfully:", response);

              // Cập nhật state từ response
              if (response.data) {
                const { progress, answered } = response.data;

                // Cập nhật progress
                setProgress(progress);

                // Cập nhật answeredQuestions
                setAnsweredQuestions(answered || []);

                // Cập nhật remainingQuestions
                if (response.data.remaining) {
                  setRemainingQuestions(response.data.remaining);
                }
              }
            } else {
              console.error("Failed to submit answer:", response.message);
            }
          }
        );
      } catch (error) {
        console.error("Error submitting answer:", error);
      }

      // Add haptic feedback effect
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    },
    [code, socket, room?._id, userId, questions, currentQuestionIndex]
  );

  // Add effect to handle questionsUpdate socket event
  useEffect(() => {
    if (!socket) return;

    socket.on("questionsUpdate", (data) => {
      console.log("Received questions update:", data);

      if (data.remaining) {
        setQuestions(data.remaining);
      }

      if (data.answered) {
        setAnsweredQuestions(data.answered);
      }

      if (data.progress) {
        setProgress(data.progress);
      }

      // Lưu state vào localStorage
      localStorage.setItem(
        `quiz_progress_${code}`,
        JSON.stringify(data.progress)
      );
      localStorage.setItem(
        `quiz_answers_${code}`,
        JSON.stringify(
          data.answered.reduce((acc: any, curr: any) => {
            acc[curr.questionId] = curr.answerId;
            return acc;
          }, {})
        )
      );
    });

    return () => {
      socket.off("questionsUpdate");
    };
  }, [socket, code]);

  // Add effect to restore state from localStorage on reload
  useEffect(() => {
    const savedProgress = localStorage.getItem(`quiz_progress_${code}`);
    if (savedProgress) {
      try {
        setProgress(JSON.parse(savedProgress));
      } catch (e) {
        console.error("Error parsing saved progress:", e);
      }
    }
  }, [code]);

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setDirection(1);
      setAnimateQuestion(false);

      // Gửi submission cho câu hỏi hiện tại trước khi chuyển câu
      const currentQuestion = questions[currentQuestionIndex];
      const currentAnswerId = selectedAnswers[currentQuestion._id];

      if (currentAnswerId && socket && room?._id) {
        socket.emit(
          "submitAnswerRoom",
          {
            userId,
            roomId: room._id,
            questionId: currentQuestion._id,
            answerId: currentAnswerId,
            clientTimestamp: new Date().toISOString(),
            isLastQuestion: false,
          },
          (response: SubmissionResponse) => {
            if (response.success) {
              console.log(
                "Answer submitted before moving to next question:",
                response
              );
            } else {
              console.error("Failed to submit answer:", response.message);
            }
          }
        );
      }

      setTimeout(() => {
        const newIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(newIndex);
        localStorage.setItem(
          `quiz_current_question_${code}`,
          newIndex.toString()
        );
        setAnimateQuestion(true);
      }, 200);
    }
  }, [
    currentQuestionIndex,
    questions.length,
    code,
    selectedAnswers,
    socket,
    room?._id,
    userId,
  ]);

  const handlePreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setDirection(-1);
      setAnimateQuestion(false);

      setTimeout(() => {
        const newIndex = currentQuestionIndex - 1;
        setCurrentQuestionIndex(newIndex);
        localStorage.setItem(
          `quiz_current_question_${code}`,
          newIndex.toString()
        );
        setAnimateQuestion(true);
      }, 200);
    }
  }, [currentQuestionIndex, code]);

  const handleCopy = useCallback(
    (type: string) => {
      let textToCopy;

      if (type === "url") {
        textToCopy = "joinmyquiz.com";
        navigator.clipboard.writeText(textToCopy);
        setCopied({ ...copied, url: true });
        setTimeout(() => setCopied((prev) => ({ ...prev, url: false })), 2000);
      } else if (type === "code") {
        textToCopy = room?.roomCode || "";
        navigator.clipboard.writeText(textToCopy);
        setCopied({ ...copied, code: true });
        setTimeout(() => setCopied((prev) => ({ ...prev, code: false })), 2000);
      }
    },
    [copied, room]
  );

  const handleEndQuiz = useCallback(() => {
    // Kiểm tra submitted từ server thay vì local state
    if (quizResults && quizResults.answers && quizResults.answers.length > 0) {
      alert("Bạn đã nộp bài thi này rồi!");
      return;
    }
    setShowConfirmModal(true);
  }, [quizResults]);

  const handleCancel = useCallback(() => {
    setShowConfirmModal(false);
  }, []);

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    if (!questions.length) return 0;
    const answeredCount = Object.keys(selectedAnswers).length;
    return Math.round((answeredCount / questions.length) * 100);
  }, [questions.length, selectedAnswers]);

  // Add function to get user info from allUsers
  const getUserInfo = useCallback(
    (userId: string) => {
      const userInfo = allUsers.find((user) => user._id === userId);
      return (
        userInfo || {
          _id: userId,
          name: "Anonymous",
          email: "",
          imageUrl: "",
        }
      );
    },
    [allUsers]
  );

  const renderQuestion = useCallback(() => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return null;

    // Calculate time progress
    const totalTime = (room?.durationMinutes || 0) * 60;
    const timeParts = endTimeRemaining.split(":").map((part) => parseInt(part));
    const remainingSeconds =
      timeParts[0] * 3600 + timeParts[1] * 60 + (timeParts[2] || 0);
    const progressPercent = (remainingSeconds / totalTime) * 100;

    // Time is running low warning (under 20%)
    const isTimeRunningLow = progressPercent < 20;

    return (
      <div className="relative z-10 w-full min-h-screen box-shadow bg-gray-900 p-6">
        <header className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <div
              ref={progressRef}
              className={`w-full h-3 bg-gray-800 rounded-full overflow-hidden progress-bar relative ${
                isTimeRunningLow ? "urgent" : ""
              }`}
            >
              <div
                className="h-full transition-width duration-1000 ease-out"
                style={{
                  width: `${progressPercent}%`,
                  background: `linear-gradient(90deg, ${
                    isTimeRunningLow ? "#FF0000" : "#FFA500"
                  } 0%, ${isTimeRunningLow ? "#FF5722" : "#FF0000"} 100%)`,
                }}
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>

          <div className="flex justify-between items-center text-xl text-background">
            <span className="font-medium flex items-center">
              <motion.span
                key={currentQuestionIndex}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {`Câu hỏi ${currentQuestionIndex + 1}/${questions.length}`}
              </motion.span>
              <span className="ml-4 px-3 py-1 bg-gray-800 rounded-full text-sm">
                {`Hoàn thành: ${completionPercentage}%`}
              </span>
            </span>

            <span
              className={`font-medium text-orange flex items-center gap-2 ${
                isTimeRunningLow ? "animate-pulse" : ""
              }`}
            >
              <HugeiconsIcon icon={ClockIcon} size={20} />
              <motion.span
                key={endTimeRemaining}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {`Thời gian còn lại: ${endTimeRemaining}`}
              </motion.span>
            </span>
          </div>
        </header>

        <main className="w-full grid grid-rows-5 gap-6 pb-10">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentQuestionIndex}
              custom={direction}
              variants={questionVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="h-80 flex justify-center row-span-2 items-center overflow-auto py-4 px-16 text-center bg-gray-900 rounded-lg shadow-inner"
            >
              <pre className="text-orange text-2xl font-bold whitespace-pre-wrap">
                {currentQ?.questionText || "Loading question..."}
              </pre>
            </motion.div>
          </AnimatePresence>

          {/* Answer options */}
          <div className="flex flex-col mt-2 mb-5 row-span-3">
            <div className="grid grid-cols-4 gap-3 h-full mt-2 mb-5">
              {(currentQ?.answers || []).map((option: any, index: number) => {
                const isSelected =
                  selectedAnswers[currentQ._id || ""] === option._id;
                const cardColors = [
                  { bg: "mediumturquoise", accent: "lightblue" },
                  { bg: "#9c27b0", accent: "#ce93d8" },
                  { bg: "#ff9800", accent: "#ffcc80" },
                  { bg: "#4caf50", accent: "#a5d6a7" },
                ];

                return (
                  <motion.button
                    key={option._id}
                    custom={index}
                    variants={answerVariants}
                    initial="hidden"
                    animate={animateQuestion ? "visible" : "hidden"}
                    whileHover="hover"
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      handleAnswerSelect(currentQ._id || "", option._id)
                    }
                    className={`answer-card relative overflow-hidden ${
                      isSelected ? "selected" : ""
                    }`}
                    style={{
                      background: cardColors[index % cardColors.length].bg,
                    }}
                  >
                    <style>
                      {`.answer-card:nth-child(${index + 1})::before, 
                         .answer-card:nth-child(${index + 1})::after {
                          background-color: ${
                            cardColors[index % cardColors.length].accent
                          };
                         }
                        `}
                    </style>
                    <span className="answer-card-content">{option.text}</span>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="absolute top-2 right-2 bg-white bg-opacity-20 p-1 rounded-full"
                      >
                        <HugeiconsIcon
                          icon={CheckmarkCircleIcon}
                          size={20}
                          color="white"
                        />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              <motion.button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ${
                  currentQuestionIndex === 0
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-orange text-darkblue hover:bg-amber-500 transition-colors"
                }`}
              >
                <HugeiconsIcon icon={ArrowLeftIcon} size={20} />
                <span>Câu trước</span>
              </motion.button>

              <motion.button
                onClick={handleEndQuiz}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 rounded-lg font-semibold bg-red-500 text-white flex items-center gap-2 hover:bg-red-600 transition-colors"
              >
                <HugeiconsIcon icon={Logout02Icon} size={20} />
                <span>Kết thúc bài thi</span>
              </motion.button>

              <motion.button
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === questions.length - 1}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ${
                  currentQuestionIndex === questions.length - 1
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-orange text-darkblue hover:bg-amber-500 transition-colors"
                }`}
              >
                <span>Câu tiếp</span>
                <HugeiconsIcon icon={ArrowRightIcon} size={20} />
              </motion.button>
            </div>
          </div>
        </main>
      </div>
    );
  }, [
    questions,
    currentQuestionIndex,
    selectedAnswers,
    endTimeRemaining,
    room?.durationMinutes,
    completionPercentage,
    handleAnswerSelect,
    handlePreviousQuestion,
    handleNextQuestion,
    handleEndQuiz,
    direction,
    animateQuestion,
  ]);

  // Enhanced CSS styles with better animations
  const styles = `
    .answer-card {
      position: relative;
      padding: 1.5rem;
      border-radius: 0.5rem;
      color: white;
      font-weight: 600;
      text-align: center;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      cursor: pointer;
      border: none;
      outline: none;
      transform-origin: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100px;
    }

    .answer-card:hover {
      transform: translateY(-5px) scale(1.02);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    }

    .answer-card.selected {
      transform: scale(0.98);
      box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.2);
      border: 2px solid white;
    }

    .answer-card::before,
    .answer-card::after {
      content: '';
      position: absolute;
      width: 150%;
      height: 150%;
      top: -25%;
      left: -25%;
      background-image: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
      opacity: 0;
      transition: opacity 0.6s ease, transform 0.6s ease;
      transform: scale(0.5);
      pointer-events: none;
      z-index: 0;
    }

    .answer-card:hover::before {
      opacity: 0.4;
      transform: scale(1) rotate(-15deg);
    }

    .answer-card:hover::after {
      opacity: 0.2;
      transform: scale(1.2) rotate(25deg);
    }

    .answer-card-content {
      position: relative;
      z-index: 1;
      font-size: 1.1rem;
      line-height: 1.5;
      pointer-events: none;
    }

    .progress-bar {
      position: relative;
      overflow: hidden;
      border-radius: 9999px;
      background-color: rgba(31, 41, 55, 0.5);
    }

    .progress-bar.urgent {
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.7; }
      100% { opacity: 1; }
    }

    .transition-width {
      transition-property: width;
    }

    @keyframes cardAppear {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes cardHover {
      0% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
      100% { transform: translateY(-4px); }
    }

    @keyframes cardSelect {
      0% { transform: scale(1); }
      40% { transform: scale(0.92); }
      100% { transform: scale(0.98); }
    }

    .modal-overlay-animate {
      animation: fadeIn 0.3s ease-out;
    }

    .modal-animate {
      animation: slideUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { 
        opacity: 0;
        transform: translateY(30px);
      }
      to { 
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Confetti animation for submission */
    .confetti {
      position: fixed;
      width: 10px;
      height: 10px;
      background-color: #f00;
      border-radius: 50%;
      top: -10px;
      z-index: 999;
      animation: confetti-fall 3s linear infinite;
    }
    
    @keyframes confetti-fall {
      0% {
        transform: translateY(0) rotate(0deg);
        opacity: 1;
      }
      100% {
        transform: translateY(100vh) rotate(720deg);
        opacity: 0;
      }
    }

    .copy-feedback {
      position: absolute;
      top: -35px;
      left: 50%;
      transform: translateX(-50%);
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 14px;
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
    
    .copy-feedback.visible {
      opacity: 1;
    }
    
    .participant-card {
      transition: all 0.3s ease;
    }
    
    .participant-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
    }
    
    .participant-image {
      transition: transform 0.3s ease;
    }
    
    .participant-card:hover .participant-image {
      transform: scale(1.08);
    }
    
    .submission-success {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: rgba(0, 0, 0, 0.9);
      z-index: 100;
      color: white;
    }
    
    .checkmark {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: block;
      stroke-width: 2;
      stroke: #4bb71b;
      stroke-miterlimit: 10;
      box-shadow: inset 0px 0px 0px #4bb71b;
      animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
      position: relative;
      margin: 0 auto 35px;
    }
    
    .checkmark__circle {
      stroke-dasharray: 166;
      stroke-dashoffset: 166;
      stroke-width: 2;
      stroke-miterlimit: 10;
      stroke: #4bb71b;
      fill: none;
      animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
    }
    
    .checkmark__check {
      transform-origin: 50% 50%;
      stroke-dasharray: 48;
      stroke-dashoffset: 48;
      animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
    }
    
    @keyframes stroke {
      100% {
        stroke-dashoffset: 0;
      }
    }
    
    @keyframes scale {
      0%, 100% {
        transform: none;
      }
      50% {
        transform: scale3d(1.1, 1.1, 1);
      }
    }
    
    @keyframes fill {
      100% {
        box-shadow: inset 0px 0px 0px 30px #4bb71b;
      }
    }

    .answer-feedback {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 20px 40px;
      border-radius: 10px;
      font-size: 24px;
      font-weight: bold;
      color: white;
      z-index: 1000;
      animation: feedbackPop 0.5s ease-out;
    }

    .answer-feedback.correct {
      background-color: #4CAF50;
    }

    .answer-feedback.incorrect {
      background-color: #F44336;
    }

    @keyframes feedbackPop {
      0% {
        transform: translate(-50%, -50%) scale(0.5);
        opacity: 0;
      }
      50% {
        transform: translate(-50%, -50%) scale(1.2);
      }
      100% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
      }
    }
  `;

  console.log("Current state:", {
    submitted,
    quizResults,
    questions,
    selectedAnswers,
  });

  // Add new useEffect for handling quiz results persistence
  useEffect(() => {
    // Check if we should show results
    const savedSubmitted = localStorage.getItem(`quiz_submitted_${code}`);
    const savedResults = localStorage.getItem(`quiz_results_${code}`);

    if (savedSubmitted === "true" && savedResults) {
      try {
        const parsedResults = JSON.parse(savedResults);
        setQuizResults(parsedResults);
        setSubmitted(true);
      } catch (e) {
        console.error("Error parsing saved results:", e);
      }
    }
  }, [code]);

  // Add effect to restore state on reload
  useEffect(() => {
    if (!room || !userId) return;

    const restoreState = async () => {
      try {
        console.log("[RESTORE] Starting state restoration");
        const token = await getToken();

        // Fetch participant status
        const response = await fetch(
          `http://localhost:5000/api/participant/status/${userId}?roomId=${room._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log("[RESTORE] Participant status:", {
            success: data.success,
            hasData: !!data.data,
            remainingQuestionsCount: data.data?.remainingQuestions?.length,
            answeredQuestionsCount: data.data?.answeredQuestions?.length,
          });

          if (data.success && data.data) {
            // Restore questions and set current question
            if (Array.isArray(data.data.remainingQuestions)) {
              const remainingQuestions = data.data.remainingQuestions;

              // Get saved index before setting questions
              const savedIndex = localStorage.getItem(
                `quiz_current_question_${code}`
              );
              const parsedIndex = savedIndex ? parseInt(savedIndex) : 0;

              console.log("[RESTORE] Found saved index:", {
                savedIndex,
                parsedIndex,
                totalQuestions: remainingQuestions.length,
              });

              // Get saved answers first
              const savedAnswers = localStorage.getItem(`quiz_answers_${code}`);
              const parsedAnswers = savedAnswers
                ? JSON.parse(savedAnswers)
                : {};

              console.log("[RESTORE] Found saved answers:", parsedAnswers);

              // Build answers map from remaining questions with submissions
              const remainingAnswers = remainingQuestions.reduce(
                (acc: Record<string, string>, q: any) => {
                  if (q.selectedAnswerId) {
                    acc[q._id] = q.selectedAnswerId;
                  }
                  return acc;
                },
                {}
              );

              // Build answers map from answered questions
              const answeredAnswers = data.data.answeredQuestions.reduce(
                (acc: Record<string, string>, aq: any) => {
                  if (aq.answerId) {
                    acc[aq.questionId] = aq.answerId;
                  }
                  return acc;
                },
                {}
              );

              console.log("[RESTORE] Server answers:", {
                remainingAnswers,
                answeredAnswers,
              });

              // Merge all answers, prioritizing server data
              const mergedAnswers = {
                ...parsedAnswers,
                ...remainingAnswers,
                ...answeredAnswers,
              };

              console.log("[RESTORE] Final merged answers:", mergedAnswers);

              // Set questions and answers
              setQuestions(remainingQuestions);
              setSelectedAnswers(mergedAnswers);

              // Save merged answers to localStorage
              localStorage.setItem(
                `quiz_answers_${code}`,
                JSON.stringify(mergedAnswers)
              );

              // Validate and set current index
              let validIndex = parsedIndex;
              if (validIndex >= remainingQuestions.length) {
                validIndex = remainingQuestions.length - 1;
              }
              if (validIndex < 0) validIndex = 0;

              console.log("[RESTORE] Setting validated index:", validIndex);

              // Set current question index
              setCurrentQuestionIndex(validIndex);

              // Update localStorage with validated index
              localStorage.setItem(
                `quiz_current_question_${code}`,
                validIndex.toString()
              );

              // Show questions if we have any
              if (remainingQuestions.length > 0) {
                setShowQuestions(true);
              }

              // Update progress if available
              if (data.data.progress) {
                setProgress(data.data.progress);
                localStorage.setItem(
                  `quiz_progress_${code}`,
                  JSON.stringify(data.data.progress)
                );
              }

              // Check completion status
              const isCompleted = data.data.isCompleted || false;
              if (isCompleted) {
                setSubmitted(true);
                localStorage.setItem(`quiz_submitted_${code}`, "true");
              } else {
                setSubmitted(false);
                localStorage.removeItem(`quiz_submitted_${code}`);
              }
            }
          }
        }
      } catch (error) {
        console.error("[RESTORE] Error restoring state:", error);
      }
    };

    restoreState();
  }, [room, userId, code, getToken]);

  // Add effect to persist current question index
  useEffect(() => {
    if (currentQuestionIndex >= 0) {
      console.log(
        "[PERSIST] Saving current question index:",
        currentQuestionIndex
      );
      localStorage.setItem(
        `quiz_current_question_${code}`,
        currentQuestionIndex.toString()
      );
    }
  }, [currentQuestionIndex, code]);

  // Modal for confirming quiz submission
  const confirmModal = (
    <AnimatePresence>
      {showConfirmModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 modal-overlay-animate"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 15 }}
            className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl modal-animate"
          >
            <h3 className="text-2xl font-bold text-orange mb-4 text-center">
              Xác nhận nộp bài
            </h3>
            <p className="text-background mb-6 text-center">
              Bạn có chắc chắn muốn kết thúc bài kiểm tra và nộp bài?
              {completionPercentage < 100 && (
                <span className="block mt-2 text-orange">
                  Bạn mới hoàn thành {completionPercentage}% câu hỏi!
                </span>
              )}
            </p>

            <div className="flex justify-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancel}
                className="px-6 py-3 bg-gray-600 text-background rounded-lg font-semibold hover:bg-gray-500 transition-colors"
              >
                Huỷ bỏ
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleConfirm}
                className="px-6 py-3 bg-orange text-darkblue rounded-lg font-semibold hover:bg-amber-500 transition-colors"
              >
                Xác nhận nộp bài
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (loading) {
    return <SpinnerLoading />;
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-littleblue text-background flex items-center justify-center">
        <div className="text-xl text-red-500 p-6 bg-black/30 backdrop-blur-sm rounded-lg shadow-lg">
          <div className="flex items-center justify-center mb-4">
            <svg
              className="w-12 h-12 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-center">Không thể tải dữ liệu phòng</p>
        </div>
      </div>
    );
  }

  // Hiển thị kết quả khi đã nộp bài và có kết quả
  if (
    submitted &&
    quizResults &&
    quizResults.answers &&
    quizResults.answers.length > 0
  ) {
    return (
      <QuizResults
        score={quizResults.score}
        totalQuestions={quizResults.totalQuestions}
        stats={quizResults.stats}
        answers={quizResults.answers}
        questions={
          questions.length > 0
            ? questions
            : quizResults.answers.map((answer: QuizAnswer) => ({
                _id: answer.questionId,
                questionText: answer.question,
                answers: [
                  {
                    text: answer.correctAnswer,
                    isCorrect: true,
                  },
                  {
                    text: answer.userAnswer,
                    isCorrect: answer.isCorrect,
                  },
                ],
              }))
        }
      />
    );
  }

  // Hiển thị phòng chờ khi chưa active hoặc đang scheduled
  if (room.status === "waiting" || room.status === "scheduled") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-littleblue text-background w-full">
        <main className="flex flex-col justify-center items-center">
          <style>{styles}</style>
          <div className="flex justify-end w-full py-2 px-8">
            <button
              onClick={() => navigate(-1)}
              className="flex bg-orange text-darkblue btn-hover items-center gap-2 py-2 px-3 rounded font-semibold text-lg cursor-pointer"
            >
              <p>Thoát</p>
            </button>
          </div>

          {/* Room Info Card */}
          <div className="bg-black/50 backdrop-blur-sm p-6 rounded-lg w-2/5 mb-8">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-2xl font-bold text-orange mb-2">
                  {room?.quiz?.name || "Phòng kiểm tra"}
                </h2>
                <p className="text-gray-400">
                  Giáo viên: {room?.host?.name || "Không xác định"}
                </p>
              </div>

              <button
                onClick={() => handleCopy("code")}
                className="text-darkblue font-bold btn-hover cursor-pointer flex items-center gap-2 text-sm bg-orange p-3 rounded-lg relative"
              >
                <HugeiconsIcon icon={Share08Icon} size={16} />
                <span>Mã: {room?.roomCode}</span>
                <div
                  className={`copy-feedback ${copied.code ? "visible" : ""}`}
                >
                  Đã sao chép!
                </div>
              </button>
            </div>
          </div>

          {/* Waiting Status */}
          <div className="flex flex-col items-center justify-center mb-12">
            <div className="relative w-32 h-32 mb-4">
              <div className="absolute inset-0 rounded-full bg-orange/20 animate-ping"></div>
              <div className="relative flex items-center justify-center w-full h-full rounded-full bg-orange">
                <HugeiconsIcon
                  icon={ClockIcon}
                  size={48}
                  className="text-darkblue"
                />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-orange mb-2">
              {room.status === "scheduled"
                ? "Đang chờ giáo viên bắt đầu"
                : "Đang chờ bắt đầu"}
            </h3>
            <p className="text-xl text-gray-300">{timeRemaining}</p>
          </div>

          {/* Participants Section */}
          <div className="w-full px-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-lg gap-2">
                  <div className="flex text-background border-2 border-gray-600 items-center gap-2 bg-black/50 backdrop-blur-sm p-2 px-5 rounded-lg">
                    <HugeiconsIcon icon={UserGroup03Icon} />
                    <p className="text-lg font-semibold">
                      {room?.participants?.length || 0} thí sinh
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-5">
              {room?.participants?.map((participant: any) => {
                const participantUserId =
                  typeof participant.user === "string"
                    ? participant.user
                    : participant.user?._id;
                const userInfo = getUserInfo(participantUserId);

                return (
                  <div
                    key={participant._id}
                    className="flex flex-col relative h-full items-center justify-center gap-3 bg-[#384052]/50 backdrop-blur-sm p-5 rounded-lg group transition-all duration-300 hover:bg-[#384052]/70"
                  >
                    <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center border-2 border-orange/50 transition-transform duration-300 transform group-hover:scale-110">
                      {userInfo.imageUrl ? (
                        <img
                          className="w-full h-full object-cover"
                          src={userInfo.imageUrl}
                          alt={userInfo.name || "Anonymous"}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange to-red-500 text-darkblue text-2xl font-bold">
                          {userInfo.name
                            ? userInfo.name.charAt(0).toUpperCase()
                            : "?"}
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-orange group-hover:text-white transition-colors duration-300">
                        {userInfo.name || "Anonymous"}
                      </p>
                      <p className="text-sm text-gray-400">Thí sinh</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Hiển thị giao diện làm bài khi phòng active
  if (room.status === "active") {
    // Hiển thị loading khi đang tải câu hỏi
    if (questions.length === 0) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-littleblue text-background flex items-center justify-center">
          <div className="text-xl text-yellow-500 p-6 bg-black/30 backdrop-blur-sm rounded-lg shadow-lg">
            <div className="flex items-center justify-center mb-4">
              <svg
                className="w-12 h-12 text-yellow-500 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <p className="text-center">Đang tải câu hỏi...</p>
          </div>
        </div>
      );
    }

    // Render giao diện làm bài khi đã có câu hỏi
    return (
      <div className="relative">
        <style>{styles}</style>
        {renderQuestion()}
        {confirmModal}
      </div>
    );
  }

  // Fallback UI cho trạng thái không xác định
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-littleblue text-background flex items-center justify-center">
      <div className="text-xl text-yellow-500 p-6 bg-black/30 backdrop-blur-sm rounded-lg shadow-lg">
        <div className="flex items-center justify-center mb-4">
          <svg
            className="w-12 h-12 text-yellow-500 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <p className="text-center">Đang xử lý...</p>
        <p className="text-sm text-gray-400 mt-2 text-center">
          Trạng thái phòng: {room.status}
        </p>
      </div>
    </div>
  );
}
