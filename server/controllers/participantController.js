import Participant from '../models/Participant.js';
import QuizRoom from '../models/QuizRoom.js';
import Question from '../models/Question.js';
import Quiz from '../models/Quiz.js';


  // Tham gia phong thi
  async function joinRoom(socket, data) {
    console.log('=== START JOIN ROOM ===');
    try {
      const { roomCode, temporaryUsername, userId, deviceInfo} = data;
      
      console.log('Joining room with data:', { roomCode, userId, temporaryUsername });
      
      // Tìm phòng thi
      const room = await QuizRoom.findOne({ roomCode });
      
      if (!room) {
        throw new Error('Phòng thi không tồn tại');
      }

      console.log('Found room:', {
        roomId: room._id,
        quizId: room.quiz,
        status: room.status
      });

      // Tìm quiz
      const quiz = await Quiz.findById(room.quiz);
      
      if (!quiz) {
        throw new Error('Không tìm thấy bài thi');
      }

      console.log('Found quiz:', {
        quizId: quiz._id,
        questionsCount: quiz.questions?.length
      });

      if (room.status !== 'active') {
        throw new Error('Phòng thi chưa mở');
      }

      // Kiểm tra người dùng đã tham gia chưa
      let participant;

      if (userId) {
        participant = await Participant.findOne({
          quizRoom: room._id,
          user: userId
        });
      } else {
        participant = await Participant.findOne({
          quizRoom: room._id,
          temporaryUsername
        });
      }
      
      // Tạo mới nếu chưa tham gia
      if (!participant) {
        // Xáo trộn câu hỏi
        const shuffledQuestions = [...quiz.questions].sort(() => 0.5 - Math.random());
        
        // Tạo participant mới với đầy đủ thông tin
        const participantData = {
          quizRoom: room._id,
          quiz: quiz._id,
          user: userId || 'anonymous', // Sử dụng userId trực tiếp từ client
          temporaryUsername,
          isLoggedIn: !!userId,
          deviceInfo,
          connectionId: socket.id,
          remainingQuestions: shuffledQuestions,
          answeredQuestions: []
        };

        console.log('Creating new participant with data:', {
          ...participantData,
          quizId: participantData.quiz?.toString(),
          quizRoomId: participantData.quizRoom?.toString(),
          userId: participantData.user
        });

        // Tạo và lưu participant
        try {
          participant = await Participant.create(participantData);
          console.log('Participant created successfully:', {
            participantId: participant._id,
            quizId: participant.quiz?.toString(),
            quizRoomId: participant.quizRoom?.toString(),
            userId: participant.user
          });
        } catch (createError) {
          console.error('Error creating participant:', createError);
          throw new Error('Lỗi khi tạo người tham gia: ' + createError.message);
        }
      } else {
        // Cập nhật thông tin nếu đã tham gia
        participant.connectionId = socket.id;
        participant.lastActive = new Date();
        participant.deviceInfo = deviceInfo;
        await participant.save();
      }

      // Thêm vào phòng nếu chưa có
      if (!room.participants.includes(participant._id)) {
        room.participants.push(participant._id);
        await room.save();
      }

      // Lấy danh sách câu hỏi chưa làm
      const remainingQuestions = await Question.find({
        _id: { $in: participant.remainingQuestions }
      });

      // Lấy danh sách câu hỏi đã làm (chỉ ID)
      const answeredQuestionIds = participant.answeredQuestions.map(q => q.questionId);

      console.log('=== END JOIN ROOM ===');
      return {
        success: true,
        participant,
        remainingQuestions: remainingQuestions.map(q => _formatQuestion(q)),
        answeredQuestions: answeredQuestionIds,
        endTime: room.endTime,
        timeRemaining: room.timeRemaining,
        progress: {
          answered: participant.answeredQuestions.length,
          total: quiz.questions.length
        }
      };
    } catch (error) {
      console.error('Error in joinRoom:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Xử lý khi người dùng mất kết nối
  async function handleDisconnect(connectionId) {
    try {
      const participant = await Participant.findOne({ connectionId });
      if (participant) {
        participant.connectionId = null;
        participant.lastActive = new Date();
        await participant.save();
      }
      return true;
    } catch (error) {
      console.error('Lỗi khi xử lý ngắt kết nối:', error);
      return false;
    }
  }

  // Lấy thông tin khi reload lại trang
  async function getParticipantStatus(participantId) {
    try {
      const participant = await Participant.findById(participantId)
        .populate('remainingQuestions')
        .populate('answeredQuestions.questionId');
  
      if (!participant) {
        throw new Error('Người tham gia không tồn tại');
      }
  
      return {
        success: true,
        data: {
          quizRoom: participant.quizRoom,
          currentQuestion: participant.remainingQuestions[0] || 
                          participant.answeredQuestions[participant.answeredQuestions.length - 1]?.questionId,
          remainingQuestions: participant.remainingQuestions,
          answeredQuestions: participant.answeredQuestions.map(aq => aq.questionId),
          progress: {
            answered: participant.answeredQuestions.length,
            total: participant.answeredQuestions.length + participant.remainingQuestions.length
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
  // format lại cho phần câu hỏi còn lại
  async function _formatQuestion(question) {
    const formatted = {
      _id: question._id,
      questionText: question.questionText,
      questionType: question.questionType,
      difficulty: question.difficulty,
      options: question.options,
      dragDropPairs: question.dragDropPairs
    };
    
    // Ẩn đáp án đúng
    if (question.questionType === 'multipleChoices' || question.questionType === 'dropdown') {
      formatted.options = question.options.map(opt => ({ text: opt }));
    }
    
    return formatted;
  }

export { joinRoom, handleDisconnect, getParticipantStatus, _formatQuestion }
 