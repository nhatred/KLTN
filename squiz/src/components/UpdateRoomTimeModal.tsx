import React, { useState, useEffect } from 'react';
import { connectSocket, disconnectSocket } from '../services/socket';
import { useAuth, useClerk } from '@clerk/clerk-react';
import { Socket } from 'socket.io-client';

interface UpdateRoomTimeModalProps {
    isOpen: boolean;
    onClose: () => void;
    roomId: string;
}

const UpdateRoomTimeModal: React.FC<UpdateRoomTimeModalProps> = ({ isOpen, onClose, roomId }) => {
    const [newDurationMinutes, setNewDurationMinutes] = useState('');
    const [currentEndTime, setCurrentEndTime] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const { userId } = useAuth();   
    const { session } = useClerk();
    const [socket, setSocket] = useState<Socket | null>(null);
    
    useEffect(() => {
        if (!isOpen || !userId || !session) return;

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

                // Đảm bảo socket đã kết nối
                if (!socketInstance.connected) {
                    socketInstance.connect();
                }

                // Listen for room time updates
                socketInstance.on('room:time_updated', (data: { endTime: string }) => {
                    setCurrentEndTime(new Date(data.endTime).toLocaleString());
                    console.log('Thời gian phòng đã được cập nhật');
                });

            } catch (error) {
                console.error('Error initializing socket:', error);
            }
        };

        initializeSocket();

        return () => {
            if (socket) {
                socket.off('room:time_updated');
                socket.emit('leaveRoom', { roomId });
                disconnectSocket(socket);
            }
        };
    }, [roomId, userId, session, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDurationMinutes || isNaN(Number(newDurationMinutes)) || Number(newDurationMinutes) <= 0) {
            console.log('Vui lòng nhập thời lượng hợp lệ (phút)');
            return;
        }

        if (!socket) {
            console.error('Socket chưa được kết nối');
            return;
        }

        setIsUpdating(true);
        try {
            const result = await new Promise<{ success: boolean; endTime?: string; message?: string }>((resolve) => {
                socket.emit('updateRoomActive', {
                    roomId: roomId,
                    userId: userId,
                    durationMinutes: parseInt(newDurationMinutes)
                }, (response: { success: boolean; endTime?: string; message?: string }) => {
                    resolve(response);
                });
            });

            if (result.success) {
                setCurrentEndTime(new Date(result.endTime!).toLocaleString());
                console.log('Cập nhật thời gian thành công');
                onClose(); // Close modal after successful update
            } else {
                console.log(result.message || 'Cập nhật thất bại');
            }
        } catch (error) {
            console.error('Error updating room time:', error);
            console.log('Lỗi khi cập nhật thời gian phòng');
        } finally {
            setIsUpdating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Cập nhật thời gian phòng thi</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                            Thời lượng mới (phút)
                        </label>
                        <input
                            id="duration"
                            type="number"
                            min="1"
                            value={newDurationMinutes}
                            onChange={(e) => setNewDurationMinutes(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                            placeholder="Nhập số phút"
                        />
                    </div>
                    
                    {currentEndTime && (
                        <div className="bg-blue-50 p-3 rounded">
                            <p className="text-blue-800">
                                Thời gian kết thúc mới: <strong>{currentEndTime}</strong>
                            </p>
                        </div>
                    )}
                    
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isUpdating}
                            className={`px-4 py-2 rounded-md text-white ${isUpdating ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {isUpdating ? 'Đang cập nhật...' : 'Cập nhật'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateRoomTimeModal; 