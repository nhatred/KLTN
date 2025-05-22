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
  ChampionIcon,
  Chart02Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Backward01Icon,
} from "@hugeicons/core-free-icons";
import "../style/button.css";
import { useParams, useNavigate } from "react-router";
import { Room } from "../types/Room";
import { useAuth } from "@clerk/clerk-react";
import { Question } from "../types/Question";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";

interface ServerResponse {
  success: boolean;
  message?: string;
  data?: any;
}

interface SocketResponse {
  success: boolean;
  questionId: string;
  answer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export default function JoinRoomForStudent() {
  const { code } = useParams();
  const { getToken, userId } = useAuth();
  const navigate = useNavigate();
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
  const [quizResults, setQuizResults] = useState<{
    score: number;
    stats: {
      totalQuestions: number;
      correctAnswers: number;
      incorrectAnswers: number;
      correctPercentage: number;
    };
    answers: Array<{
      questionId: string;
      userAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
    }>;
  } | null>(() => {
    const savedResults = localStorage.getItem(`quiz_results_${code}`);
    return savedResults ? JSON.parse(savedResults) : null;
  });

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

  const getRoom = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();

      // Check if quiz was already submitted
      const isSubmitted =
        localStorage.getItem(`quiz_submitted_${code}`) === "true";
      if (isSubmitted) {
        setSubmitted(true);
        const savedResults = localStorage.getItem(`quiz_results_${code}`);
        if (savedResults) {
          setQuizResults(JSON.parse(savedResults));
        }
        setLoading(false);
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/quizRoom/code/${code}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        console.log("Room data received:", {
          room: data.data,
          participants: data.data.participants,
          participantsDetails: data.data.participants.map((p: any) => ({
            id: p._id,
            user: p.user,
            name: p?.user?.name,
            imageUrl: p?.user?.imageUrl,
          })),
        });
        setRoom(data.data);
        if (data.data.quiz?._id) {
          const quizResponse = await fetch(
            `http://localhost:5000/api/quiz/${data.data.quiz._id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          const quizData = await quizResponse.json();
          if (quizData.success && quizData.data.questions) {
            setQuestions(quizData.data.questions);
          }
        }
      } else {
        throw new Error(data.message || "Không thể tải dữ liệu phòng");
      }
    } catch (err) {
      console.error("Error fetching room:", err);
    } finally {
      setLoading(false);
    }
  }, [code, getToken]);

  const handleConfirm = useCallback(async () => {
    try {
      if (submitted) {
        return; // Just return if already submitted
      }

      if (!socket || !room || !userId) {
        throw new Error(
          "Không thể kết nối đến server hoặc không tìm thấy thông tin người dùng"
        );
      }

      console.log("Room data:", room); // Debug log
      console.log("User ID:", userId); // Debug log
      console.log("Participants:", room.participants); // Debug log

      // Find the current user's participant record
      const currentParticipant = room.participants?.find(
        (p) => p.user?._id === userId
      );

      if (!currentParticipant) {
        // Try to join room first to get participant info
        const joinResponse = await new Promise<ServerResponse>(
          (resolve, reject) => {
            socket.emit(
              "joinRoom",
              {
                userId,
                roomId: room._id,
                roomCode: room.roomCode,
              },
              (response: ServerResponse) => {
                if (response.success) {
                  resolve(response);
                } else {
                  reject(
                    new Error(
                      response.message || "Không thể tham gia phòng thi"
                    )
                  );
                }
              }
            );
          }
        );

        // After joining, try to get participant info again
        const participantResponse = await new Promise<ServerResponse>(
          (resolve, reject) => {
            socket.emit(
              "getParticipantInfo",
              {
                userId,
                roomId: room._id,
              },
              (response: ServerResponse) => {
                if (response.success && response.data) {
                  resolve(response);
                } else {
                  reject(
                    new Error(
                      response.message ||
                        "Không thể lấy thông tin người tham gia"
                    )
                  );
                }
              }
            );
          }
        );

        if (!participantResponse.data) {
          throw new Error("Không thể lấy thông tin người tham gia");
        }

        // Update room data with new participant info
        const updatedRoom = {
          ...room,
          participants: [
            ...(room.participants || []),
            participantResponse.data,
          ],
        };
        setRoom(updatedRoom);

        // Use the new participant info
        const newParticipant = participantResponse.data;
        if (!newParticipant || !newParticipant._id) {
          throw new Error("Thông tin người tham gia không hợp lệ");
        }

        // Submit answers with new participant info
        const submissions = await Promise.all(
          Object.entries(selectedAnswers).map(([questionId, answer]) => {
            return new Promise<SocketResponse>((resolve, reject) => {
              const submitWithRetry = async (retryCount = 0) => {
                try {
                  socket.emit(
                    "submitAnswer",
                    {
                      participantId: newParticipant._id,
                      questionId,
                      answer,
                      roomId: room._id,
                      roomCode: room.roomCode,
                      clientTimestamp: new Date().toISOString(),
                    },
                    (response: ServerResponse) => {
                      if (response.success) {
                        const question = questions.find(
                          (q) => q._id === questionId
                        );
                        const correctAnswer =
                          question?.answers.find((a) => a.isCorrect)?.text ||
                          "Không xác định";
                        resolve({
                          success: true,
                          questionId,
                          answer,
                          correctAnswer,
                          isCorrect: answer === correctAnswer,
                        });
                      } else if (
                        response.message?.includes("version") &&
                        retryCount < 3
                      ) {
                        setTimeout(() => submitWithRetry(retryCount + 1), 500);
                      } else {
                        reject(
                          new Error(
                            response.message || "Lỗi khi nộp câu trả lời"
                          )
                        );
                      }
                    }
                  );
                } catch (error) {
                  if (retryCount < 3) {
                    setTimeout(() => submitWithRetry(retryCount + 1), 500);
                  } else {
                    reject(error);
                  }
                }
              };

              submitWithRetry();
            });
          })
        );

        // Calculate and set results
        const results = {
          score: submissions.reduce(
            (total: number, sub: any) => total + (sub.isCorrect ? 1 : 0),
            0
          ),
          stats: {
            totalQuestions: Object.keys(selectedAnswers).length,
            correctAnswers: submissions.filter((sub: any) => sub.isCorrect)
              .length,
            incorrectAnswers: submissions.filter((sub: any) => !sub.isCorrect)
              .length,
            correctPercentage: Math.round(
              (submissions.filter((sub: any) => sub.isCorrect).length /
                Object.keys(selectedAnswers).length) *
                100
            ),
          },
          answers: submissions.map((sub: any) => ({
            questionId: sub.questionId,
            userAnswer: sub.answer,
            correctAnswer: sub.correctAnswer,
            isCorrect: sub.isCorrect,
          })),
        };

        // Save results to database
        try {
          const token = await getToken();
          const response = await fetch(
            "http://localhost:5000/api/quiz/results",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                quizId: room.quiz._id,
                userAnswers: results.answers.map((answer) => ({
                  questionId: answer.questionId,
                  userAnswer: answer.userAnswer,
                  correctAnswer: answer.correctAnswer,
                  isCorrect: Boolean(answer.isCorrect),
                })),
                score: results.score,
                userId: userId,
                username: currentParticipant?.user?.name || "Anonymous",
                totalScore: Object.keys(selectedAnswers).length,
                deviceId: newParticipant._id,
                stats: {
                  totalQuestions: results.stats.totalQuestions,
                  correctAnswers: results.stats.correctAnswers,
                  incorrectAnswers: results.stats.incorrectAnswers,
                  correctPercentage: results.stats.correctPercentage,
                },
              }),
            }
          );

          const data = await response.json();
          if (!data.success) {
            console.error("Failed to save quiz results:", data.message);
          } else {
            console.log("Quiz results saved successfully");
          }
        } catch (error) {
          console.error("Error saving quiz results:", error);
        }

        setQuizResults(results);
        setSubmitted(true);
        setShowConfirmModal(false);

        // Clear saved answers and current question
        localStorage.removeItem(`quiz_answers_${code}`);
        localStorage.removeItem(`quiz_current_question_${code}`);

        // Save submission state and results
        localStorage.setItem(`quiz_submitted_${code}`, "true");
        localStorage.setItem(`quiz_results_${code}`, JSON.stringify(results));
      } else {
        console.log("Found participant:", currentParticipant); // Debug log

        // Join room with existing participant
        await new Promise<void>((resolve, reject) => {
          socket.emit(
            "joinRoom",
            {
              participantId: currentParticipant._id,
              roomId: room._id,
              roomCode: room.roomCode,
            },
            (response: ServerResponse) => {
              console.log("Join room response:", response); // Debug log
              if (response.success) {
                resolve();
              } else {
                reject(
                  new Error(response.message || "Không thể tham gia phòng thi")
                );
              }
            }
          );
        });

        // Submit answers
        const submissions = await Promise.all(
          Object.entries(selectedAnswers).map(([questionId, answer]) => {
            return new Promise<SocketResponse>((resolve, reject) => {
              const submitWithRetry = async (retryCount = 0) => {
                try {
                  console.log(
                    "Submitting answer for question:",
                    questionId,
                    "answer:",
                    answer,
                    "retry:",
                    retryCount
                  ); // Debug log
                  socket.emit(
                    "submitAnswer",
                    {
                      participantId: currentParticipant._id,
                      questionId,
                      answer,
                      roomId: room._id,
                      roomCode: room.roomCode,
                      clientTimestamp: new Date().toISOString(),
                    },
                    (response: ServerResponse) => {
                      console.log("Server response:", response); // Debug log
                      if (response.success) {
                        const question = questions.find(
                          (q) => q._id === questionId
                        );
                        const correctAnswer =
                          question?.answers.find((a) => a.isCorrect)?.text ||
                          "Không xác định";
                        resolve({
                          success: true,
                          questionId,
                          answer,
                          correctAnswer,
                          isCorrect: answer === correctAnswer,
                        });
                      } else if (
                        response.message?.includes("version") &&
                        retryCount < 3
                      ) {
                        console.log("Version conflict, retrying..."); // Debug log
                        setTimeout(() => submitWithRetry(retryCount + 1), 500);
                      } else {
                        reject(
                          new Error(
                            response.message || "Lỗi khi nộp câu trả lời"
                          )
                        );
                      }
                    }
                  );
                } catch (error) {
                  if (retryCount < 3) {
                    console.log("Error occurred, retrying..."); // Debug log
                    setTimeout(() => submitWithRetry(retryCount + 1), 500);
                  } else {
                    reject(error);
                  }
                }
              };

              submitWithRetry();
            });
          })
        );

        // Calculate results
        const results = {
          score: submissions.reduce(
            (total: number, sub: any) => total + (sub.isCorrect ? 1 : 0),
            0
          ),
          stats: {
            totalQuestions: Object.keys(selectedAnswers).length,
            correctAnswers: submissions.filter((sub: any) => sub.isCorrect)
              .length,
            incorrectAnswers: submissions.filter((sub: any) => !sub.isCorrect)
              .length,
            correctPercentage: Math.round(
              (submissions.filter((sub: any) => sub.isCorrect).length /
                Object.keys(selectedAnswers).length) *
                100
            ),
          },
          answers: submissions.map((sub: any) => ({
            questionId: sub.questionId,
            userAnswer: sub.answer,
            correctAnswer: sub.correctAnswer,
            isCorrect: sub.isCorrect,
          })),
        };

        // Save results to database
        try {
          const token = await getToken();
          const response = await fetch(
            "http://localhost:5000/api/quiz/results",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                quizId: room.quiz._id,
                userAnswers: results.answers.map((answer) => ({
                  questionId: answer.questionId,
                  userAnswer: answer.userAnswer,
                  correctAnswer: answer.correctAnswer,
                  isCorrect: Boolean(answer.isCorrect),
                })),
                score: results.score,
                userId: userId,
                username: currentParticipant?.user?.name || "Anonymous",
                totalScore: Object.keys(selectedAnswers).length,
                deviceId: currentParticipant._id,
                stats: {
                  totalQuestions: results.stats.totalQuestions,
                  correctAnswers: results.stats.correctAnswers,
                  incorrectAnswers: results.stats.incorrectAnswers,
                  correctPercentage: results.stats.correctPercentage,
                },
              }),
            }
          );

          const data = await response.json();
          if (!data.success) {
            console.error("Failed to save quiz results:", data.message);
          } else {
            console.log("Quiz results saved successfully");
          }
        } catch (error) {
          console.error("Error saving quiz results:", error);
        }

        console.log("Final results:", results); // Debug log

        setQuizResults(results);
        setSubmitted(true);
        setShowConfirmModal(false);

        // Clear saved answers and current question
        localStorage.removeItem(`quiz_answers_${code}`);
        localStorage.removeItem(`quiz_current_question_${code}`);
        // Save submission state and results
        localStorage.setItem(`quiz_submitted_${code}`, "true");
        localStorage.setItem(`quiz_results_${code}`, JSON.stringify(results));
      }
    } catch (error) {
      console.error("Error submitting answers:", error);
      // Don't show error alert for auto-submit
      if (!submitted) {
        alert(
          error instanceof Error
            ? error.message
            : "Có lỗi xảy ra khi nộp bài. Vui lòng thử lại."
        );
      }
    }
  }, [
    room,
    selectedAnswers,
    userId,
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
    getRoom();
  }, [getRoom]);

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

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []);

  const handleAnswerSelect = useCallback(
    (questionId: string, answer: string) => {
      if (!questionId) return;

      setSelectedAnswers((prev: any) => {
        const newAnswers = {
          ...prev,
          [questionId]: answer,
        };

        // Save to localStorage
        localStorage.setItem(
          `quiz_answers_${code}`,
          JSON.stringify(newAnswers)
        );

        return newAnswers;
      });

      // Add haptic feedback effect
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    },
    [code]
  );

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

  const renderQuestion = useCallback(() => {
    const currentQ = questions[currentQuestionIndex] as Question;
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
                {currentQ?.questionText}
              </pre>
            </motion.div>
          </AnimatePresence>

          {/* Answer options */}
          <div className="flex flex-col mt-2 mb-5 row-span-3">
            <div className="grid grid-cols-4 gap-3 h-full mt-2 mb-5">
              {currentQ?.answers.map((option: any, index: number) => {
                const isSelected =
                  selectedAnswers[currentQ._id || ""] === option.text;
                const cardColors = [
                  { bg: "mediumturquoise", accent: "lightblue" },
                  { bg: "#9c27b0", accent: "#ce93d8" },
                  { bg: "#ff9800", accent: "#ffcc80" },
                  { bg: "#4caf50", accent: "#a5d6a7" },
                ];

                return (
                  <motion.button
                    key={index}
                    custom={index}
                    variants={answerVariants}
                    initial="hidden"
                    animate={animateQuestion ? "visible" : "hidden"}
                    whileHover="hover"
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      handleAnswerSelect(currentQ._id || "", option.text)
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
  `;

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

  if (error) {
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
          <p className="text-center">{error}</p>
        </div>
      </div>
    );
  }

  // if (room?.status === "completed") {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-littleblue text-background flex items-center justify-center">
  //       <div className="text-xl p-8 bg-black/30 backdrop-blur-sm rounded-lg shadow-lg flex flex-col items-center">
  //         <svg
  //           className="w-16 h-16 text-orange mb-4"
  //           fill="none"
  //           stroke="currentColor"
  //           viewBox="0 0 24 24"
  //         >
  //           <path
  //             strokeLinecap="round"
  //             strokeLinejoin="round"
  //             strokeWidth="2"
  //             d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
  //           />
  //         </svg>
  //         <p className="text-center">Bài kiểm tra đã kết thúc</p>
  //         <button
  //           onClick={() => navigate("/dashboard")}
  //           className="mt-6 px-6 py-3 bg-orange text-darkblue rounded-lg font-semibold hover:bg-amber-500 transition-colors"
  //         >
  //           Quay lại trang chủ
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  // Extracted component for quiz results modal
  if (submitted && quizResults) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-black via-gray-900 to-littleblue text-background">
        <div className="bg-black/50 backdrop-blur-sm rounded-3xl p-8 max-w-4xl w-full mx-4 shadow-2xl transform transition-all">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-4xl font-bold text-white">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                Kết quả
              </span>{" "}
              bài thi
            </h2>
            <HugeiconsIcon icon={ChampionIcon} />
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-rgba p-6 rounded-xl shadow-lg hover:shadow-indigo-900/20 transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="text-background font-medium">Điểm số</p>
                <HugeiconsIcon icon={Chart02Icon} />
              </div>
              <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange to-red-wine">
                {quizResults.score}/{quizResults.stats.totalQuestions}
              </p>
            </div>

            <div className="bg-rgba col-span-2 p-6 rounded-xl transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="text-background font-medium">Tỷ lệ đúng</p>
                <div className="bg-orange text-darkblue text-xs font-bold px-2 py-1 rounded-full">
                  {quizResults.stats.correctPercentage}%
                </div>
              </div>
              <div className="w-full bg-gray-500 rounded-full h-3 mt-2">
                <div
                  className="bg-gradient-to-r from-orange to-red-wine h-3 rounded-full"
                  style={{ width: `${quizResults.stats.correctPercentage}%` }}
                />
              </div>
              <p className="text-xl font-medium text-orange mt-2">
                {quizResults.stats.correctAnswers}/
                {quizResults.stats.totalQuestions} câu đúng
              </p>
            </div>
          </div>

          {/* Answers Section */}
          <div className="mb-8">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center justify-between w-full py-4 px-6 bg-rgba rounded-xl transition mb-4"
            >
              <div className="flex items-center">
                <h3 className="text-xl font-semibold text-background">
                  Chi tiết câu trả lời
                </h3>
                <span className="ml-3 bg-background px-2 py-1 rounded-lg text-sm text-darkblue">
                  {quizResults.answers.length} câu hỏi
                </span>
              </div>
              {showDetails ? (
                <HugeiconsIcon icon={ArrowUp01Icon} />
              ) : (
                <HugeiconsIcon icon={ArrowDown01Icon} />
              )}
            </button>

            {showDetails && (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar transition-all">
                {quizResults.answers.map((answer, index) => (
                  <div
                    key={index}
                    className={`p-5 rounded-xl border ${
                      answer.isCorrect
                        ? "bg-green-950/50 border-green-700/50 shadow-md shadow-green-900/20"
                        : "bg-red-950/50 border-red-700/50 shadow-md shadow-red-900/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-medium text-lg text-cyan-100">
                        Câu {index + 1}
                      </p>
                      {answer.isCorrect ? (
                        <div className="flex items-center text-emerald-400">
                          <HugeiconsIcon icon={CheckmarkCircle02Icon} />
                          <span className="text-sm font-medium">Đúng</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-rose-400">
                          <HugeiconsIcon icon={Cancel01Icon} />
                          <span className="text-sm font-medium">Sai</span>
                        </div>
                      )}
                    </div>

                    <p className="text-cyan-100 mb-3">{answer.question}</p>

                    <div className="space-y-2 ml-2">
                      <p className="text-sm flex items-center">
                        <span
                          className={`inline-block w-3 h-3 rounded-full mr-2 ${
                            answer.userAnswer === answer.correctAnswer
                              ? "bg-emerald-400"
                              : "bg-rose-400"
                          }`}
                        ></span>
                        <span className="text-cyan-300">Đáp án của bạn:</span>
                        <span className="ml-1 font-medium text-white">
                          {answer.userAnswer}
                        </span>
                      </p>

                      {!answer.isCorrect && (
                        <p className="text-sm flex items-center">
                          <span className="inline-block w-3 h-3 rounded-full mr-2 bg-emerald-400"></span>
                          <span className="text-cyan-300">Đáp án đúng:</span>
                          <span className="ml-1 font-medium text-white">
                            {answer.correctAnswer}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <button
              onClick={() => navigate("/dashboard/home")}
              className="flex items-center px-5 py-3 bg-background text-darkblue rounded-xl font-medium btn-hover"
            >
              <HugeiconsIcon icon={Backward01Icon} />
              <span className="ml-2">Quay lại trang chủ</span>
            </button>

            <button
              onClick={() => navigate("/dashboard/activity")}
              className="px-6 py-3  bg-orange text-darkblue rounded-xl font-semibold btn-hover"
            >
              Đến trang hoạt động
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Component for "Quiz completed" screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-950 via-indigo-950 to-purple-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 bg-indigo-900/40 backdrop-blur-md rounded-2xl shadow-2xl border border-indigo-700/40 flex flex-col items-center">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-purple-900/30">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} />
          </div>

          <h2 className="text-2xl font-bold mb-2 text-cyan-100">
            Bài thi hoàn thành!
          </h2>
          <p className="text-cyan-200 text-center mb-8">
            Kết quả của bạn đã được lưu. Bạn có thể xem chi tiết tại trang cá
            nhân.
          </p>

          <div className="w-full space-y-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-semibold hover:opacity-90 transition-colors shadow-lg shadow-purple-900/30"
            >
              Quay lại trang chủ
            </button>

            <button
              onClick={() => console.log("View all results")}
              className="w-full py-3 bg-indigo-800/60 text-cyan-100 rounded-xl font-medium hover:bg-indigo-700/60 transition-colors border border-indigo-700/40"
            >
              Xem tất cả kết quả
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (!showQuestions) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-littleblue text-background w-full ">
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
            <div className="flex items-center justify-center mt-20 grid grid-cols-5 gap-5 mx-8">
              {room?.participants?.map((participant: any) => {
                console.log("Participant data:", {
                  participant,
                  id: participant._id,
                  user: participant.user,
                  name: participant?.user?.name,
                  imageUrl: participant?.user?.imageUrl,
                });
                return (
                  <div
                    key={participant._id}
                    className="flex flex-col relative h-full items-center justify-center gap-3 bg-[#384052]/50 backdrop-blur-sm p-5 rounded-lg group transition-all duration-300 hover:bg-[#384052]/70"
                  >
                    <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center border-2 border-orange/50">
                      {participant.user?.imageUrl ? (
                        <img
                          className="w-full h-full object-cover"
                          src={participant.user.imageUrl}
                          alt={participant.user?.name || "Anonymous"}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange to-red-500 text-darkblue text-2xl font-bold">
                          {participant.user?.name
                            ? participant.user.name.charAt(0).toUpperCase()
                            : "?"}
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-orange">
                        {participant.user?.name || "Anonymous"}
                      </p>
                      <p className="text-sm text-gray-400">Thí sinh</p>
                    </div>
                    <div className="flex absolute left-2 right-2 top-2 bottom-2 bg-red-500/90 rounded-lg items-center justify-center gap-2 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity duration-200">
                      <p className="text-sm font-semibold text-white">
                        Nhấp để xóa thí sinh
                      </p>
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
