import {
  joinRoom,
  handleDisconnect,
  getParticipantStatus,
} from "../controllers/participantController.js";
import {
  submitAnswer,
  submitAnswerRoom,
  syncSubmissions,
} from "../controllers/submissionController.js";
import {
  endRoom,
  getQuizRoomEndTime,
  updateRoomActive,
} from "../controllers/QuizRoomController.js";
import Participant from "../models/Participant.js";
import QuizRoom from "../models/QuizRoom.js";

const setupQuizSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Tham gia phòng thi
    socket.on("joinRoom", async (data, callback) => {
      console.log("Received joinRoom request:", data);
      const result = await joinRoom(socket, data);
      console.log("JoinRoom result:", result);

      if (result.success && result.participant) {
        socket.join(`room_${result.participant.quizRoom}`);
        socket.join(`participant_${result.participant._id}`);

        // Gửi danh sách câu hỏi chưa làm và đã làm
        callback({
          success: result.success,
          participant: result.participant,
          questions: {
            remaining: result.remainingQuestions || [],
            answered: result.answeredQuestions || [],
          },
          progress: result.progress || {
            answered: 0,
            total: result.participant.questionOrder?.length || 0,
          },
        });

        // Thông báo cho tất cả người dùng trong phòng về người tham gia mới
        try {
          const updatedRoom = await QuizRoom.findById(
            result.participant.quizRoom
          )
            .populate("participants")
            .populate({
              path: "participants",
              populate: {
                path: "user",
                select: "name imageUrl",
              },
            });

          if (updatedRoom) {
            // Chỉ gửi thông tin participant mới
            io.to(`room_${result.participant.quizRoom}`).emit(
              "participantJoined",
              {
                participant: result.participant,
                roomId: result.participant.quizRoom,
              }
            );
          }
        } catch (error) {
          console.error("Error updating room participants:", error);
        }
      } else {
        callback({
          success: false,
          message: result.message || "Không thể tham gia phòng",
        });
      }
    });

    // Khi reload
    // Join
    socket.on("joinRoomByParticipant", async ({ participantId }) => {
      try {
        const participant = await Participant.findById(participantId);
        if (!participant) {
          return socket.emit("error", {
            message: "Không tìm thấy người tham gia",
          });
        }

        participant.connectionId = socket.id;
        participant.lastActive = new Date();
        await participant.save();

        // tham gia lại room
        socket.join(`room_${participant.quizRoom._id}`);
      } catch (err) {
        console.error(err);
      }
    });
    // Pratical
    socket.on("getParticipantStatus", async (data, callback) => {
      const result = await getParticipantStatus(data.participantId);
      callback(result);
    });
    // EndTime
    socket.on("getRoomEndTime", async (roomId, callback) => {
      const result = await getQuizRoomEndTime(roomId);
      callback(result);
    });

    // Nộp câu trả lời
    socket.on("submitAnswer", async (data, callback) => {
      const result = await submitAnswer(socket, data);
      if (result.success) {
        // Gửi cập nhật danh sách câu hỏi
        socket.to(`participant_${data.participantId}`).emit("questionsUpdate", {
          remaining: result.remainingQuestions,
          answered: result.answeredQuestions,
          progress: result.progress,
        });
      }
      callback(result);
    });

    // Add new submitAnswerRoom handler
    socket.on("submitAnswerRoom", async (data, callback) => {
      try {
        console.log("Received submitAnswerRoom request:", data);
        const result = await submitAnswerRoom(socket, data);
        console.log("submitAnswerRoom result:", result);
        callback(result);
      } catch (error) {
        console.error("Error in submitAnswerRoom:", error);
        callback({
          success: false,
          message: error.message || "Lỗi khi nộp câu trả lời",
        });
      }
    });

    // Cập nhật Time khi Active
    socket.on("updateRoomActive", async (data, callback) => {
      try {
        const result = await updateRoomActive(socket, data);
        callback(result);

        if (result.success) {
          io.to(`room_${data.roomId}`).emit("room:time_updated", {
            endTime: result.endTime,
            // updatedBy: socket.auth.userId
          });
          console.log(
            "Đã phát sự kiện room:time_updated với endTime:",
            result.endTime
          );
        }
      } catch (error) {
        callback({
          success: false,
          message: "Lỗi server khi cập nhật phòng",
        });
      }
    });

    socket.on("joinUserRoomManager", async (roomId) => {
      try {
        console.log("Host joining room:", roomId);
        // Join room
        socket.join(`room_${roomId}`);

        // Get initial room data
        const room = await QuizRoom.findById(roomId)
          .populate("participants")
          .populate({
            path: "participants",
            populate: {
              path: "user",
              select: "name imageUrl",
            },
          });

        if (room) {
          // Send initial room data to host
          socket.emit("roomData", room);
        }
      } catch (err) {
        console.error("Error in joinUserRoomManager:", err);
      }
    });

    socket.on("closeRoom", async (data, callback) => {
      try {
        const result = await endRoom(socket, data);

        if (result.success) {
          // Gửi thông báo cho tất cả người dùng trong phòng
          io.to(`room_${data.roomId}`).emit("room:ended", {
            roomId: data.roomId,
            status: result.status,
            endTime: result.endTime,
          });

          // Gửi thông báo cho host
          io.to(data.userId).emit("room:ended", {
            roomId: data.roomId,
            status: result.status,
            endTime: result.endTime,
          });

          console.log("Đã phát sự kiện room:ended");
        }

        callback(result);
      } catch (error) {
        console.error("Lỗi khi xử lý đóng phòng:", error);
        callback({
          success: false,
          message: "Lỗi server khi đóng phòng",
        });
      }
    });

    // Đồng bộ trạng thái khi kết nối lại
    socket.on("syncStatus", async (participantId, callback) => {
      const participantResult = await getParticipantStatus(participantId);
      const submissionResult = await syncSubmissions(participantId);

      callback({
        participant: participantResult,
        submissions: submissionResult,
      });
    });

    // Xử lý ngắt kết nối
    socket.on("disconnect", async () => {
      console.log("Client disconnected:", socket.id);
      const result = await handleDisconnect(socket);

      if (result.success && result.participant) {
        // Thông báo cho những người còn lại trong phòng
        io.to(`room_${result.participant.quizRoom}`).emit("participantLeft", {
          participantId: result.participant._id,
          roomId: result.participant.quizRoom,
        });
      }
    });
  });
};

export default setupQuizSocket;
