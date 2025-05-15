import { ArrowLeftIcon, HomeIcon, ReloadIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserAnswer } from "../types/UserAnswer";
import { useNavigate } from "react-router";

const WelcomeScreen = ({ quizData, onStart, onReturn }: any) => (
  <div className="relative z-10 flex flex-col items-center justify-center p-8 box-shadow bg-background rounded-lg text-center">
    <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
      {quizData.name}
    </h1>
    <p className="text-xl mb-4">Chủ đề: {quizData.topic}</p>
    <p className="text-xl mb-4">Độ khó: {quizData.difficulty}</p>
    <p className="text-xl mb-8">Số câu hỏi: {quizData.questions.length}</p>
    <div className="flex gap-4">
      <button 
        onClick={onReturn}
        className="border box-shadow btn-hover rounded-lg p-4 flex items-center gap-2"
        aria-label="Quay lại trang join"
      >
        <HugeiconsIcon icon={ArrowLeftIcon} size={24} />
        <span>Quay lại</span>
      </button>
      <button 
        onClick={onStart} 
        className="bg-orange btn-hover rounded-lg p-4 px-8 flex items-center gap-2"
        aria-label="Bắt đầu làm bài"
      >
        <span className="text-darkblue text-xl font-bold">Bắt đầu làm bài</span>
      </button>
    </div>
  </div>
);

const LoadingScreen = () => (
  <div className="relative z-10 flex flex-col items-center justify-center p-8 box-shadow bg-background rounded-lg text-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
    <p className="text-xl">Đang tải quiz...</p>
  </div>
);

const PerformanceChart = ({ userAnswers }: { userAnswers: UserAnswer[] }) => {
  const correctAnswers = userAnswers.filter(answer => answer.correct).length;
  const incorrectAnswers = userAnswers.length - correctAnswers;
  const correctPercent = (correctAnswers / userAnswers.length) * 100;

  return (
    <div className="w-full p-6 glassmorphic rounded-lg mb-6">
      <div className="w-full h-8 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-green-500 flex items-center justify-start pl-4 text-white font-bold"
          style={{ width: `${correctPercent}%` }}
        >
          {correctPercent > 15 && `${correctPercent.toFixed(0)}%`}
        </div>
      </div>
      
      <div className="flex justify-between mt-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 mr-2 rounded-full" aria-hidden="true"></div>
          <span className="text-lg">Đúng: <strong>{correctAnswers}</strong> câu</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 mr-2 rounded-full" aria-hidden="true"></div>
          <span className="text-lg">Sai: <strong>{incorrectAnswers}</strong> câu</span>
        </div>
      </div>
    </div>
  );
};

const getMotivationalTitle = (percentage: number) => {
  if (percentage >= 90) return "Xuất sắc! Bạn thật là tài giỏi!";
  if (percentage >= 70) return "Rất tốt! Bạn đã làm được việc lớn!";
  if (percentage >= 50) return "Tốt! Tiếp tục phát huy nhé!";
  if (percentage >= 30) return "Cố gắng hơn nữa, bạn có thể làm được!";
  return "Đừng nản lòng, hãy thử lại và cải thiện nhé!";
};

const ResultsScreen = ({ score, totalScore, calculatePercentage, userAnswers, onRetry }: any) => {
  const navigate = useNavigate();
  const percentage = calculatePercentage();
  const motivationalTitle = getMotivationalTitle(percentage);

  const navigateHome = () => {
    console.log("navigateHome");
    navigate(-1);
  };

  return (
    <div className="relative z-10 w-11/12 md:w-4/5 lg:w-3/5 box-shadow bg-background rounded-lg p-8 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
        {motivationalTitle}
      </h1>
    
      <div className="w-full mb-8">
        <div className="mb-6 flex justify-center">
          <div className="bg-gray-900 p-6 rounded-lg text-center">
            <h2 className="text-lg text-gray-400 mb-1">Điểm của bạn</h2>
            <p className="text-4xl font-bold text-orange">
              {score}/{totalScore}
              <span className="ml-2 text-2xl text-gray-300">({percentage}%)</span>
            </p>
          </div>
        </div>
      
        <PerformanceChart userAnswers={userAnswers} />
      </div>
    
      <div className="flex gap-4">
        <button
          onClick={() => navigateHome()}
          className="border box-shadow btn-hover rounded-lg p-4 flex items-center gap-2"
          aria-label="Trở về trang chính"
        >
          <HugeiconsIcon icon={HomeIcon} size={24} />
          <span>Trở về trang chính</span>
        </button>
        <button
          onClick={onRetry}
          className="bg-orange btn-hover rounded-lg p-4 px-8 flex items-center justify-center"
          aria-label="Làm lại bài quiz"
        >
          <HugeiconsIcon icon={ReloadIcon} size={20} className="mr-2" />
          <span className="text-darkblue text-xl font-bold">Làm lại</span>
        </button>
      </div>
    </div>
  );
}

export {WelcomeScreen, LoadingScreen, PerformanceChart, ResultsScreen}