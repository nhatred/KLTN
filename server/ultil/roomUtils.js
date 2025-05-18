import QuizRoom from '../models/QuizRoom.js';

const generateRoomCode = async () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  let exists;
  
  // Đảm bảo mã phòng là duy nhất
  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    exists = await QuizRoom.exists({ roomCode: code });
  } while (exists);

  console.log(code)
  return code;

};

export default generateRoomCode;