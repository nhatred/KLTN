import User from '../models/User.js';
import Question from '../models/Question.js';
import Participant from '../models/Participant.js';
import Submission from '../models/Submission.js';
import QuizRoom from '../models/QuizRoom.js';
import mongoose from 'mongoose';
import generateRoomCode from '../ultil/roomUtils.js';
import Quiz from '../models/Quiz.js';

    // Tạo phòng thi mới
    async function createRoom(req, res) {
        try {
          const { quizId, durationMinutes, startTime, roomName } = req.body;
          const hostId = req.userId;
      
          console.log('Create Room Debug:', {
            quizId,
            hostId,
            auth: req.auth,
            userId: req.userId
          });

          // Validate input
          if (!quizId || !durationMinutes) {
            return res.status(400).json({ 
              success: false,
              message: 'Thiếu thông tin bắt buộc: quizId và durationMinutes' 
            });
          }
      
          // Kiểm tra quiz tồn tại và thuộc về host (sử dụng lean() để tối ưu)
          const quiz = await Quiz.findById(quizId).lean();
          if (!quiz) {
            return res.status(404).json({ 
              success: false,
              message: 'Không tìm thấy quiz' 
            });
          }
          
          console.log('Quiz Debug:', {
            quizCreator: quiz.creator,
            hostId,
            comparison: quiz.creator.toString() === hostId
          });

        
      
          // Xử lý thời gian
          const now = new Date();
          const parsedStartTime = startTime ? new Date(startTime) : null;
      
          if (parsedStartTime && parsedStartTime < now) {
            return res.status(400).json({ 
              success: false,
              message: 'Thời gian bắt đầu phải trong tương lai' 
            });
          }
      
          // Tạo phòng
          const roomCode = await generateRoomCode();
          const newRoom = new QuizRoom({
            roomCode,
            roomName,
            quiz: quizId,
            host: hostId,
            durationMinutes,
            autoStart: !!parsedStartTime, // Tự động kích hoạt nếu có startTime
            startTime: parsedStartTime,
            status: 'scheduled',
            ...(parsedStartTime && { 
              endTime: new Date(parsedStartTime.getTime() + durationMinutes * 60000)
            })
          });
      
          const savedRoom = await newRoom.save();
      
          // Xử lý tự động mở nếu startTime đã qua
          if (savedRoom.shouldAutoStart) {
            await savedRoom.startRoom();
            return res.status(201).json({
              success: true,
              message: 'Phòng đã được tự động mở ngay',
              data: savedRoom
            });
          }
      
          res.status(201).json({
            success: true,
            message: parsedStartTime 
              ? 'Phòng sẽ tự động mở khi đến giờ' 
              : 'Phòng đã sẵn sàng để mở thủ công',
            data: savedRoom
          });
      
        } catch (error) {
          res.status(500).json({ 
            success: false,
            message: 'Lỗi khi tạo phòng thi',
            error: error.message,
            systemTime: new Date().toISOString() // Giúp debug
          });
        }
      }

    // Start thủ công
    async function startRoom(req, res) {
        try {
            const room = await QuizRoom.findById(req.params.id);
            
            if (!room) {
                return res.status(404).json({ message: 'Không tìm thấy phòng thi' });
            }
        
            // Kiểm tra quyền
            if (room.host.toString() !== req.userId) {
                return res.status(403).json({ message: 'Chỉ chủ phòng mới được bắt đầu phòng' });
            }
        
            // Kiểm tra trạng thái hiện tại
            if (room.status !== 'scheduled') {
                return res.status(400).json({ 
                message: `Không thể bắt đầu phòng khi trạng thái hiện tại là ${room.status}`
                });
            }
        
            // Bắt đầu phòng
            await room.startRoom();
            
            res.json({ 
                success: true,
                message: 'Phòng thi đã bắt đầu thành công',
                room: {
                    id: room._id,
                    roomCode: room.roomCode,
                    status: room.status,
                    startTime: room.startTime,
                    endTime: room.endTime,
                    durationMinutes: room.durationMinutes
                }
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                message: 'Lỗi khi bắt đầu phòng thi',
                error: error.message 
            });
        }
    }

    // Kết thúc thủ công
    async function endRoom(socket, data) {
      console.log("Đã nhận data tại Controller: ", data)
        try {
        const { roomId, userId } = data;
        const room = await QuizRoom.findById(roomId)
        console.log("đã tìm được room", room)
        if (!room) {
            return res.status(404).json({ 
            success: false,
            message: 'Không tìm thấy phòng thi' 
            });
        }

        // Kiểm tra quyền
        if (room.host.toString() !== userId) {
            return { 
              success: false,
              message: 'Chỉ chủ phòng mới được kết thúc phòng' 
            };
        }

        // Kiểm tra trạng thái
        if (room.status !== 'active') {
            return res.status(400).json({ 
            success: false,
            message: 'Chỉ có thể kết thúc phòng đang active' 
            });
        }

        // Kết thúc phòng
        await room.completeRoom();
        
        return { 
            success: true,
            message: 'Phòng thi đã kết thúc thành công',
            status: room.status,
            endTime: room.endTime,
        };
        } catch (error) {
          return { 
            success: false,
            message: 'Lỗi khi kết thúc phòng',
            error: error.message 
          };
        }
    }   

    // Lấy thông tin phòng qua Code
    async function getRoomByCode(req, res) {
        try {
          console.log("req.params.roomCode", req.params.roomCode)
          const room = await QuizRoom.findOne({ roomCode: req.params.roomCode })
                .populate('quiz')
                .populate('host')
                .populate({
                    path: 'participants',
                    populate: {
                        path: 'user',
                        select: 'name imageUrl'
                    }
                })
                .populate('questionOrder');

            if (!room) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Không tìm thấy phòng thi với mã này' 
                });
            }

            res.json({
                success: true,
                data: room
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                message: 'Lỗi khi lấy thông tin phòng',
                error: error.message 
            });
        }
    }

    // Lấy thông tin phòng qua id
    async function getRoomById(req, res) {
        try {
          // Kiểm tra nếu id là MongoDB ObjectId hợp lệ
          if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ 
              success: false,
              message: 'ID phòng không hợp lệ' 
            });
          }

          const room = await QuizRoom.findById(req.params.id)
            .populate('quiz')
            .populate('host')
            .populate({
              path: 'participants',
              populate: {
                path: 'user',
                select: 'name imageUrl'
              }
            })
            .populate('questionOrder');
            
          if (!room) {
            return res.status(404).json({ 
              success: false,
              message: 'Không tìm thấy phòng thi' 
            });
          }
          res.json({ 
            success: true,
            data: room 
          });
        } catch (error) {
          res.status(500).json({ 
            success: false,
            message: 'Lỗi khi lấy thông tin phòng',
            error: error.message 
          });
        }
    }

    // Lấy những phòng thi của host
    async function getRoomsByHost(req, res) {
        try {
        const { status, page = 1, limit = 10 } = req.query;
        const filter = { host: req.params.hostId };

        if (status) filter.status = status;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 },
            populate: [
            { path: 'quiz', select: 'name topic' },
            { path: 'participants', select: 'score', options: { limit: 3, sort: { score: -1 } }}
            ]
        };

        const rooms = await QuizRoom.paginate(filter, options);

        res.json({ 
            success: true,
            data: rooms 
        });
        } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Lỗi khi lấy danh sách phòng',
            error: error.message 
        });
        }
    }

    // Cập nhật room khi chưa active
    async function updateRoomScheduled(req, res) {
        try {
            const { quizId, durationMinutes, startTime } = req.body;
            const roomId = req.params.id;
            console.log(roomId)
    
            // 1. Kiểm tra phòng tồn tại
            const room = await QuizRoom.findById(roomId);
            if (!room) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Không tìm thấy phòng thi' 
                });
            }
    
            // 2. Kiểm tra quyền host
            if (room.host.toString() !== req.userId) {
                return res.status(403).json({ 
                    success: false,
                    message: 'Chỉ chủ phòng mới được cập nhật thông tin' 
                });
            }
    
            // 3. Chuẩn bị dữ liệu cập nhật
            const updates = {};
            let canUpdateQuiz = false;
    
            // 4. Xử lý theo trạng thái phòng
            if (room.status === 'scheduled') {
                canUpdateQuiz = true;
                
                if (quizId !== undefined) {
                    const quiz = await Quiz.findById(quizId);
                    if (!quiz) {
                        return res.status(404).json({ 
                            success: false,
                            message: 'Không tìm thấy quiz' 
                        });
                    }
                    updates.quiz = quizId;
                }
    
                if (startTime !== undefined) {
                    if (new Date(startTime) < new Date()) {
                        return res.status(400).json({ 
                            success: false,
                            message: 'Thời gian bắt đầu phải trong tương lai' 
                        });
                    }
                    updates.startTime = startTime;
                    updates.autoStart = true;
                }
    
                if (durationMinutes !== undefined) {
                    updates.durationMinutes = durationMinutes;
                }
    
            }else if(room.status === 'active'){
              return res.status(400).json({ 
                success: false,
                message: 'Không thể cập nhật startTime khi phòng đang active'  
              });
            } else{
              return res.status(400).json({ 
                success: false,
                message: 'Không thể cập nhật phòng đã kết thúc hoặc bị hủy' 
              });
            }
    
            // 5. Thực hiện cập nhật
            const updatedRoom = await QuizRoom.findByIdAndUpdate(
                roomId,
                updates,
                { new: true }
            ).populate('quiz', 'name topic');
    
            res.json({ 
                success: true,
                message: 'Cập nhật phòng thành công',
                data: updatedRoom 
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                message: 'Lỗi khi cập nhật phòng',
                error: error.message 
            });
        }
    }

    // Cập nhật khi phòng đã active
    async function updateRoomActive(socket, data) {
        const session = await mongoose.startSession();
        session.startTransaction();
      
        console.log("Đã vào controller của updateRoomActive")
        try {
          const { durationMinutes, roomId, userId } = data;
      
          // 1. Kiểm tra phòng
          const room = await QuizRoom.findById(roomId).session(session);
          if (!room) {
            await session.abortTransaction();
            return { success: false, message: 'Phòng không tồn tại' };
          }
      
          // // 2. Kiểm tra quyền host
          if (room.host.toString() !== userId) {
            return { 
                success: false,
                message: 'Chỉ chủ phòng mới được cập nhật thông tin' 
            };
          }
      
          // 3. Validate
          if (room.status !== 'active') {
            await session.abortTransaction();
            return { success: false, message: 'Phòng không hoạt động' };
          }
      
          if (!durationMinutes || durationMinutes <= 0) {
            await session.abortTransaction();
            return { success: false, message: 'Thời lượng phải > 0' };
          }
      
          // 4. Tính toán endTime mới
          const newEndTime = new Date(room.startTime.getTime() + durationMinutes * 60000);
          if (newEndTime <= new Date()) {
            await session.abortTransaction();
            return { success: false, message: 'Thời gian kết thúc phải ở tương lai' };
          }
      
          // 5. Cập nhật database
          const updatedRoom = await QuizRoom.findByIdAndUpdate(
            roomId,
            { durationMinutes, endTime: newEndTime },
            { new: true, session }
          );
      
          await session.commitTransaction();
          return {
            success: true,
            endTime: newEndTime,
            QuizRoom: updatedRoom
          };
      
        } catch (error) {
          await session.abortTransaction();
          console.error('Lỗi khi cập nhật phòng:', error);
          return { success: false, message: 'Lỗi server' };
        } finally {
          session.endSession();
        }
    }

    // Xóa phòng
    async function deleteRoom(req, res) {
        try {
        const room = await QuizRoom.findById(req.params.id);
        
        if (!room) {
            return res.status(404).json({ 
            success: false,
            message: 'Không tìm thấy phòng thi' 
            });
        }

        // Kiểm tra quyền
        if (room.host.toString() !== req.userId) {
            return res.status(403).json({ 
            success: false,
            message: 'Chỉ chủ phòng mới được xóa phòng' 
            });
        }

        // Xóa các dữ liệu liên quan
        await Participant.deleteMany({ quizRoom: req.params.id });
        await Submission.deleteMany({ quizRoom: req.params.id });
        await QuizRoom.findByIdAndDelete(req.params.id);

        res.json({ 
            success: true,
            message: 'Phòng thi đã được xóa thành công' 
        });
        } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Lỗi khi xóa phòng',
            error: error.message 
        });
        }
    }

    // Lấy dữ liệu endTime khi reload lại
    async function getQuizRoomEndTime(roomId){
      try {
        const room = await QuizRoom.findById(roomId);
        if (!room) return callback({ success: false, message: 'Phòng không tồn tại' });
    
        return {
          success: true,
          endTime: room.endTime
        }
      } catch (err) {
        return callback({ success: false, message: 'Lỗi server' });
      }
    }

    // Lấy kết quả chi tiết của phòng thi (Chưa test kỹ)
    async function getRoomResults(req, res) {
        try {
        const room = await QuizRoom.findById(req.params.id)
            .populate('quiz')
            .populate({
            path: 'participants',
            populate: {
                path: 'user',
                select: 'name imageUrl'
            }
            });

        if (!room) {
            return res.status(404).json({ 
            success: false,
            message: 'Không tìm thấy phòng thi' 
            });
        }

        // Kiểm tra quyền
        if (room.host.toString() !== req.user._id) {
            return res.status(403).json({ 
            success: false,
            message: 'Chỉ chủ phòng mới được xem kết quả' 
            });
        }

        // Lấy tất cả bài nộp
        const submissions = await Submission.find({ quizRoom: req.params.id })
            .populate('question');

        // Tổng hợp kết quả
        const results = {
            roomInfo: {
            roomCode: room.roomCode,
            quizName: room.quiz.name,
            totalParticipants: room.participants.length,
            startTime: room.startTime,
            endTime: room.endTime,
            durationMinutes: room.durationMinutes
            },
            leaderboard: room.participants
            .sort((a, b) => b.score - a.score)
            .map(p => ({
                id: p._id,
                user: p.user,
                score: p.score,
                isLoggedIn: p.isLoggedIn
            })),
            questionStats: this._calculateQuestionStats(submissions, room.quiz.questions)
        };

        res.json({ 
            success: true,
            data: results 
        });
        } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Lỗi khi lấy kết quả phòng',
            error: error.message 
        });
        }
    }

    // ===== CÁC PHƯƠNG THỨC HỖ TRỢ ===== //

    /**
     * Tính toán thống kê câu hỏi
     */
    async function _calculateQuestionStats(submissions, questions) {
        const stats = {};
        
        // Khởi tạo thống kê cho từng câu hỏi
        questions.forEach(q => {
        stats[q._id] = {
            questionText: q.questionText,
            type: q.questionType,
            totalAnswers: 0,
            correctAnswers: 0,
            correctRate: 0
        };
        });

        // Đếm số lượng câu trả lời
        submissions.forEach(sub => {
        if (stats[sub.question._id]) {
            stats[sub.question._id].totalAnswers++;
            if (sub.isCorrect) {
            stats[sub.question._id].correctAnswers++;
            }
        }
        });

        // Tính tỷ lệ trả lời đúng
        Object.keys(stats).forEach(key => {
        if (stats[key].totalAnswers > 0) {
            stats[key].correctRate = 
            Math.round((stats[key].correctAnswers / stats[key].totalAnswers) * 100);
        }
        });

        return stats;
    }

export { createRoom, startRoom, endRoom, getRoomByCode, getRoomById, getRoomsByHost, updateRoomScheduled, updateRoomActive, deleteRoom, getQuizRoomEndTime, getRoomResults, _calculateQuestionStats }

