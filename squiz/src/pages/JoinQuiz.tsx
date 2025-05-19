import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import "../style/linearbg.css";
import "../style/animatedBackground.css";
import "../style/switch.css";
import "../style/dashboard.css";
import "../style/playquiz.css";
import { Quiz } from "../types/Quiz";
import { Question } from "../types/Question";
import { WelcomeScreen, LoadingScreen, ResultsScreen } from "../components/PlayScreen";
import { UserAnswer } from "../types/UserAnswer";
import { FeedbackState } from "../types/FeedbackState";
import { playSound } from "../functions/playSound";
import { useUser } from "@clerk/clerk-react";

const API_BASE_URL = "http://localhost:5000/api";

// Sound paths
const SOUNDS = {
  BACKGROUND_MUSIC: "/assets/sounds/background-music.mp3"
};

// Tạo unique device ID nếu chưa có
const getDeviceId = () => {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = 'device_' + new Date().getTime() + '_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
};

// Lưu trữ phiên chơi vào localStorage và server
const saveQuizSession = async (quizId: string, quizState: any, userAnswers: UserAnswer[], timeLeft: number, userId: string | null) => {
  const deviceId = getDeviceId();
  
  // Không lưu phiên chơi nếu đang ở màn hình kết quả
  if (quizState.showResults) {
    return;
  }
  
  // Lưu vào localStorage (backup trường hợp không có internet)
  try {
    const sessionData = {
      quizId,
      quizState,
      userAnswers,
      timeLeft,
      timestamp: new Date().getTime()
    };
    
    localStorage.setItem(`quiz_session_${quizId}`, JSON.stringify(sessionData));
    console.log('Quiz session saved to localStorage successfully');
  } catch (error) {
    console.error('Error saving quiz session to localStorage:', error);
  }
  
  // Lưu lên server (nếu có kết nối)
  try {
    console.log(`Saving quiz session to server for quiz: ${quizId}`);
    
    const response = await fetch(`${API_BASE_URL}/quiz/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        quizId,
        quizState,
        userAnswers,
        timeLeft,
        deviceId,
        userId
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        console.log('Quiz session saved to server successfully:', data.sessionId);
      } else {
        console.warn('Server declined to save quiz session:', data.message);
      }
    } else {
      console.warn(`Failed to save quiz session to server (status ${response.status})`);
    }
  } catch (error) {
    console.error('Network error saving quiz session to server:', error);
    // Tiếp tục vì đã lưu vào localStorage
  }
};

// Lấy phiên chơi quiz từ server hoặc localStorage
const getQuizSession = async (quizId: string, userId: string | null) => {
  const deviceId = getDeviceId();
  console.log(userId)
  // Thử lấy từ server trước
  try {
    console.log(`Attempting to fetch session from server for quiz: ${quizId}`);
    const response = await fetch(`${API_BASE_URL}/quiz/session?quizId=${quizId}&deviceId=${deviceId}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        console.log('Quiz session restored from server successfully');
        return data.data;
      }
    } else {
      // Xử lý các lỗi khác nhau
      if (response.status === 404) {
        console.log('No active session found on server, checking localStorage');
      } else {
        console.warn(`Server returned error ${response.status}. Falling back to localStorage`);
      }
    }
  } catch (error) {
    console.warn('Network error fetching quiz session from server, falling back to localStorage');
  }
  
  // Nếu không lấy được từ server, thử lấy từ localStorage
  try {
    console.log('Checking localStorage for quiz session');
    const sessionData = localStorage.getItem(`quiz_session_${quizId}`);
    if (!sessionData) {
      console.log('No quiz session found in localStorage');
      return null;
    }
    
    const parsedData = JSON.parse(sessionData);
    
    // Kiểm tra thời gian hết hạn (30 phút)
    const SESSION_EXPIRY = 30 * 60 * 1000; // 30 phút tính bằng milliseconds
    const now = new Date().getTime();
    if (now - parsedData.timestamp > SESSION_EXPIRY) {
      console.log('Quiz session in localStorage has expired, removing it');
      localStorage.removeItem(`quiz_session_${quizId}`);
      return null;
    }
    
    console.log('Quiz session restored from localStorage successfully');
    return parsedData;
  } catch (error) {
    console.error('Error loading quiz session from localStorage:', error);
    return null;
  }
};

