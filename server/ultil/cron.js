import cron from 'node-cron';
import QuizRoom from '../models/QuizRoom.js';


const startCronJobs = (io) => {
    cron.schedule('*/30 * * * * *', async () => {
      const now = new Date();
      try {
        const opened = await QuizRoom.autoActivateRooms();
        const closed = await QuizRoom.autoCompleteRooms();
        
        if (opened.length > 0 || closed.length > 0) {
          const openedCodes = opened.map(room => room.roomCode).join(', ');
          const closedCodes = closed.map(room => room.roomCode).join(', ');

        console.log(`[CRON][OC] Mở ${opened.length} phòng (${openedCodes}), Đóng ${closed.length} phòng (${closedCodes})`);
          
          // Phát sự kiện cho tất cả client biết phòng đã mở hoặc đóng
          opened.forEach(room => {
            io.to(room.host.toString()).emit('roomActivated', room);
          });
          
          closed.forEach(room => {
            io.to(room.host.toString()).emit('roomCompleted', room);
          });
        }
      } catch (error) {
        console.error('[CRON ERROR]', error);
      }
    });
  };
export default startCronJobs;