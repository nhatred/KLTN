import React, { useState, useEffect } from 'react';
import { useAuth, useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router';
import { Quiz } from '../types/Quiz';

interface SelectQuizModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SelectQuizModal: React.FC<SelectQuizModalProps> = ({ isOpen, onClose }) => {
    const [isMyQuizzes, setIsMyQuizzes] = useState(false);
    const [isFavoriteQuizzes, setIsFavoriteQuizzes] = useState(false);
    const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([]);
    const [displayedQuizzes, setDisplayedQuizzes] = useState<Quiz[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { userId } = useAuth();
    const { session } = useClerk();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isOpen) return;
        fetchQuizzes();
    }, [isOpen]);

    useEffect(() => {
        if (isMyQuizzes) {
            setDisplayedQuizzes(allQuizzes.filter(quiz => quiz.creator === userId));
        } else if (isFavoriteQuizzes) {
            setDisplayedQuizzes(allQuizzes.filter(quiz => quiz.favorites?.includes(userId || '')));
        } else {
            setDisplayedQuizzes(allQuizzes);
        }
    }, [isMyQuizzes, isFavoriteQuizzes, allQuizzes, userId]);

    const fetchQuizzes = async () => {
        if (!userId || !session) return;

        setIsLoading(true);
        try {
            const token = await session.getToken();
            if (!token) {
                console.error('No token available');
                return;
            }

            const response = await fetch(
                `http://localhost:5000/api/quiz`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();
            setAllQuizzes(data);
        } catch (error) {
            console.error('Error fetching quizzes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuizSelect = (quizId: string) => {
        navigate(`/create-room/${quizId}`);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div  onClick={onClose} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div  onClick={e => e.stopPropagation()} className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Chọn Quiz</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                {/* Quiz Type Selection */}
                <div className="flex gap-4 mb-6">
                    <button
                        className={`px-4 py-2 rounded-lg ${
                            !isMyQuizzes && !isFavoriteQuizzes
                                ? 'bg-orange text-white'
                                : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                        onClick={() => {
                            setIsMyQuizzes(false);
                            setIsFavoriteQuizzes(false);
                        }}
                    >
                        Quiz Công khai
                    </button>
                    <button
                        className={`px-4 py-2 rounded-lg ${
                            isMyQuizzes
                                ? 'bg-orange text-white'
                                : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                        onClick={() => {
                            setIsMyQuizzes(true);
                            setIsFavoriteQuizzes(false);
                        }}
                    >
                        Quiz của bạn
                    </button>
                    <button
                        className={`px-4 py-2 rounded-lg ${
                            isFavoriteQuizzes
                                ? 'bg-orange text-white'
                                : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                        onClick={() => {
                            setIsFavoriteQuizzes(true);
                            setIsMyQuizzes(false);
                        }}
                    >
                        Quiz yêu thích
                    </button>
                </div>

                {/* Quiz List */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange"></div>
                        </div>
                    ) : displayedQuizzes.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            Không có quiz nào
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {displayedQuizzes.map((quiz) => (
                                <div
                                    key={quiz._id}
                                    className="border rounded-lg p-4 hover:border-orange cursor-pointer transition-colors"
                                    onClick={() => handleQuizSelect(quiz._id)}
                                >
                                    <div className="flex items-center gap-2">
                                        <img src={quiz.imageUrl} alt="" className="w-20 h-20 object-cover rounded-lg" />
                                        <div className="flex flex-col">
                                            <h3 className="font-semibold text-lg mb-2">
                                                {quiz.name}
                                            </h3>
                                            <p className="text-darkblue font-semibold text-sm">{quiz.topic}</p>
                                            <p className="text-darkblue font-semibold text-sm">Có {quiz.totalPlays} lượt chơi</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SelectQuizModal;