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

interface SubmissionResponse {
  success: boolean;
  data?: {
    remaining: Question[];
    answered: Array<{
      questionId: string;
      answerId: string;
    }>;
    progress: {
      answered: number;
      total: number;
      score: number;
    };
    currentQuestion: Question | null;
    lastSubmission: {
      questionId: string;
      isCorrect: boolean;
      score: number;
    };
  };
  message?: string;
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
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [remainingQuestions, setRemainingQuestions] = useState([]);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [progress, setProgress] = useState({ answered: 0, total: 0 });
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

        console.log("Attempting to join room with data:", {
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

          console.log("Emitting joinRoom event with data:", joinData);

          socket.emit("joinRoom", joinData, async (response: any) => {
            console.log("Received joinRoom response:", response);

            if (!response.success) {
              console.error("Join room failed:", response.message);
              reject(new Error(response.message || "Failed to join room"));
              return;
            }

            try {
              // If we have questions from the response, use them
              if (
                response.remainingQuestions &&
                response.remainingQuestions.length > 0
              ) {
                console.log("Using questions from socket response:", {
                  count: response.remainingQuestions.length,
                });
                setQuestions(response.remainingQuestions);
                setShowQuestions(true);
              }

              // Refresh room data after joining
              const token = await getToken();
              const updatedResponse = await fetch(
                `http://localhost:5000/api/quizRoom/code/${roomData.roomCode}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                }
              );
              const updatedData = await updatedResponse.json();
              if (updatedData.success) {
                console.log("Room data updated after join:", updatedData.data);
                resolve(updatedData.data);
              } else {
                console.error(
                  "Failed to get updated room data:",
                  updatedData.message
                );
                reject(
                  new Error(
                    updatedData.message || "Failed to get updated room data"
                  )
                );
              }
            } catch (error) {
              console.error("Error in join room callback:", error);
              reject(error);
            }
          });
        });
      } catch (error) {
        console.error("Error in handleJoinRoom:", error);
        throw error;
      }
    },
    [socket, userId, getToken, user]
  );

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

        // Set room data
        setRoom(data.data);

        // Then fetch all users
        console.log("Fetching all users after room data...");
        await fetchAllUsers();

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
            console.log("Received participant data:", participantData);

            if (participantData.success && participantData.data) {
              console.log("Setting questions from existing participant:", {
                questionCount: participantData.data.remainingQuestions?.length,
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
        } else {
          // Join room as a new participant
          console.log("Joining room as new participant...");
          const joinResponse = await handleJoinRoom(data.data);
          console.log("Join room response:", joinResponse);
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
  }, [code, getToken, user, userId, fetchAllUsers, handleJoinRoom]);

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
      if (submitted) {
        return;
      }

      if (!socket || !room || !userId || !user) {
        throw new Error(
          "Không thể kết nối đến server hoặc không tìm thấy thông tin người dùng"
        );
      }

      // Calculate start time and time spent
      const startTime = new Date(room.startTime);
      const endTime = new Date();
      const timeSpentSeconds = Math.floor(
        (endTime.getTime() - startTime.getTime()) / 1000
      );

      // Calculate results before submitting
      const answersArray = questions.map((question) => {
        const userAnswerId = selectedAnswers[question._id] || "";
        const selectedAnswer = question.answers.find(
          (a) => a._id === userAnswerId
        );
        const correctAnswer = question.answers.find((a) => a.isCorrect);
        const isCorrect = selectedAnswer?._id === correctAnswer?._id;

        return {
          questionId: question._id,
          userAnswer: selectedAnswer?.text || "",
          correctAnswer: correctAnswer?.text || "",
          isCorrect: isCorrect,
          question: question.questionText,
        };
      });

      const correctAnswers = answersArray.filter(
        (answer) => answer.isCorrect
      ).length;
      const incorrectAnswers = answersArray.length - correctAnswers;
      const correctPercentage = Math.round(
        (correctAnswers / questions.length) * 100
      );

      // Prepare consistent result format for both immediate display and database
      const results = {
        participantId: userId,
        quizRoom: {
          _id: room._id,
          name: room.quiz?.name || "Bài thi không tên",
          roomCode: room.roomCode,
          startTime: room.startTime,
          durationMinutes: room.durationMinutes,
          status: room.status,
          quiz: {
            _id: room.examSetId,
            name: room.quiz?.name || "Bài thi không tên",
            topic: room.quiz?.topic || "Chưa phân loại",
            difficulty: room.quiz?.difficulty || "medium",
          },
        },
        score: correctAnswers,
        totalQuestions: questions.length,
        joinedAt: startTime.toISOString(),
        stats: {
          totalQuestions: questions.length,
          correctAnswers: correctAnswers,
          incorrectAnswers: incorrectAnswers,
          correctPercentage: correctPercentage,
          timeSpent: timeSpentSeconds,
        },
        answers: answersArray,
      };

      // Set quiz results for immediate display
      setQuizResults(results);
      setSubmitted(true);

      // First, save participation result with all answers at once
      const token = await getToken();
      const participationPayload = {
        roomId: room._id,
        userId: userId,
        score: correctAnswers,
        answers: answersArray,
        stats: results.stats,
        quizId: room.quiz._id,
        type: room.quiz.isExam ? "exam" : "quiz",
      };

      console.log("Sending participation data:", participationPayload);

      const participationResponse = await fetch(
        "http://localhost:5000/api/submission/participation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(participationPayload),
        }
      );

      if (!participationResponse.ok) {
        const errorData = await participationResponse.json();
        console.error("Participation save error:", errorData);
        throw new Error(errorData.message || "Không thể lưu kết quả tham gia");
      }

      const participationData = await participationResponse.json();
      console.log("Participation save success:", participationData);

      // Then, save to quiz results
      const quizResultsPayload = {
        quizId: room.quiz._id,
        userAnswers: answersArray.map((answer) => ({
          questionId: answer.questionId,
          userAnswer: answer.userAnswer,
          isCorrect: answer.isCorrect,
          score: 1,
        })),
        score: correctAnswers,
        userId: userId,
        username: user?.fullName || "Anonymous",
        totalScore: questions.length,
        deviceId: `${navigator.userAgent}_${new Date().getTime()}`,
        type: room.quiz.isExam ? "exam" : "quiz",
        metadata: {
          roomId: room._id,
          roomCode: room.roomCode,
          startTime: room.startTime,
          endTime: new Date().toISOString(),
          durationMinutes: room.durationMinutes,
          isExam: room.quiz.isExam,
        },
      };

      console.log(
        "Quiz results payload:",
        JSON.stringify(quizResultsPayload, null, 2)
      );

      const resultResponse = await fetch(
        "http://localhost:5000/api/quiz/results",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(quizResultsPayload),
        }
      );

      if (!resultResponse.ok) {
        const errorData = await resultResponse.json();
        console.error("Quiz results save error details:", errorData);
        throw new Error(errorData.message || "Không thể lưu kết quả bài thi");
      }

      const resultData = await resultResponse.json();
      console.log("Quiz results save success:", resultData);

      // Clear saved answers and current question
      localStorage.removeItem(`quiz_answers_${code}`);
      localStorage.removeItem(`quiz_current_question_${code}`);

      // Save submission state and results
      localStorage.setItem(`quiz_submitted_${code}`, "true");
      localStorage.setItem(`quiz_results_${code}`, JSON.stringify(results));

      // Leave room
      socket.emit("leaveRoom", {
        roomId: room._id,
        participantId: userId,
      });

      setShowConfirmModal(false);
    } catch (error) {
      console.error("Error submitting answers:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi nộp bài. Vui lòng thử lại."
      );
      setShowConfirmModal(false);
    }
  }, [
    room,
    selectedAnswers,
    userId,
    user,
    socket,
    questions,
    code,
    submitted,
    getToken,
  ]);

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
        // Auto submit when time runs out
        if (!submitted) {
          // Prevent multiple submissions
          setSubmitted(true);
          handleConfirm();
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
  }, [room, submitted, handleConfirm]);

  // Add new effect to handle auto-submit
  useEffect(() => {
    if (room?.status === "active" && !submitted && room.startTime) {
      const endTime =
        new Date(room.startTime).getTime() + room.durationMinutes * 60 * 1000;
      const now = new Date().getTime();
      const timeUntilEnd = endTime - now;

      if (timeUntilEnd > 0) {
        const timeoutId = setTimeout(() => {
          if (!submitted) {
            // Prevent multiple submissions
            setSubmitted(true);
            handleConfirm();
          }
        }, timeUntilEnd);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [room, submitted, handleConfirm]);

  useEffect(() => {
    if (room?.status === "scheduled" || room?.status === "active") {
      calculateTimeRemaining();
      timerRef.current = setInterval(calculateTimeRemaining, 1000);
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [room?.status, calculateTimeRemaining]);

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

    // Join the room's socket channel
    socket.emit("joinUserRoomManager", room._id);

    return () => {
      socket.off("participantJoined");
      socket.off("participantLeft");
    };
  }, [socket, room, code, getToken, fetchAllUsers]);

  // Update room status effect to handle questions
  useEffect(() => {
    if (room?.status === "active") {
      setShowQuestions(true);
    }
  }, [room?.status]);

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

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setDirection(1);
      setAnimateQuestion(false);

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
  }, [currentQuestionIndex, questions.length, code]);

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

  const handleAnswerSelect = useCallback(
    (questionId: string, answerId: string) => {
      if (!questionId || !socket || !room?._id) return;

      setSelectedAnswers((prev: any) => {
        const newAnswers = {
          ...prev,
          [questionId]: answerId,
        };

        // Save to localStorage
        localStorage.setItem(
          `quiz_answers_${code}`,
          JSON.stringify(newAnswers)
        );

        // Remove socket emit for immediate submission
        // Just store the answer locally until final submission
        return newAnswers;
      });

      // Add haptic feedback effect
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    },
    [code, socket, room?._id]
  );

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
    if (submitted) {
      alert("Bạn đã nộp bài thi này rồi!");
      return;
    }
    setShowConfirmModal(true);
  }, [submitted]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-littleblue text-background flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-orange border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-xl">Đang tải dữ liệu phòng...</div>
        </div>
      </div>
    );
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

  if (submitted && quizResults) {
    return (
      <QuizResults
        score={quizResults.score}
        totalQuestions={quizResults.totalQuestions}
        stats={quizResults.stats}
        answers={quizResults.answers}
        questions={questions.map((q) => ({
          _id: q._id || "",
          questionText: q.questionText,
          answers: q.answers,
        }))}
      />
    );
  }

  if (!showQuestions || room.status === "waiting") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-littleblue text-background w-full">
        <main className="flex flex-col justify-center items-center">
          <style>{styles}</style>
          <div className="flex justify-end w-full py-2 px-8">
            <div className="flex bg-orange text-darkblue btn-hover items-center gap-2 py-2 px-3 rounded font-semibold text-lg cursor-pointer">
              <p>Thoát</p>
            </div>
          </div>
          <div className="bg-black/50 backdrop-blur-sm p-6 rounded-lg w-2/5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xl font-semibold">
                {room?.quiz?.name || "Phòng kiểm tra"}
              </p>

              <p className="text-darkblue font-bold btn-hover cursor-pointer flex items-center gap-2 text-sm bg-orange  p-2 rounded-lg">
                <HugeiconsIcon icon={Share08Icon} size={16} />
                <span>Chia sẻ</span>
              </p>
            </div>
            <div className="flex items-center justify-between gap-5 mt-5">
              <div className="flex w-full flex-col gap-2">
                <p className="text-md font-semibold">
                  1. Sử dụng bất kỳ thiết bị nào để mở
                </p>
                <div className="flex items-center justify-between bg-rgba py-2 pl-4 pr-2 rounded-lg gap-2">
                  <p className="text-2xl font-semibold">joinmyquiz.com</p>
                  <div
                    onClick={() => handleCopy("url")}
                    className="flex items-center gap-2 bg-orange cursor-pointer btn-hover p-5 rounded-lg"
                  >
                    <HugeiconsIcon icon={Copy01Icon} />
                    <div
                      className={`copy-feedback ${
                        copied.code ? "visible" : ""
                      }`}
                    >
                      Đã sao chép!
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex w-full flex-col gap-2">
                <p className="text-md font-semibold">2. Nhập mã để tham gia</p>
                <div className="flex items-center justify-between bg-rgba py-2 pl-4 pr-2 rounded-lg gap-2">
                  <p className="text-5xl tracking-widest font-semibold">
                    {room?.roomCode}
                  </p>
                  <div
                    onClick={() => handleCopy("code")}
                    className="flex items-center gap-2 bg-orange cursor-pointer btn-hover p-5 rounded-lg"
                  >
                    <HugeiconsIcon icon={Copy01Icon} />
                    <div
                      className={`copy-feedback ${
                        copied.code ? "visible" : ""
                      }`}
                    >
                      Đã sao chép!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full my-16">
            <div className="flex relative items-center justify-center border-b-1 border-gray-800">
              <div className="flex absolute left-5 items-center justify-center rounded-lg gap-2">
                <div className="flex text-background border-2 border-gray-600 items-center gap-2 bg-black/50 backdrop-blur-sm cursor-pointer btn-hover p-2 px-5 rounded-lg">
                  <HugeiconsIcon icon={UserGroup03Icon} />
                  <p className="text-lg font-semibold">
                    {room?.participants?.length || 0}
                  </p>
                </div>
              </div>
              <div className="flex absolute items-center justify-center rounded-lg gap-2">
                <div
                  className={`button-30 text-darkblue rounded-lg bg-orange px-10 py-5 
                    animate-pulse-scale
                  `}
                >
                  <p className="text-xl font-semibold ">
                    <span className="text-xl font-medium">{timeRemaining}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className=" items-center justify-center mt-20 grid grid-cols-5 gap-5 mx-8">
              {room?.participants?.map((participant: any) => {
                // Get user ID from participant
                const participantUserId =
                  typeof participant.user === "string"
                    ? participant.user
                    : participant.user?._id;

                // Get full user info from allUsers
                const userInfo = getUserInfo(participantUserId);

                return (
                  <div
                    key={participant._id}
                    className="flex flex-col relative h-full items-center justify-center gap-3 bg-[#384052]/50 backdrop-blur-sm p-5 rounded-lg group transition-all duration-300 hover:bg-[#384052]/70"
                  >
                    <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center border-2 border-orange/50">
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
                      <p className="text-lg font-semibold text-orange">
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

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-littleblue text-background flex items-center justify-center">
        <div className="text-xl text-yellow-500 p-6 bg-black/30 backdrop-blur-sm rounded-lg shadow-lg">
          <div className="flex items-center justify-center mb-4">
            <svg
              className="w-12 h-12 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-center">Đang chờ câu hỏi từ giáo viên...</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="relative">
      <style>{styles}</style>
      {renderQuestion()}
      {confirmModal}
    </div>
  );
}
