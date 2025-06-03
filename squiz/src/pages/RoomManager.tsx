import { useState, useEffect, useCallback } from "react";
import { connectSocket, disconnectSocket } from "../services/socket";
import axios from "axios";
import { useAuth, useClerk, useUser } from "@clerk/clerk-react";
import { Room, GroupedRooms, RoomStatus } from "../types/Room";
import { Socket } from "socket.io-client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlarmClockIcon,
  Tick04Icon,
  Timer01Icon,
  TimeSetting01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import UpdateRoomTimeModal from "../components/UpdateRoomTimeModal";
import { NavLink, useNavigate, useLocation } from "react-router";

const RoomManager = () => {
  const { userId } = useAuth();
  const clerk = useClerk();
  const { session } = clerk;
  const isClerkLoaded = clerk.loaded;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { getToken } = useAuth();
  const { user: currentUser } = useUser();
  const [isTeacher, setIsTeacher] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const FETCH_COOLDOWN = 2000; // 2 seconds cooldown between fetches

  const [rooms, setRooms] = useState<GroupedRooms>({
    scheduled: [],
    active: [],
    completed: [],
  });

  // Add state for each room status list
  const [scheduledList, setScheduledList] = useState<Room[]>([]);
  const [activeList, setActiveList] = useState<Room[]>([]);
  const [completedList, setCompletedList] = useState<Room[]>([]);

  // Update lists when rooms change
  useEffect(() => {
    setScheduledList(rooms.scheduled || []);
    setActiveList(rooms.active || []);
    setCompletedList(rooms.completed || []);
  }, [rooms]);

  // Update fetchRooms to include cooldown
  const fetchRooms = useCallback(
    async (force: boolean = false) => {
      if (!isClerkLoaded || !session) {
        console.log("Waiting for auth to be ready...");
        return;
      }

      const now = Date.now();
      if (!force && now - lastFetchTime < FETCH_COOLDOWN) {
        return; // Skip if not forced and within cooldown
      }

      try {
        setError(null);
        setIsLoading(true);

        const token = await session.getToken();
        if (!token) {
          console.error("No token available");
          setError("Không thể xác thực. Vui lòng đăng nhập lại.");
          return;
        }

        const res = await axios.get(
          `http://localhost:5000/api/quizRoom/host/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const allRooms = res.data.data.docs;
        const groupedRooms: GroupedRooms = {
          scheduled: [],
          active: [],
          completed: [],
        };

        allRooms.forEach((room: Room) => {
          if (groupedRooms[room.status]) {
            groupedRooms[room.status].push(room);
          }
        });

        setRooms(groupedRooms);
        setLastFetchTime(now);
      } catch (error: any) {
        console.error("Lỗi khi tải danh sách phòng:", error);
        setError("Không thể tải danh sách phòng. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    },
    [userId, session, isClerkLoaded]
  );

  // Add function to check if a room should be completed
  const shouldCompleteRoom = (room: Room) => {
    if (!room.startTime || !room.durationMinutes) return false;
    const startTime = new Date(room.startTime);
    const endTime = new Date(
      startTime.getTime() + room.durationMinutes * 60 * 1000
    );
    return endTime <= new Date();
  };

  // Update shouldActivateRoom to be more strict
  const shouldActivateRoom = (room: Room) => {
    if (!room.startTime || !room._id || room.status !== "scheduled")
      return false;
    const startTime = new Date(room.startTime);
    const now = new Date();
    // Add a small buffer (5 seconds) to avoid race conditions
    return startTime <= new Date(now.getTime() + 5000);
  };

  // Update checkRoomStatuses with better error handling
  const checkRoomStatuses = useCallback(async () => {
    if (!isClerkLoaded || !session) return;

    try {
      const token = await session.getToken();
      if (!token) return;

      let needsUpdate = false;

      // Check scheduled rooms for activation
      for (const room of scheduledList) {
        if (shouldActivateRoom(room)) {
          try {
            // First check if the room is still in scheduled state
            const roomCheck = await axios.get(
              `http://localhost:5000/api/quizRoom/${room._id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (roomCheck.data.data.status !== "scheduled") {
              console.log(
                `Room ${room._id} is no longer in scheduled state, skipping activation`
              );
              needsUpdate = true;
              continue;
            }

            const response = await axios.post(
              `http://localhost:5000/api/quizRoom/${room._id}/start`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (response.data.success) {
              console.log(`Successfully activated room ${room._id}`);
              needsUpdate = true;
            }
          } catch (err: any) {
            // Handle specific error cases
            if (err.response?.status === 400) {
              const errorMessage =
                err.response?.data?.message || "Unknown error";
              if (errorMessage.includes("already active")) {
                console.log(`Room ${room._id} is already active`);
                needsUpdate = true;
              } else {
                console.error(
                  `Error activating room ${room._id}:`,
                  errorMessage
                );
              }
            } else {
              console.error(
                `Failed to activate room ${room._id}:`,
                err.message
              );
            }
          }
        }
      }

      // Check active rooms for completion
      for (const room of activeList) {
        if (shouldCompleteRoom(room)) {
          try {
            // First check if the room is still active
            const roomCheck = await axios.get(
              `http://localhost:5000/api/quizRoom/${room._id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (roomCheck.data.data.status !== "active") {
              console.log(
                `Room ${room._id} is no longer active, skipping completion`
              );
              needsUpdate = true;
              continue;
            }

            if (socket) {
              socket.emit(
                "closeRoom",
                {
                  roomId: room._id,
                  userId: room.host,
                },
                (response: any) => {
                  if (response?.success) {
                    console.log(`Successfully completed room ${room._id}`);
                    needsUpdate = true;
                  } else {
                    console.error(
                      `Failed to complete room ${room._id}:`,
                      response?.message || "Unknown error"
                    );
                  }
                }
              );
            }
          } catch (err: any) {
            console.error(`Error completing room ${room._id}:`, err.message);
          }
        }
      }

      // Only fetch if there were changes
      if (needsUpdate) {
        await fetchRooms(true);
      }
    } catch (error: any) {
      console.error("Error checking room statuses:", error.message);
    }
  }, [scheduledList, activeList, session, isClerkLoaded, socket, fetchRooms]);

  // Update socket effect to be more efficient
  useEffect(() => {
    if (!socket || !userId || !session) return;

    const handleRoomUpdate = () => {
      fetchRooms(true);
    };

    socket.emit("joinUserRoomManager", userId);

    // Use the same handler for all room update events
    socket.on("roomActivated", handleRoomUpdate);
    socket.on("roomCompleted", handleRoomUpdate);
    socket.on("roomStatusUpdated", handleRoomUpdate);

    return () => {
      socket.off("roomActivated", handleRoomUpdate);
      socket.off("roomCompleted", handleRoomUpdate);
      socket.off("roomStatusUpdated", handleRoomUpdate);
    };
  }, [socket, userId, session, fetchRooms]);

  // Initial data load
  useEffect(() => {
    if (isClerkLoaded && session && userId) {
      fetchRooms(true);
    }
  }, [isClerkLoaded, session, userId, fetchRooms]);

  // Periodic status check
  useEffect(() => {
    if (!isClerkLoaded || !session) return;

    const interval = setInterval(checkRoomStatuses, 5000);
    return () => clearInterval(interval);
  }, [checkRoomStatuses, isClerkLoaded, session]);

  // Add effect to handle refresh parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const refresh = searchParams.get("refresh");
    if (refresh) {
      // Remove the refresh parameter from URL
      navigate(location.pathname, { replace: true });
      // Fetch rooms again
      fetchRooms();
    }
  }, [location.search]);

  // Check if current user is admin
  useEffect(() => {
    const checkTeacherStatus = async () => {
      try {
        if (currentUser) {
          const token = await getToken();
          const response = await axios.get(
            `http://localhost:5000/api/users/${currentUser.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          console.log(response.data.data);
          setIsTeacher(
            response.data.data.role === "teacher" ||
              response.data.data.role === "admin"
          );
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsTeacher(false);
      }
    };

    checkTeacherStatus();
  }, [currentUser]);

  // Update the return JSX to handle loading and error states
  if (!isClerkLoaded || !session) {
    return <div className="p-8 text-center">Đang tải...</div>;
  }

  if (!isTeacher) {
    return (
      <div className="p-8 text-center pt-20 w-full h-full flex flex-col items-center justify-center">
        <img className="h-[60%]" src="/assets/404.png" alt="" />
        <h1 className="text-2xl font-bold text-orange">TRUY CẬP BỊ TỪ CHỐI</h1>
        <p className="mt-4">Bạn không có quyền truy cập trang này.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        {error}
        <button
          onClick={() => fetchRooms(true)}
          className="ml-4 text-blue-500 underline"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-8 text-center">Đang tải danh sách phòng...</div>;
  }

  const handleCompletedRoom = (room: Room) => {
    if (!socket) {
      console.error("Socket chưa được kết nối");
      return;
    }

    console.log("Bắt đầu kết thúc phòng:", room);
    const data = {
      roomId: room._id,
      userId: room.host,
    };
    console.log("Dữ liệu gửi đi:", data);

    // Tắt phòng khi Active
    socket.emit("closeRoom", data, (response: any) => {
      console.log("Nhận phản hồi từ server:", response);
      if (response.success) {
        fetchRooms();
        console.log("Kết thúc phòng thành công:", response);
      } else {
        console.error("Thất bại:", response.message);
      }
    });
  };

  const handleStartRoom = async (roomId: string) => {
    try {
      // Get token directly from session
      const token = await session?.getToken();
      console.log("Session object:", session);
      console.log("Token type:", typeof token);
      console.log("Token length:", token?.length);
      console.log("Token:", token);

      if (!token) {
        console.error("No token available");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };
      console.log("Request headers:", headers);
      console.log(
        "Making request to:",
        `http://localhost:5000/api/quizRoom/${roomId}/start`
      );

      const res = await axios.post(
        `http://localhost:5000/api/quizRoom/${roomId}/start`,
        {},
        { headers }
      );

      if (res.data.success) {
        fetchRooms();
        return res.data.message;
      } else {
        return res.data.message;
      }
    } catch (err: any) {
      console.error("Error details:", err);
      console.error("Error response:", err.response?.data); // Debug log
      console.error("Error status:", err.response?.status); // Debug log
    }
  };

  const handleTimeSettingClick = (roomId: string) => {
    setSelectedRoomId(roomId);
    setIsTimeModalOpen(true);
  };

  const handleCloseTimeModal = () => {
    setIsTimeModalOpen(false);
    setSelectedRoomId(null);
  };

  const formatDateTimeToVN = (dateTimeString: string) => {
    if (!dateTimeString) return "";
    const date = new Date(dateTimeString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const calculateEndTime = (
    startTime: string | null,
    durationMinutes: number
  ) => {
    if (!startTime) return null;
    const start = new Date(startTime);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    return formatDateTimeToVN(end.toISOString());
  };

  const renderRooms = (status: RoomStatus) => {
    const list =
      status === "scheduled"
        ? scheduledList
        : status === "active"
        ? activeList
        : completedList;

    return list.length === 0 ? (
      <p className="text-gray-500 italic">Không có phòng</p>
    ) : (
      <ul className="space-y-2">
        {list.map((room) => (
          <li
            key={room._id}
            className="p-3 bg-white rounded shadow flex justify-between items-center"
          >
            <div>
              <div className="mb-2 font-semibold">
                {room.quiz?.name || room.roomName || "Phòng thi chưa có tên"}
              </div>
              <div className="text-sm text-gray-500">Mã: {room.roomCode}</div>
              <div className="text-sm text-gray-500">
                Bắt đầu lúc:{" "}
                {room.startTime
                  ? formatDateTimeToVN(room.startTime)
                  : "Chưa có"}
              </div>
              <div className="text-sm text-gray-500">
                Thời gian: {room.durationMinutes} phút
              </div>
              <div className="text-sm text-gray-500">
                Kết thúc lúc:{" "}
                {calculateEndTime(room.startTime, room.durationMinutes) ||
                  "Chưa có"}
              </div>
            </div>

            {/* Các nút hành động tùy theo trạng thái */}
            <div className="space-x-2">
              {status === "scheduled" && (
                <div className="flex items-center gap-2">
                  <div
                    className="bg-gray-100 flex items-center gap-2 font-semibold py-2 px-3 rounded btn-hover cursor-pointer"
                    onClick={() => handleTimeSettingClick(room._id)}
                  >
                    <HugeiconsIcon icon={TimeSetting01Icon} />
                  </div>
                  <div
                    className="bg-gray-100 flex items-center gap-2 font-semibold py-2 px-3 rounded btn-hover cursor-pointer"
                    onClick={() => viewRoom(room._id)}
                  >
                    <HugeiconsIcon icon={ViewIcon} />
                  </div>
                  <button
                    className="bg-orange font-semibold py-2 px-3 rounded btn-hover"
                    onClick={() => handleStartRoom(room._id)}
                  >
                    Bật phòng
                  </button>
                </div>
              )}

              {status === "active" && (
                <div className="flex items-center gap-2">
                  <div
                    className="bg-gray-100 flex items-center gap-2 font-semibold py-2 px-3 rounded btn-hover cursor-pointer"
                    onClick={() => handleTimeSettingClick(room._id)}
                  >
                    <HugeiconsIcon icon={TimeSetting01Icon} />
                  </div>
                  <NavLink
                    to={`/join-room/${room._id}`}
                    className="bg-gray-100 flex items-center gap-2 font-semibold py-2 px-3 rounded btn-hover cursor-pointer"
                  >
                    <HugeiconsIcon icon={ViewIcon} />
                  </NavLink>
                  <button
                    className="bg-orange font-semibold py-2 px-3 rounded btn-hover"
                    onClick={() => handleCompletedRoom(room)}
                  >
                    Đóng phòng
                  </button>
                </div>
              )}

              {status === "completed" && (
                <span className="text-gray-400 italic">Đã hoàn thành</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    );
  };

  const viewRoom = (roomId: string) => {
    navigate(`/join-room/${roomId}`);
  };

  return (
    <div className="pt-32">
      <h1 className="text-2xl mb-10">Quản lý phòng thi</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="text-lg font-semibold mb-2 flex items-center gap-2">
            <HugeiconsIcon icon={AlarmClockIcon} />
            <span>Phòng đã lên lịch</span>
          </p>
          {renderRooms("scheduled")}
        </div>
        <div>
          <p className="text-lg font-semibold mb-2 flex items-center gap-2">
            <HugeiconsIcon icon={Timer01Icon} />
            <span>Phòng đang hoạt động</span>
          </p>
          {renderRooms("active")}
        </div>
        <div>
          <p className="text-lg font-semibold mb-2 flex items-center gap-2">
            <HugeiconsIcon icon={Tick04Icon} />
            <span>Phòng đã hoàn thành</span>
          </p>
          {renderRooms("completed")}
        </div>
      </div>

      {selectedRoomId && (
        <UpdateRoomTimeModal
          isOpen={isTimeModalOpen}
          onClose={handleCloseTimeModal}
          roomId={selectedRoomId}
        />
      )}
    </div>
  );
};

export default RoomManager;