// Xóa phiên chơi khi hoàn thành
const clearQuizSession = async (quizId: string) => {
  const deviceId = getDeviceId();
  
  // Xóa khỏi localStorage
  try {
    localStorage.removeItem(`quiz_session_${quizId}`);
    console.log('Quiz session cleared from localStorage');
  } catch (error) {
    console.error('Error clearing quiz session from localStorage:', error);
  }
  
  // Đánh dấu phiên chơi hoàn thành trên server
  try {
    console.log(`Marking quiz session as completed on server for quiz: ${quizId}`);
    
    const response = await fetch(`${API_BASE_URL}/quiz/session/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        quizId,
        deviceId
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        console.log('Quiz session marked as completed on server');
      } else {
        console.warn('Server could not mark quiz session as completed:', data.message);
      }
    } else {
      console.warn(`Failed to mark quiz session as completed (status ${response.status})`);
    }
  } catch (error) {
    console.error('Network error marking quiz session as completed:', error);
  }
};

export default function JoinQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isSignedIn } = useUser();
  const [quizData, setQuizData] = useState<Quiz>({
    _id: "",
    creator: "",
    name: "",
    topic: "",
    difficulty: "",
    isPublic: "public",
    questions: [] as Question[],
    imageUrl: "",
    createdAt: "",
    totalPlays: 0,
    quizRating: [],
    scorePerQuestion: 1,
    timePerQuestion: 30,
    creatorInfo: {
      name: "",
      avatar: ""
    }
  });

  // Quiz state
  const [quizState, setQuizState] = useState({
    showWelcome: true,
    showQuiz: false,
    showResults: false,
    currentQuestion: 0,
    score: 0
  });
  
  const [timeLeft, setTimeLeft] = useState<number>(quizData.timePerQuestion);
  const [timer, setTimer] = useState<ReturnType<typeof setInterval> | null>(null);  
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState>({ 
    visible: false, 
    message: "", 
    isCorrect: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skipTransition, setSkipTransition] = useState(true);
  const [showIcons, setShowIcons] = useState(true);
  const [iconFading, setIconFading] = useState(false);
  const [questionChanging, setQuestionChanging] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [fromTimeout, setFromTimeout] = useState(false);
  const [resultsSaved, setResultsSaved] = useState(false);
  const [isSessionRestored, setIsSessionRestored] = useState(false);
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);

  // Tinh tong diem
  const totalScoreValue = quizData.questions.reduce(
    (acc, question) => acc + (question.scorePerQuestion || quizData.scorePerQuestion), 
    0
  );
  
  // Khởi tạo đối tượng audio
  useEffect(() => {
    // Tạo đối tượng audio cho nhạc nền
    const bgMusic = new Audio(SOUNDS.BACKGROUND_MUSIC);
    bgMusic.loop = true;
    bgMusic.volume = 1;
    backgroundMusicRef.current = bgMusic;

    return () => {
      // Dọn dẹp khi component unmount
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
        backgroundMusicRef.current.src = '';
        backgroundMusicRef.current = null;
      }
    };
  }, []);

  // Quản lý nhạc nền
  const toggleBackgroundMusic = useCallback(() => {
    const bgMusic = backgroundMusicRef.current;
    if (!bgMusic) return;

    if (isMusicPlaying) {
      bgMusic.pause();
    } else {
      bgMusic.play()
        .then(() => {
          console.log('Music started successfully');
        })
        .catch(err => {
          console.error('Music autoplay prevented:', err);
        });
    }
    
    setIsMusicPlaying(!isMusicPlaying);
  }, [isMusicPlaying]);
  
  // Tinh phan tram diem
  const calculatePercentage = useCallback(() => {
    const percent = Math.round((quizState.score / totalScoreValue) * 100);
    return isNaN(percent) ? 0 : percent;
  }, [quizState.score, totalScoreValue]);

  // Khai bao trong loadQuestion
  const loadQuestion = useCallback(() => {
    setFeedback({ visible: false, message: "", isCorrect: false });
  }, []);

  // Chuyen qua cau hoi tiep theo
  const moveToNextQuestion = useCallback(() => {
    const nextQuestion = quizState.currentQuestion + 1;
    
    if (nextQuestion < quizData.questions.length) {
      // Animate question transition
      setQuestionChanging(true);
      
      setTimeout(() => {
        setQuizState(prev => ({
          ...prev,
          currentQuestion: nextQuestion
        }));
        setFeedback({ visible: false, message: "", isCorrect: false });
        
        // Đánh dấu câu hỏi này đến từ timeout của câu trước không
        const wasFromTimeout = fromTimeout;
        
        // Reset fromTimeout state để lần tới sẽ không bị ảnh hưởng
        setFromTimeout(false);
        
        setTimeout(() => {
          setQuestionChanging(false);
          loadQuestion();
          
          // Nếu câu hỏi này đến từ timeout, đừng đặt lại timer tự động 
          if (wasFromTimeout) {
            // Không cần làm gì thêm - đã được xử lý ở useEffect chính
          }
        }, 100);
      }, 300);
    } else {
      setQuizState(prev => ({
        ...prev,
        showQuiz: false,
        showResults: true
      }));
    }
  }, [quizState.currentQuestion, quizData.questions.length, loadQuestion, fromTimeout]);

  // Khai bao showFeedback truoc khi su dung trong handleTimeout
  const showFeedback = useCallback((correct: boolean, message: string, isTimeout = false) => {
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
    
    // Play sound effect
    playSound(correct ? 'correct' : 'incorrect');
    
    // Vibration feedback if available (mobile devices)
    if (navigator.vibrate && !correct) {
      navigator.vibrate(200);
    }
    
    setFeedback({
      visible: true,
      message,
      isCorrect: correct
    });
    
    // Reset icon state
    setShowIcons(true);
    setIconFading(false);
    
    // Hide icons after 1 second with fade out animation
    setTimeout(() => {
      setIconFading(true);
      setTimeout(() => {
        setShowIcons(false);
      }, 600);
    }, 1000);

    // Nếu là timeout, đánh dấu câu hỏi tiếp theo là từ timeout
    if (isTimeout) {
      setFromTimeout(true);
    }
    
    // Always proceed to next question after a delay, even for timeout
    setTimeout(() => {
      moveToNextQuestion();
    }, 3000);
  }, [moveToNextQuestion, setFeedback, setShowIcons, setIconFading]);

  // Xử lý khi hết giờ
  const handleTimeout = useCallback(() => {
    // Chỉ xử lý nếu thực sự hết thời gian
    // Thêm kiểm tra trạng thái feedback để tránh gọi lại nhiều lần
    if (timeLeft > 0 || feedback.visible) return;
    
    // Play timeout sound
    playSound('timeout');
    
    // Vibration feedback if available
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 100]);
    }
    
    // Record that the user didn't answer this question
    setUserAnswers(prev => [
      ...prev,
      {
        questionIndex: quizState.currentQuestion,
        userAnswer: -1,
        correct: false,
        questionId: quizData.questions[quizState.currentQuestion]?._id || '',
        timeToAnswer: quizData.timePerQuestion - 0  // Full time used
      }
    ]);

    // Show timeout feedback and auto-advance after 3 seconds
    showFeedback(false, "Hết thời gian! Bạn không chọn đáp án kịp thời.", true);
  }, [quizState.currentQuestion, showFeedback, timeLeft, feedback.visible, quizData.questions, quizData.timePerQuestion]);

  // Lay du lieu quiz
  const getQuizData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/quiz/${id}`);
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      const responseData = data.data;
      
      if (!responseData || !responseData.questions || responseData.questions.length === 0) {
        setError("Khong tim thay cau hoi nao cho quiz nay.");
        setIsLoading(false);
        return;
      }
      
      setQuizData(responseData);
      setTimeLeft(responseData.timePerQuestion || 30);
      setIsLoading(false);
      
    } catch (error) {
      console.error("Error fetching quiz data:", error);
      setError("Khong the tai du lieu quiz. Vui long thu lai sau.");
      setIsLoading(false);
    }
  }, [id]);

  // Lay du lieu quiz ban dau
  useEffect(() => {
    getQuizData();
    
    // Xoa timer khi component huy
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [getQuizData]);

  // Timer effect
  useEffect(() => {
    // Chỉ xử lý timeout nếu:
    // 1. Đang hiển thị quiz
    // 2. Thời gian đã hết
    // 3. Không có feedback nào đang hiển thị
    if (quizState.showQuiz && timeLeft <= 0 && !feedback.visible) {
      handleTimeout();
    }
    
    // Trigger a pulsing effect when time is low
    if (timeLeft <= 5 && timeLeft > 0) {
      const progressBar = document.querySelector('.progress-bar');
      if (progressBar) {
        progressBar.classList.add('urgent');
        
        // Optional: Play a subtle tick sound when time is low
        if (timeLeft <= 3) {
          try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
          } catch (e) {
            console.log('Tick sound failed:', e);
          }
        }
      }
    } else {
      const progressBar = document.querySelector('.progress-bar');
      if (progressBar) {
        progressBar.classList.remove('urgent');
      }
    }
  }, [timeLeft, quizState.showQuiz, handleTimeout, feedback.visible]);

  // Effect hien thi thanh tien trinh
  useEffect(() => {
    if (!quizState.showQuiz) return;
    
    const currentQ = quizData.questions[quizState.currentQuestion];
    if (!currentQ) return;
    
    const questionTime = currentQ.timePerQuestion || quizData.timePerQuestion;
    
    // Khi chuyển câu hỏi, tắt transition tạm thời
    setSkipTransition(true);
    
    // Đặt lại thời gian cho câu hỏi mới
    setTimeLeft(questionTime);
    
    // Bật lại transition sau khi render
    setTimeout(() => {
      setSkipTransition(false);
    }, 50);
    
    // Xoa timer ton tai
    if (timer) {
      clearInterval(timer);
    }
    
    // Đặc biệt xử lý trường hợp câu hỏi đến từ timeout
    // Để tránh tự động bắt đầu đếm ngược ngay
    if (fromTimeout) {
      // Không khởi tạo timer mới, để tránh tự động chuyển sang câu tiếp theo
      console.log("Câu hỏi này đến từ timeout, không bắt đầu timer ngay lập tức");
      return;
    }
    
    // Bat dau timer moi
    const newTimer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(newTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setTimer(newTimer);
    
    // Reset feedback state when moving to a new question
    setFeedback({ visible: false, message: "", isCorrect: false });
    
    return () => {
      clearInterval(newTimer);
    };
  }, [quizState.currentQuestion, quizState.showQuiz, quizData.questions, quizData.timePerQuestion, fromTimeout]);

  // Quản lý nhạc nền khi chuyển trạng thái
  useEffect(() => {
    const bgMusic = backgroundMusicRef.current;
    if (!bgMusic || !isMusicPlaying) return;
    
    // Nếu đang hiển thị quiz và nhạc nền đang được kích hoạt
    if (quizState.showQuiz) {
      bgMusic.play().catch(err => console.log("Music playback failed:", err));
    } else if (quizState.showResults) {
      // Dừng nhạc khi hoàn thành bài kiểm tra
      bgMusic.pause();
    }
  }, [quizState.showQuiz, quizState.showResults, isMusicPlaying]);

  // Quiz control functions
  const startQuiz = useCallback(() => {
    if (quizData.questions.length === 0) {
      setError("Khong the bat dau quiz vi khong co cau hoi nao.");
      return;
    }
    
    setQuizState({
      showWelcome: false,
      showQuiz: true,
      showResults: false,
      currentQuestion: 0,
      score: 0
    });
    setUserAnswers([]);
    
    setTimeout(loadQuestion, 100);
  }, [quizData.questions, loadQuestion]);

  // Update handleOptionClick to collect more data
  const handleOptionClick = useCallback((optionIndex: number) => {
    if (timer) clearInterval(timer);
    if (feedback.visible) return; // Ngung nhieu lan click
    
    // Add button press effect
    const buttonEl = document.querySelector(`.answer-card:nth-child(${optionIndex + 1})`);
    if (buttonEl) {
      buttonEl.classList.add('scale-95');
      setTimeout(() => {
        buttonEl.classList.remove('scale-95');
      }, 150);
    }
    
    const currentQ = quizData.questions[quizState.currentQuestion];
    // Kiem tra xem dap an nay dung hay sai
    const correct = currentQ?.answers[optionIndex]?.isCorrect === true;
    
    // Calculate time taken
    const maxTime = currentQ?.timePerQuestion || quizData.timePerQuestion;
    const timeTaken = maxTime - timeLeft;
    
    // Save more comprehensive answer data
    setUserAnswers(prev => [
      ...prev,
      {
        questionIndex: quizState.currentQuestion,
        questionId: currentQ?._id || '',
        userAnswer: optionIndex,
        correct,
        score: correct ? (currentQ?.scorePerQuestion || quizData.scorePerQuestion) : 0,
        timeToAnswer: timeTaken
      }
    ]);

    // Normal case - show feedback and award points if correct
    if (correct) {
      setQuizState(prev => ({
        ...prev, 
        score: prev.score + (currentQ?.scorePerQuestion || quizData.scorePerQuestion)
      }));
      showFeedback(true, "Chính xác! Làm tốt lắm!");
    } else {
      showFeedback(false, "Sai rồi. Hãy thử lại nhé!");
    }
  }, [quizData, quizState.currentQuestion, feedback.visible, showFeedback, timeLeft]);

  const retryQuiz = useCallback(() => {
    startQuiz();
  }, [startQuiz]);

  

  // Get time display class based on time left
  const getTimeDisplayClass = () => {
    if (timeLeft <= 5) return "time-display danger";
    if (timeLeft <= 10) return "time-display warning";
    return "time-display";
  };

  // Thêm hàm để bắt đầu câu hỏi khi người dùng sẵn sàng
  const startCurrentQuestion = useCallback(() => {
    // Bắt đầu đếm ngược cho câu hỏi hiện tại
    const currentQ = quizData.questions[quizState.currentQuestion];
    if (!currentQ) return;
    
    const questionTime = currentQ.timePerQuestion || quizData.timePerQuestion;
    setTimeLeft(questionTime);
    
    // Xóa timer cũ nếu có
    if (timer) {
      clearInterval(timer);
    }
    
    // Bắt đầu timer mới
    const newTimer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(newTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setTimer(newTimer);
    
    // Đã bắt đầu câu hỏi, không còn là từ timeout nữa
    setFromTimeout(false);
  }, [quizData.questions, quizState.currentQuestion, quizData.timePerQuestion]);

  // Render cau hoi
  const renderQuestion = () => {
    const currentQ = quizData.questions[quizState.currentQuestion];
    if (!currentQ) return null;
    
    const maxTime = currentQ?.timePerQuestion || quizData.timePerQuestion;
    const progressPercent = (timeLeft / maxTime) * 100;
    
    // Tao thanh tien trinh
    const timeMarkers = [];
    for (let i = 1; i < maxTime; i++) {
      if (i % 5 === 0 || maxTime <= 10) {  
        const position = (i / maxTime) * 100;
        timeMarkers.push(
          <div 
            key={i} 
            className="absolute h-full w-0.5 bg-gray-600" 
            style={{left: `${position}%`}}
          />
        );
      }
    }
    
    return (
      <div className="relative z-10 w-full h-screen box-shadow bg-gray-900 p-6">
        <header className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden progress-bar relative">
              {timeMarkers}
              <div 
                className="h-full"
                  style={{ 
                  width: `${progressPercent}%`,
                  transitionProperty: skipTransition ? 'none' : 'width',
                  transitionDuration: '1s',
                  transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  background: 'linear-gradient(90deg, #FF0000 0%, #FFA500 100%)'
                }}
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            
            {/* Music toggle button */}
            <button 
              onClick={toggleBackgroundMusic}
              className={`ml-2 music-btn ${isMusicPlaying ? 'playing' : ''}`}
              aria-label={isMusicPlaying ? "Tắt nhạc" : "Bật nhạc"}
              title={isMusicPlaying ? "Tắt nhạc" : "Bật nhạc"}
            >
              <span className="text-white text-xl">
                {isMusicPlaying ? "🔊" : "🔇"}
              </span>
            </button>
          </div>
          
          <div className="flex justify-between text-xl items-center text-background">
            <span className="font-medium">{`Câu hỏi ${quizState.currentQuestion + 1}/${quizData.questions.length}`}</span>
            <span className={getTimeDisplayClass()}>{`⏱️ ${timeLeft}s`}</span>
            <span className="font-medium text-orange">{`Điểm: ${quizState.score}`}</span>
          </div>
        </header>
        
        {/* Nếu đến từ timeout, hiển thị nút bắt đầu */}
        {fromTimeout && (
          <div className="absolute z-20 inset-0 flex items-center justify-center bg-black bg-opacity-70">
            <div className="px-6 py-10 bg-gray-900 rounded-lg text-center text-orange max-w-lg">
              <h3 className="text-2xl font-bold mb-4">Bạn đã sẵn sàng cho câu hỏi tiếp theo?</h3>
              <p className="mb-6 text-background">Câu hỏi trước đã hết thời gian. Hãy tập trung nhé!</p>
              <button
                onClick={startCurrentQuestion}
                className="px-6 py-3 bg-orange text-background rounded-lg btn-hover transition-colors font-bold"
              >
                Bắt đầu
              </button>
            </div>
          </div>
        )}
        
        <main className={`w-full h-full grid grid-rows-5 gap-6 pb-10 ${questionChanging ? 'opacity-0' : 'question-container'}`}>
          {/* Question code preview */}
          {currentQ?.questionText && (
            <div className="h-80 flex justify-center row-span-2 items-center overflow-auto py-4 px-16 text-center bg-gray-900 rounded-lg shadow-inner">
              <pre className="text-orange text-2xl font-bold whitespace-pre-wrap">
                {currentQ.questionText}
              </pre>
            </div>
          )}
          
          {/* Answer options */}
          <div className="flex flex-col mt-2 mb-5 row-span-3">
            {feedback.visible && (
              <div 
                className={`p-4 mb-4 rounded-lg font-bold feedback-message ${
                  feedback.isCorrect ? 'bg-green-100 text-green-800 border-green-500' : 'bg-red-100 text-red-800 border-red-500'
                }`}
                role="alert"
              >
                <div className="flex items-center">
                  <span className="text-2xl mr-2">{feedback.isCorrect ? '✓' : '✗'}</span>
                  <span>{feedback.message}</span>
                </div>
                <div className="mt-2 text-sm opacity-80">
                  {feedback.isCorrect 
                    ? "Tiếp tục phát huy nhé!" 
                    : "Đừng lo lắng, hãy tiếp tục cố gắng!"}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-4 gap-3 h-full mt-2 mb-5">
              {currentQ?.answers.map((option, index) => {
                const lastUserAnswer = userAnswers[userAnswers.length - 1];
                const isSelected = feedback.visible && lastUserAnswer?.userAnswer === index;
                
                let cardClass = 'answer-card';
                if (feedback.visible) {
                  if (option.isCorrect) {
                    cardClass += ' correct';
                    if (!showIcons) cardClass += ' icon-hidden';
                    if (iconFading) cardClass += ' icon-fading';
                  } else if (isSelected) {
                    cardClass += ' incorrect';
                    if (!showIcons) cardClass += ' icon-hidden';
                    if (iconFading) cardClass += ' icon-fading';
                  } else {
                    cardClass += ' dimmed'; // Làm mờ các đáp án không được chọn
                  }
                }
                
                // Card color theo index
                const cardColors = [
                  {bg: 'mediumturquoise', accent: 'lightblue'},
                  {bg: '#9c27b0', accent: '#ce93d8'},
                  {bg: '#ff9800', accent: '#ffcc80'},
                  {bg: '#4caf50', accent: '#a5d6a7'}
                ];
                
                const colorStyle = !feedback.visible ? {
                  background: cardColors[index % cardColors.length].bg
                } : {};
                
                return (
                  <button
                    key={index}
                    onClick={() => handleOptionClick(index)}
                    className={`${cardClass} transition-transform`}
                    disabled={feedback.visible}
                    aria-pressed={isSelected}
                    style={colorStyle}
                  >
                    <style>
                      {`.answer-card:nth-child(${index + 1})::before, 
                         .answer-card:nth-child(${index + 1})::after {
                          ${!feedback.visible ? `background-color: ${cardColors[index % cardColors.length].accent};` : ''}
                         }`}
                    </style>
                    <span className="answer-card-content">
                     
                      {option.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    );
  };

  // Tự động lưu phiên làm quiz mỗi khi có thay đổi
  useEffect(() => {
    if (!id || !quizState.showQuiz || isLoading || quizState.showResults) return;
    
    // Lưu trạng thái hiện tại
    const currentTimestamp = new Date().getTime();
    saveQuizSession(id, quizState, userAnswers, timeLeft, isSignedIn ? user?.id : null);
    
  }, [id, quizState, userAnswers, timeLeft, isLoading, isSignedIn, user?.id]);

  // Khôi phục phiên làm quiz khi tải trang
  useEffect(() => {
    if (!id || isSessionRestored || !quizData._id) return;
    
    // Hàm async để lấy và xử lý phiên chơi
    const restoreSession = async () => {
      try {
        const sessionData = await getQuizSession(id, isSignedIn ? user?.id : null);
        
        if (sessionData) {
          console.log('Restoring quiz session automatically');
          
          // Tự động khôi phục phiên làm quiz mà không hỏi người dùng
          setQuizState(sessionData.quizState);
          setUserAnswers(sessionData.userAnswers);
          setTimeLeft(sessionData.timeLeft);
        }
      } catch (error) {
        console.error('Error restoring session:', error);
      } finally {
        setIsSessionRestored(true);
      }
    };
    
    restoreSession();
  }, [id, quizData._id, isSessionRestored, isSignedIn, user?.id]);

  // Xóa phiên làm quiz khi hoàn thành
  useEffect(() => {
    if (id && quizState.showResults) {
      clearQuizSession(id);
    }
  }, [id, quizState.showResults]);

  // Add function to save quiz results
  const saveQuizResults = useCallback(async () => {
    // Prevent double submission
    if (resultsSaved) return;
    
    try {
      console.log("Saving quiz results with user:", isSignedIn ? user?.id : "not signed in");
      
      // Xóa phiên làm quiz trước khi lưu kết quả
      if (id) {
        await clearQuizSession(id);
      }
      
      const response = await fetch(`${API_BASE_URL}/quiz/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quizId: quizData._id,
          userAnswers,
          score: quizState.score,
          totalScore: totalScoreValue,
          userId: isSignedIn ? user?.id : null,
          username: sessionStorage.getItem('username') || 'Anonymous',
          deviceId: getDeviceId() // Thêm deviceId để kết nối với phiên chơi
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Quiz results saved successfully');
        setResultsSaved(true);
      } else {
        console.error('Failed to save quiz results:', data.message);
      }
    } catch (error) {
      console.error('Error saving quiz results:', error);
    }
  }, [quizData._id, userAnswers, quizState.score, totalScoreValue, resultsSaved, user?.id, isSignedIn, id]);

  // Add effect to save results when showing results screen
  useEffect(() => {
    if (quizState.showResults && !resultsSaved && userAnswers.length > 0) {
      saveQuizResults();
    }
  }, [quizState.showResults, saveQuizResults, resultsSaved, userAnswers.length]);

  return (
    <div 
      className="flex gap-3 flex-col items-center justify-center h-screen background-color-gradient1 animated-background"
      role="main"
    >
      <ul className="circles" aria-hidden="true">
        {[...Array(10)].map((_, i) => <li key={i}></li>)}
      </ul>
      
      {/* Loading State */}
      {isLoading && <LoadingScreen />}
      
      {/* Welcome Screen */}
      {!isLoading && !error && quizState.showWelcome && (
        <WelcomeScreen 
          quizData={quizData} 
          onStart={() => {
            // Mo nhac nen
            if (backgroundMusicRef.current && !isMusicPlaying) {
              backgroundMusicRef.current.play()
                .then(() => {
                  setIsMusicPlaying(true);
                })
                .catch(err => {
                  console.error('Music play error:', err);
                });
            }
            startQuiz();
          }} 
          onReturn={() => navigate(-1)} 
        />
      )}
      
      {/* Quiz Container */}
      {!isLoading && !error && quizState.showQuiz && quizData.questions.length > 0 && renderQuestion()}
      
      {/* Results Screen */}
      {!isLoading && !error && quizState.showResults && (
        <ResultsScreen 
          score={quizState.score} 
          totalScore={totalScoreValue} 
          calculatePercentage={calculatePercentage}
          userAnswers={userAnswers}
          onRetry={retryQuiz}
        />
      )}
    </div>
  );
}