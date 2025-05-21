import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
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

export default function JoinRoom() {
  const [number] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [endTimeRemaining, setEndTimeRemaining] = useState<string>("");
  const { id } = useParams();
  const location = useLocation();
  const [room, setRoom] = useState<Room | null>(location.state?.room || null);
  const { getToken } = useAuth();

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

  const getRoom = async () => {
    try {
      const token = await getToken();
      console.log("Fetching room with identifier:", id);

      const response = await fetch(`http://localhost:5000/api/quizRoom/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setRoom(data.data);
        console.log("Room data from ID:", room);
      } else {
        throw new Error(data.message || "Không thể tải dữ liệu phòng");
      }
    } catch (err) {
      console.error("Error fetching room:", err);
    }
  };

  useEffect(() => {
    if (!location.state?.room) {
      getRoom();
    }
  }, [id, location.state]);

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

  // Add WebSocket connection
  useEffect(() => {
    let socket: any = null;

    const initializeSocket = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        socket = await connectSocket(id || "");

        // Join room as host
        socket.emit("joinUserRoomManager", id);

        // Listen for participant updates
        socket.on("participantJoined", (updatedRoom: Room) => {
          console.log("Participant joined:", updatedRoom);
          setRoom((prevRoom) =>
            prevRoom
              ? {
                  ...prevRoom,
                  ...updatedRoom,
                  participants: updatedRoom.participants,
                }
              : updatedRoom
          );
        });

        socket.on("participantLeft", (updatedRoom: Room) => {
          console.log("Participant left:", updatedRoom);
          setRoom((prevRoom) =>
            prevRoom
              ? {
                  ...prevRoom,
                  ...updatedRoom,
                  participants: updatedRoom.participants,
                }
              : updatedRoom
          );
        });

        // Listen for room updates
        socket.on("room:time_updated", (data: { endTime: string }) => {
          console.log("Room time updated:", data);
          setRoom((prevRoom) =>
            prevRoom
              ? {
                  ...prevRoom,
                  endTime: data.endTime,
                }
              : null
          );
        });

        socket.on("room:ended", (data: { endTime: string }) => {
          console.log("Room ended:", data);
          setRoom((prevRoom) =>
            prevRoom
              ? {
                  ...prevRoom,
                  status: "completed",
                  endTime: data.endTime,
                }
              : null
          );
        });
      } catch (error) {
        console.error("Error initializing socket:", error);
      }
    };

    if (id) {
      initializeSocket();
    }

    return () => {
      if (socket) {
        socket.off("participantJoined");
        socket.off("participantLeft");
        socket.off("room:time_updated");
        socket.off("room:ended");
        disconnectSocket(socket);
      }
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-littleblue text-background">
      <nav className="flex justify-between items-center px-8 py-2">
        <h1 className="text-3xl font-black">Squizz</h1>
        <div className="flex items-center gap-2">
          <div>
            <p>{timeRemaining}</p>
          </div>
          <div
            className="flex bg-orange text-darkblue btn-hover items-center gap-2 py-2 px-3 rounded font-semibold text-lg cursor-pointer"
            onClick={handleEndQuiz}
          >
            <p>Kết thúc bài kiểm tra</p>
          </div>
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

      {room?.status === "active" || room?.status === "scheduled" ? (
        <main className="flex flex-col justify-center items-center mt-10">
          <div className="bg-black/50 backdrop-blur-sm p-6 rounded-lg w-2/5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xl font-semibold">Hướng dẫn tham gia phòng</p>
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
                  <div className="flex items-center gap-2 bg-orange cursor-pointer btn-hover p-5 rounded-lg">
                    <HugeiconsIcon icon={Copy01Icon} />
                  </div>
                </div>
              </div>
              <div className="flex w-full flex-col gap-2">
                <p className="text-md font-semibold">2. Nhập mã để tham gia</p>
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
            <div className="flex items-center justify-center mt-20 grid grid-cols-5 gap-5 mx-8">
              {room?.participants?.map((participant: any) => (
                <div
                  key={participant._id}
                  className="flex relative h-full items-center justify-start gap-3 bg-[#384052]/50 backdrop-blur-sm px-3 py-5 rounded-lg group"
                >
                  <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center">
                    <img
                      className="object-cover"
                      src={
                        participant.user?.imageUrl ||
                        "https://images.unsplash.com/photo-1574232877776-2024ccf7c09e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fHVzZXJ8ZW58MHx8MHx8fDA%3D"
                      }
                      alt={participant.user?.name}
                    />
                  </div>
                  <p className="text-lg font-semibold">
                    {participant.user?.name}
                  </p>
                  <div className="flex absolute left-2 right-2 top-2 bottom-2 bg-red-500 rounded-lg items-center justify-center gap-2 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity duration-200">
                    <p className="text-sm font-semibold text-darkblue">
                      Nhấp để xóa thí sinh
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      ) : (
        <div className="flex items-center justify-center h-screen">
          <p className="text-xl font-semibold">Kết quả thống kê điểm số</p>
        </div>
      )}
    </div>
  );
}
