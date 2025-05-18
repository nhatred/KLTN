import { useState, useEffect } from 'react';
import { connectSocket, disconnectSocket } from '../services/socket';
import axios from 'axios';
import { useAuth, useClerk } from '@clerk/clerk-react';
import { Room, GroupedRooms, RoomStatus } from '../types/Room';
import { Socket } from 'socket.io-client';
import { HugeiconsIcon } from '@hugeicons/react';
import { AlarmClockIcon, Tick04Icon, Timer01Icon, TimeSetting01Icon, ViewIcon } from '@hugeicons/core-free-icons';
import UpdateRoomTimeModal from '../components/UpdateRoomTimeModal';
import { NavLink } from 'react-router';

const RoomManager = () => {
    const { userId } = useAuth();
    const { session } = useClerk();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);

    const [rooms, setRooms] = useState<GroupedRooms>({
        scheduled: [],
        active: [],
        completed: []
    });

    const fetchRooms = async () => {
        try {
            const token = await session?.getToken();
            if (!token) {
                console.error('No token available');
                return;
            }
            console.log("UserID:", userId);
            const res = await axios.get(
                `http://localhost:5000/api/quizRoom/host/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            const allRooms = res.data.data.docs;
    
            const groupedRooms: GroupedRooms = {
                scheduled: [],
                active: [],
                completed: []
            };
    
            // Lọc từng room vào đúng nhóm theo room.status
            allRooms.forEach((room: Room) => {
                if (groupedRooms[room.status]) {
                    groupedRooms[room.status].push(room);
                }
            });
            console.log(groupedRooms);
            setRooms(groupedRooms);
        } catch (error: any) {
            console.error('Lỗi khi tải danh sách phòng:', error.message);
        }
    };

    useEffect(() => {
        if (!userId || !session) return;

        const initializeSocket = async () => {
            try {
                const token = await session.getToken();
                if (!token) {
                    console.error('No token available');
                    return;
                }

                // Khởi tạo socket connection với token
                const socketInstance = await connectSocket(userId);
                setSocket(socketInstance);

                // Join room manager
                socketInstance.emit('joinUserRoomManager', userId);
                console.log('Joined room manager for user:', userId);

                // Lắng nghe sự kiện
                socketInstance.on('roomActivated', (newRoom) => {
                    console.log('Room activated:', newRoom);
                    setRooms(prev => {
                        const isRoomAlreadyActive = prev.active.some((r: Room) => r._id === newRoom._id);
                        if (isRoomAlreadyActive) {
                            return prev;  
                        }
                        const updatedScheduled = prev.scheduled.filter((r: Room) => r._id !== newRoom._id);
                        const updatedActive = [newRoom, ...prev.active];
                        return {
                            ...prev,
                            scheduled: updatedScheduled,
                            active: updatedActive
                        };
                    });
                });

                socketInstance.on('roomCompleted', (room) => {
                    console.log('Room completed:', room);
                    setRooms(prev => {
                        const isRoomAlreadyCompleted = prev.completed.some(r => r._id === room._id);
                        if (isRoomAlreadyCompleted) {
                            return prev;  
                        }
                        const updatedActive = prev.active.filter(r => r._id !== room._id);
                        const updatedCompleted = [room, ...prev.completed];
                        return {
                            ...prev,
                            active: updatedActive,
                            completed: updatedCompleted
                        };
                    });
                });

                // Fetch rooms
                fetchRooms();
            } catch (error) {
                console.error('Error initializing socket:', error);
            }
        };

        initializeSocket();

        return () => {
            if (socket) {
                disconnectSocket(socket);
            }
        };
    }, [userId, session]);

    const handleCompletedRoom = (room: Room) => {
        if (!socket) {
            console.error('Socket chưa được kết nối');
            return;
        }

        console.log('Bắt đầu kết thúc phòng:', room);
        const data = {
            roomId: room._id,
            userId: room.host
        };
        console.log('Dữ liệu gửi đi:', data);

        // Tắt phòng khi Active
        socket.emit('closeRoom', data, (response: any) => {
            console.log('Nhận phản hồi từ server:', response);
            if (response.success) {
                fetchRooms();
                console.log('✅ Kết thúc phòng thành công:', response);
            } else {
                console.error('❌ Thất bại:', response.message);
            }
        });
    };

    const handleStartRoom = async (roomId: string) => {
        try {
            // Get token directly from session
            const token = await session?.getToken();
            console.log('Session object:', session);
            console.log('Token type:', typeof token);
            console.log('Token length:', token?.length);
            console.log('Token:', token);
            
            if (!token) {
                console.error('No token available');
                return;
            }

            const headers = {
                Authorization: `Bearer ${token}`
            };
            console.log('Request headers:', headers);
            console.log('Making request to:', `http://localhost:5000/api/quizRoom/${roomId}/start`);

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
            console.error('Error details:', err);
            console.error('Error response:', err.response?.data); // Debug log
            console.error('Error status:', err.response?.status); // Debug log
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
        if (!dateTimeString) return '';
        const date = new Date(dateTimeString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    };

    const calculateEndTime = (startTime: string | null, durationMinutes: number) => {
        if (!startTime) return null;
        const start = new Date(startTime);
        const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
        return formatDateTimeToVN(end.toISOString());
    };

    const renderRooms = (status: RoomStatus) => {
        const list = rooms[status] || [];
        return list.length === 0 ? (
            <p className="text-gray-500 italic">Không có phòng</p>
        ) : (
            <ul className="space-y-2">
                {list.map(room => (
                    <li key={room._id} className="p-3 bg-white rounded shadow flex justify-between items-center">
                        <div>
                            <div className="mb-2 font-semibold">{room.quiz.name}</div>
                            <div className="text-sm text-gray-500">Mã: {room.roomCode}</div>
                            <div className="text-sm text-gray-500">Bắt đầu lúc: {room.startTime ? formatDateTimeToVN(room.startTime) : 'Chưa có'}</div>
                            <div className="text-sm text-gray-500">Thời gian: {room.durationMinutes} phút</div>
                            <div className="text-sm text-gray-500">Kết thúc lúc: {calculateEndTime(room.startTime, room.durationMinutes) || 'Chưa có'}</div>
                        </div>
    
                        {/* Các nút hành động tùy theo trạng thái */}
                        <div className="space-x-2">
                            {status === 'scheduled' && (
                                <div className="flex items-center gap-2">
                                    <div
                                        className="bg-gray-100 flex items-center gap-2 font-semibold py-2 px-3 rounded btn-hover cursor-pointer"
                                        onClick={() => handleTimeSettingClick(room._id)}>
                                        <HugeiconsIcon icon={TimeSetting01Icon} />
                                    </div>
                                    <button
                                        className="bg-orange font-semibold py-2 px-3 rounded btn-hover"
                                        onClick={() => handleStartRoom(room._id)}>
                                        Bật phòng
                                    </button>
                                    <div className="bg-gray-100 flex items-center gap-2 font-semibold py-2 px-3 rounded btn-hover cursor-pointer"
                                       >
                                        <HugeiconsIcon icon={ViewIcon} />
                                    </div>
                                </div>
                            )}
    
                            {status === 'active' && (
                                <div className="flex items-center gap-2">
                                    <div
                                        className="bg-gray-100 flex items-center gap-2 font-semibold py-2 px-3 rounded btn-hover cursor-pointer"
                                        onClick={() => handleTimeSettingClick(room._id)}>
                                        <HugeiconsIcon icon={TimeSetting01Icon} />
                                    </div>
                                    <NavLink to={`/join-room/${room._id}`} className="bg-gray-100 flex items-center gap-2 font-semibold py-2 px-3 rounded btn-hover cursor-pointer"
                                       >
                                        <HugeiconsIcon icon={ViewIcon} />
                                    </NavLink>
                                    <button
                                        className="bg-orange font-semibold py-2 px-3 rounded btn-hover"
                                        onClick={() => handleCompletedRoom(room)}>
                                        Đóng phòng
                                    </button>
                                    
                                </div>
                            )}
    
                            {status === 'completed' && (
                                <span className="text-gray-400 italic">Đã hoàn thành</span>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        );
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
                    {renderRooms('scheduled')}
                </div>
                <div>
                    <p className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <HugeiconsIcon icon={Timer01Icon} />
                        <span>Phòng đang hoạt động</span>
                    </p>
                    {renderRooms('active')}
                </div>
                <div>
                    <p className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <HugeiconsIcon icon={Tick04Icon} />
                        <span>Phòng đã hoàn thành</span>
                    </p>
                    {renderRooms('completed')}
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
