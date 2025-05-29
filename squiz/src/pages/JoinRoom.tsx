import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Share08Icon,
  Copy01Icon,
  UserGroup03Icon,
} from "@hugeicons/core-free-icons";
import "../style/button.css";
import { useParams, useLocation } from "react-router";
import { Room } from "../types/Room";
import { useAuth } from "@clerk/clerk-react";
import { connectSocket, disconnectSocket } from "../services/socket";
import SpinnerLoading from "../components/SpinnerLoading";

export default function JoinRoom() {
  const [number] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [endTimeRemaining, setEndTimeRemaining] = useState<string>("");
  const { id } = useParams();
  const location = useLocation();
  const [room, setRoom] = useState<Room | null>(location.state?.room || null);
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isParticipantsLoading, setIsParticipantsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Memoize socket connection to prevent unnecessary reconnections
  const socket = useMemo(() => {
    if (!id) return null;
    return connectSocket(id);
  }, [id]);

  // Update the Room interface to match the participant data structure
  interface Room {
    _id: string;
    participants: ParticipantData[];
    status: string;
    startTime: string;
    durationMinutes: number;
    roomCode: string;
    lastActivationCheck: string | null;
  }

  // Add interface for participant progress
  interface ParticipantProgress {
    participantId: string;
    answeredCount: number;
    totalQuestions: number;
    score: number;
  }

  // Update ParticipantData interface
  interface ParticipantData {
    _id: string;
    quizRoom: string;
    questionOrder: string[];
    user: {
      _id: string;
      name: string;
      imageUrl: string;
    };
    score: number;
    isLoggedIn: boolean;
    temporaryUsername: string;
    answeredQuestions?: string[];
    check?: boolean;
    connectionId?: string;
    currentQuestionIndex?: number;
    deviceInfo?: {
      browser: string;
    };
    joinedAt?: string;
    lastActive?: string;
    remainingQuestions?: string[];
    submissions?: any[];
  }

  // Update ParticipantResult interface
  interface ParticipantResult {
    participantId: string;
    userId: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    timeSpent: number;
    rank: number;
    user: {
      _id: string;
      name: string;
      imageUrl: string;
    };
    temporaryUsername?: string;
  }

  // Add new state for results
  const [results, setResults] = useState<ParticipantResult[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  // Add state for participant progress
  const [participantProgress] = useState<
    Record<string, ParticipantProgress>
  >({});


  // Add effect to keep token updated
  useEffect(() => {
    const updateToken = async () => {
      try {
        const token = await getToken();
        setAuthToken(token);
      } catch (error) {
        console.error("Error getting auth token:", error);
      }
    };

    updateToken();
    // Set up token refresh interval
    const tokenInterval = setInterval(updateToken, 4 * 60 * 1000); // Refresh every 4 minutes

    return () => clearInterval(tokenInterval);
  }, [getToken]);

  // Update socket connection effect
  useEffect(() => {
    if (!socket || !authToken) return;

    let refreshInterval: NodeJS.Timeout | null = null;
    let lastUpdate = Date.now();
    const MIN_UPDATE_INTERVAL = 2000; // Minimum 2 seconds between updates

    const initializeSocket = async () => {
      try {
        socket.emit("joinUserRoomManager", id);

        socket.on("participantJoined", async (updatedParticipant: any) => {
          const now = Date.now();
          if (now - lastUpdate < MIN_UPDATE_INTERVAL) return;
          lastUpdate = now;

          try {
            if (typeof updatedParticipant.user === "string") {
              const userResponse = await fetch(
                `http://localhost:5000/api/participant/user/${updatedParticipant.user}`,
                {
                  headers: {
                    Authorization: `Bearer ${authToken}`,
                    "x-periodic-request": "1",
                  },
                }
              );

              if (userResponse.ok) {
                const { data: userData } = await userResponse.json();
                updatedParticipant.user = userData;
              }
            }

            setRoom((prevRoom) => {
              if (!prevRoom) return prevRoom;

              const existingParticipantIndex = prevRoom.participants.findIndex(
                (p) => p._id === updatedParticipant._id
              );

              const updatedParticipants = [...prevRoom.participants];

              if (existingParticipantIndex >= 0) {
                updatedParticipants[existingParticipantIndex] = {
                  ...updatedParticipant,
                  score: updatedParticipant.score || 0,
                  isLoggedIn: true,
                };
              } else {
                updatedParticipants.push({
                  ...updatedParticipant,
                  score: updatedParticipant.score || 0,
                  isLoggedIn: true,
                });
              }

              return {
                ...prevRoom,
                participants: updatedParticipants,
              };
            });
          } catch (error) {
            console.error("Error processing participant update");
          }
        });

        socket.on("roomStatusUpdated", (updatedRoom: Room) => {
          if (updatedRoom.status === "completed") {
            if (refreshInterval) {
              clearInterval(refreshInterval);
              refreshInterval = null;
            }
            fetchRoomResults();
          }
        });

        // Set up periodic room data refresh only if room is not completed
        if (room?.status !== "completed") {
          refreshInterval = setInterval(() => {
            const now = Date.now();
            if (now - lastUpdate < MIN_UPDATE_INTERVAL) return;
            lastUpdate = now;
            getRoom();
          }, 10000);
        }
      } catch (error) {
        console.error("Error initializing socket");
      }
    };

    initializeSocket();

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      socket.off("participantJoined");
      socket.off("roomStatusUpdated");
    };
  }, [socket, id, authToken, room?.status]);

  // Update getRoom function with better token handling
  const getRoom = async () => {
    if (!authToken) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`http://localhost:5000/api/quizRoom/${id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "x-periodic-request": "1", // Mark as periodic request
        },
      });

      if (response.status === 401) {
        // Try to get a new token
        try {
          const newToken = await getToken();
          if (newToken) {
            setAuthToken(newToken);
            // Retry the request with new token
            const retryResponse = await fetch(
              `http://localhost:5000/api/quizRoom/${id}`,
              {
                headers: {
                  Authorization: `Bearer ${newToken}`,
                  "x-periodic-request": "1",
                },
              }
            );

            if (!retryResponse.ok) {
              throw new Error(`HTTP error! status: ${retryResponse.status}`);
            }

            const retryData = await retryResponse.json();
            if (!retryData.success) {
              throw new Error(
                retryData.message || "Lỗi khi lấy thông tin phòng"
              );
            }

            await processRoomData(retryData.data);
            return;
          }
        } catch (tokenError) {
          throw new Error(
            "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
          );
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Lỗi khi lấy thông tin phòng");
      }

      await processRoomData(data.data);
    } catch (err: any) {
      console.error("Error fetching room:", err.message);
      setError(err.message || "Không thể tải thông tin phòng");
    } finally {
      setIsLoading(false);
      setIsParticipantsLoading(false);
    }
  };

  // Separate function to process room data
  const processRoomData = async (roomData: any) => {
    const participantsWithInfo = await Promise.all(
      roomData.participants.map(async (participant: any) => {
        if (typeof participant.user === "string") {
          const userId = participant.user;
          try {
            const userResponse = await fetch(
              `http://localhost:5000/api/participant/user/${userId}`,
              {
                headers: {
                  Authorization: `Bearer ${authToken}`,
                  "x-periodic-request": "1",
                },
              }
            );

            if (userResponse.ok) {
              const { data: userData } = await userResponse.json();
              return {
                ...participant,
                score: participant.score || 0,
                isLoggedIn: true,
                user: {
                  _id: userData._id,
                  name: userData.name,
                  imageUrl:
                    userData.imageUrl ||
                    "https://images.unsplash.com/photo-1574232877776-2024ccf7c09e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fHVzZXJ8ZW58MHx8MHx8fDA%3D",
                },
              };
            }
          } catch (error) {
            console.error(`Error fetching user data for ${userId}`);
          }

          return {
            ...participant,
            score: participant.score || 0,
            isLoggedIn: false,
            user: {
              _id: userId,
              name: participant.temporaryUsername || "Unknown User",
              imageUrl:
                "https://images.unsplash.com/photo-1574232877776-2024ccf7c09e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fHVzZXJ8ZW58MHx8MHx8fDA%3D",
            },
          };
        }

        return {
          ...participant,
          score: participant.score || 0,
          isLoggedIn: true,
          user: participant.user,
        };
      })
    );

    const processedRoom = {
      ...roomData,
      participants: participantsWithInfo,
    };

    setRoom(processedRoom);

    if (processedRoom.status === "completed") {
      fetchRoomResults();
    }
  };

  // Update initial data fetch effect
  useEffect(() => {
    if (!location.state?.room && authToken) {
      getRoom();
    } else if (location.state?.room) {
      const initialRoom = location.state.room;
      setRoom(initialRoom);
      setIsLoading(false);

      // If room is completed, fetch results immediately
      if (initialRoom.status === "completed") {
        fetchRoomResults();
      }
    }
  }, [id, location.state, authToken]);

  // Update ParticipantList to show progress
  const ParticipantList = useMemo(() => {
    return room?.participants?.map((participant) => {
      const progress = participantProgress[participant._id];

      return (
        <div
          key={participant._id}
          className="flex flex-col relative h-full bg-[#384052]/50 backdrop-blur-sm p-5 rounded-lg group transition-all duration-300 hover:bg-[#384052]/70"
        >
          {/* User Info Section */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center">
              <img
                className="object-cover w-full h-full"
                src={
                  participant.user?.imageUrl ||
                  "https://images.unsplash.com/photo-1574232877776-2024ccf7c09e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fHVzZXJ8ZW58MHx8MHx8fDA%3D"
                }
                alt={participant.user?.name || "User"}
              />
            </div>
            <div>
              <p className="text-lg font-semibold text-orange">
                {participant.user?.name || "Anonymous"}
              </p>
              <p className="text-sm text-gray-400">
                Điểm: {participant.score || 0}
              </p>
              {progress && (
                <p className="text-sm text-gray-400">
                  Tiến độ: {progress.answeredCount}/{progress.totalQuestions}
                </p>
              )}
            </div>
          </div>

          {/* Remove Participant Overlay */}
          <div className="flex absolute inset-0 bg-red-500 rounded-lg items-center justify-center gap-2 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity duration-200">
            <p className="text-sm font-semibold text-darkblue">
              Nhấp để xóa thí sinh
            </p>
          </div>
        </div>
      );
    });
  }, [room?.participants, participantProgress]);

  const handleEndQuiz = () => {
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    // Xử lý logic kết thúc bài kiểm tra ở đây
    setShowConfirmModal(false);
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
  };

  const calculateTimeRemaining = () => {
    if (!room?.startTime) return;

    const startTime = new Date(room.startTime).getTime();
    const now = new Date().getTime();
    const difference = startTime - now;

    if (difference <= 0) {
      setTimeRemaining("Phòng thi đã bắt đầu");
      // Calculate end time based on startTime and durationMinutes
      const endTime = new Date(startTime + room.durationMinutes * 60 * 1000);
      const endTimeDifference = endTime.getTime() - now;

      if (endTimeDifference <= 0) {
        setEndTimeRemaining("Phòng thi đã kết thúc");
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
      }
      return;
    }

    const minutes = Math.floor(difference / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    setTimeRemaining(`Phòng thi bắt đầu sau ${minutes} phút ${seconds} giây`);
    setEndTimeRemaining(""); // Clear end time when room hasn't started
  };

  useEffect(() => {
    if (room?.startTime) {
      calculateTimeRemaining();
      const timer = setInterval(calculateTimeRemaining, 1000);
      return () => clearInterval(timer);
    }
  }, [room?.startTime]);

  // Add function to fetch results
  const fetchRoomResults = async () => {
    if (!room?._id || !authToken) return;

    try {
      setIsLoadingResults(true);
      console.log("Fetching results for room:", room._id);

      const response = await fetch(
        `http://localhost:5000/api/quizRoom/${room._id}/results`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Received results data:", data);

      if (data.success && Array.isArray(data.data)) {
        // Map results with participant info
        const resultsWithInfo = await Promise.all(
          data.data.map(async (result: any) => {
            const participant = room.participants.find(
              (p) => p._id === result.participantId
            );

            if (!participant) {
              console.log("Participant not found for result:", result);
              return {
                ...result,
                user: {
                  name: "Unknown User",
                  imageUrl:
                    "https://images.unsplash.com/photo-1574232877776-2024ccf7c09e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fHVzZXJ8ZW58MHx8MHx8fDA%3D",
                },
              };
            }

            return {
              ...result,
              user: participant.user,
            };
          })
        );

        // Sort results by score in descending order and add rank
        const sortedResults = resultsWithInfo
          .sort((a, b) => b.score - a.score)
          .map((result, index) => ({
            ...result,
            rank: index + 1,
          }));

        console.log("Processed results:", sortedResults);
        setResults(sortedResults);
      } else {
        console.error("Invalid results data format:", data);
      }
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setIsLoadingResults(false);
    }
  };

  // Update renderResults function
  const renderResults = () => {
    if (isLoadingResults) {
      return (
        <div className="flex items-center justify-center h-96">
          <SpinnerLoading />
        </div>
      );
    }

    // If no results but we have participants with scores, create results from participants
    if (
      !results.length &&
      room &&
      room.participants &&
      room.participants.length > 0
    ) {
      const participantResults = room.participants
        .map((participant) => ({
          participantId: participant._id,
          userId: participant.user._id,
          score: participant.score || 0,
          totalQuestions: participant.remainingQuestions?.length || 0,
          correctAnswers: participant.score || 0, // Assuming score represents correct answers
          incorrectAnswers:
            (participant.remainingQuestions?.length || 0) -
            (participant.score || 0),
          timeSpent: participant.lastActive
            ? Math.round(
                (new Date(participant.lastActive).getTime() -
                  new Date(participant.joinedAt || "").getTime()) /
                  1000
              )
            : 0,
          user: participant.user,
          temporaryUsername: participant.temporaryUsername,
          rank: 0, // Will be calculated below
        }))
        .sort((a, b) => b.score - a.score)
        .map((result, index) => ({
          ...result,
          rank: index + 1,
        }));

      return renderResultsContent(participantResults);
    }

    if (!results.length) {
      return (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-[#384052]/50 backdrop-blur-sm p-8 rounded-xl text-center">
            <p className="text-xl font-semibold mb-4">Chưa có kết quả</p>
            <p className="text-gray-400">
              Kết quả sẽ được hiển thị sau khi phòng thi kết thúc và có người
              tham gia.
            </p>
          </div>
        </div>
      );
    }

    return renderResultsContent(results);
  };

  // Separate function to render results content
  const renderResultsContent = (resultsData: ParticipantResult[]) => {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-orange mb-8 text-center">
          Kết quả bài kiểm tra
        </h2>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-[#384052]/50 backdrop-blur-sm p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Tổng số thí sinh</h3>
            <p className="text-3xl font-bold text-orange">
              {resultsData.length}
            </p>
          </div>
          <div className="bg-[#384052]/50 backdrop-blur-sm p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Điểm trung bình</h3>
            <p className="text-3xl font-bold text-orange">
              {resultsData.length > 0
                ? (
                    resultsData.reduce((acc, curr) => acc + curr.score, 0) /
                    resultsData.length
                  ).toFixed(1)
                : "0"}
            </p>
          </div>
          <div className="bg-[#384052]/50 backdrop-blur-sm p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Thời gian trung bình</h3>
            <p className="text-3xl font-bold text-orange">
              {resultsData.length > 0
                ? Math.round(
                    resultsData.reduce((acc, curr) => acc + curr.timeSpent, 0) /
                      resultsData.length
                  )
                : "0"}{" "}
              giây
            </p>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-[#384052]/50 backdrop-blur-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-black/30">
                  <th className="px-6 py-4 text-left">Thứ hạng</th>
                  <th className="px-6 py-4 text-left">Thí sinh</th>
                  <th className="px-6 py-4 text-center">Điểm số</th>
                  <th className="px-6 py-4 text-center">Câu đúng</th>
                  <th className="px-6 py-4 text-center">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {resultsData.map((result) => (
                  <tr
                    key={result.participantId}
                    className="border-t border-gray-700 hover:bg-black/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {result.rank <= 3 ? (
                          <span className="text-2xl">
                            {result.rank === 1
                              ? "🥇"
                              : result.rank === 2
                              ? "🥈"
                              : "🥉"}
                          </span>
                        ) : (
                          <span className="text-xl font-bold text-orange">
                            #{result.rank}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          <img
                            src={
                              result.user?.imageUrl ||
                              "https://images.unsplash.com/photo-1574232877776-2024ccf7c09e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fHVzZXJ8ZW58MHx8MHx8fDA%3D"
                            }
                            alt={result.user?.name || "Anonymous"}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-semibold">
                            {result.user?.name ||
                              result.temporaryUsername ||
                              "Anonymous"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xl font-bold text-orange">
                        {result.score}
                      </span>
                      <span className="text-sm text-gray-400">
                        /{result.totalQuestions || 10}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-green-500">
                        {result.correctAnswers} đúng
                      </span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-red-500">
                        {result.incorrectAnswers} sai
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-gray-300">
                        {Math.floor(result.timeSpent / 60)}:
                        {(result.timeSpent % 60).toString().padStart(2, "0")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Update the main render logic
  if (isLoading && !room) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <SpinnerLoading />
          <p className="text-background text-center mt-4">
            Đang tải thông tin phòng...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-littleblue flex items-center justify-center">
        <div className="bg-red-500/10 backdrop-blur-sm p-8 rounded-xl text-center">
          <p className="text-red-500 text-xl font-semibold mb-4">⚠️ Lỗi</p>
          <p className="text-background">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-littleblue text-background">
      <nav className="flex justify-between items-center px-8 py-2">
        <h1 className="text-3xl font-black">Squizz</h1>
        <div className="flex items-center gap-2">
          <div>
            <p>{timeRemaining}</p>
          </div>
          {room?.status !== "completed" && (
            <div
              className="flex bg-orange text-darkblue btn-hover items-center gap-2 py-2 px-3 rounded font-semibold text-lg cursor-pointer"
              onClick={handleEndQuiz}
            >
              <p>Kết thúc bài kiểm tra</p>
            </div>
          )}
        </div>
      </nav>

      {/* Modal xác nhận */}
      {showConfirmModal && (
        <div
          onClick={handleCancel}
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 modal-overlay-animate"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#2b2e34] p-6 rounded-lg w-96 modal-animate"
          >
            <h2 className="text-xl font-semibold mb-4">Xác nhận kết thúc</h2>
            <p className="text-gray-300 mb-6">
              Bạn có chắc chắn muốn kết thúc bài kiểm tra này không?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleCancel}
                className="px-4 py-2 font-semibold bg-gray-700 text-background rounded btn-hover"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 font-semibold bg-red-500 text-background rounded btn-hover"
              >
                Kết thúc
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4">
        {room?.status === "completed" ? (
          renderResults()
        ) : room?.status === "active" || room?.status === "scheduled" ? (
          <div className="flex flex-col justify-center items-center mt-10">
            <div className="bg-black/50 backdrop-blur-sm p-6 rounded-lg w-2/5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xl font-semibold">
                  Hướng dẫn tham gia phòng
                </p>
                <p className="text-darkblue font-bold btn-hover cursor-pointer flex items-center gap-2 text-sm bg-orange p-2 rounded-lg">
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
                    <div className="flex items-center gap-2 bg-orange cursor-pointer btn-hover p-5 rounded-lg">
                      <HugeiconsIcon icon={Copy01Icon} />
                    </div>
                  </div>
                </div>
                <div className="flex w-full flex-col gap-2">
                  <p className="text-md font-semibold">
                    2. Nhập mã để tham gia
                  </p>
                  <div className="flex items-center justify-between bg-rgba py-2 pl-4 pr-2 rounded-lg gap-2">
                    <p className="text-5xl tracking-widest font-semibold">
                      {room?.roomCode}
                    </p>
                    <div className="flex items-center gap-2 bg-orange cursor-pointer btn-hover p-5 rounded-lg">
                      <HugeiconsIcon icon={Copy01Icon} />
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
                  {room?.status === "active" ? (
                    <div className="text-darkblue rounded-lg bg-orange px-10 py-5 animate-pulse-scale">
                      <p className="text-xl font-semibold">
                        Kết thúc sau {endTimeRemaining}
                      </p>
                    </div>
                  ) : (
                    <div
                      className={`button-30 text-darkblue rounded-lg bg-orange px-10 py-5 ${
                        number > 0 ? "animate-pulse-scale" : ""
                      }`}
                    >
                      <p className="text-xl font-semibold">Bắt đầu</p>
                    </div>
                  )}
                </div>
              </div>
              {isParticipantsLoading ? (
                <div className="flex justify-center mt-20">
                  <SpinnerLoading />
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-5 mx-8 mt-20">
                  {ParticipantList}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
