import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  AlarmClockIcon,
  Backward01Icon,
  HelpSquareIcon,
  Quiz01Icon,
  ClockIcon,
  CursorInfo02Icon,
  Setting07Icon,
  LiveStreaming02Icon,
  DigitalClockIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import "../style/checkbox2.css";
import DataPicker from "../components/DataPicker";
import { Quiz } from "../types/Quiz";
import { useAuth } from "@clerk/clerk-react";

export default function CreateRoom() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getToken } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [roomSettings, setRoomSettings] = useState({
    startTime: "",
    shuffleAnswers: true,
    shuffleQuestions: true,
    timeMode: "perQuestion",
    timePerQuestion: 30,
    totalTime: 30,
    useDefaultTime: true,
    startNow: false,
  });

  const handleSettingChange = (e: any) => {
    const { name, value, type } = e.target;
    setRoomSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? e.target.checked : value,
    }));
  };

  const handleDateTimeChange = (dateTime: string) => {
    console.log("Daaaaaa", dateTime);
    setRoomSettings((prev) => ({
      ...prev,
      startTime: dateTime,
    }));
  };

  console.log(id);

  const getQuiz = async () => {
    const response = await fetch(`http://localhost:5000/api/quiz/${id}`);
    const data = await response.json();
    setQuiz(data.data);
  };

  useEffect(() => {
    getQuiz();
  }, []);

  useEffect(() => {
    console.log("Room settings:", roomSettings);
  }, [roomSettings]);

  const handleCreateRoom = async () => {
    const token = await getToken();
    console.log("Room settings:", roomSettings);
    const response = await fetch(`http://localhost:5000/api/quizRoom`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quizId: id,
        durationMinutes: roomSettings.totalTime,
        startTime: roomSettings.startTime,
        startNow: roomSettings.startNow,
      }),
    });
    const data = await response.json();
    if (!data.success) {
      console.error("Error creating room:", data.message);
      return;
    }
    console.log("Room created successfully:", data.data);
    // Navigate to RoomManager with a timestamp to force refresh
    navigate(`/dashboard/room-manager?refresh=${Date.now()}`);
  };

  const handleCreateRoomLive = async () => {
    const token = await getToken();
    const response = await fetch(`http://localhost:5000/api/quizRoom`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quizId: id,
        durationMinutes: roomSettings.totalTime,
        startTime: roomSettings.startTime,
        startNow: roomSettings.startNow,
      }),
    });
    const data = await response.json();
    if (!data.success) {
      console.error("Error creating room:", data.message);
      return;
    }
    console.log("Room created successfully:", data);
    if (data.success) {
      navigate(`/join-room/${data.data._id}`);
    }
    // Navigate to RoomManager with a timestamp to force refresh
  };
  return (
    <div className="bg-background h-screen">
      <nav className="h-16 fixed left-0 right-0 border-b-1 z-10 bg-background py-2 px-4 flex justify-between items-center">
        <div className="flex items-center gap-5">
          <div
            onClick={() => navigate(-1)}
            className="cursor-pointer flex items-center justify-center rounded font-black hover:bg-gray-100 p-2"
          >
            <HugeiconsIcon icon={Backward01Icon} />
          </div>
          <div className="flex items-center gap-2">
            <p className="font-semibold">Bài đánh giá</p>
          </div>
          <p className="text-gray-500 text-lg font-bold">|</p>
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Quiz01Icon} />
            <p className="font-semibold">{quiz?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={HelpSquareIcon} />
            <p className="font-semibold">{quiz?.questions.length} câu hỏi</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-5">
            <div
              onClick={handleCreateRoomLive}
              className="p-3 flex gap-1 items-center cursor-pointer bg-orange btn-hover rounded font-semibold text-lg"
            >
              <HugeiconsIcon icon={LiveStreaming02Icon} />
              <p>Trực tiếp</p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div
              onClick={handleCreateRoom}
              className="p-3 flex gap-1 items-center cursor-pointer bg-orange btn-hover rounded font-semibold text-lg"
            >
              <HugeiconsIcon icon={DigitalClockIcon} />
              <p>Tạo phòng</p>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex justify-center items-center h-screen ">
        <div className="bg-white p-6 container w-2/5 mx-auto rounded-lg box-shadow">
          <div className="flex items-center gap-2 px-4 mb-2 pb-4 border-b-1 border-gray-100">
            <HugeiconsIcon icon={Setting07Icon} size={28} />
            <h1 className="text-2xl font-semibold text-darkblue">
              Chỉnh sửa phòng
            </h1>
          </div>

          <div className="space-y-5 p-4">
            {/* Thời gian bắt đầu */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-darkblue font-medium">
                <HugeiconsIcon icon={AlarmClockIcon} />
                <p>Thời gian bắt đầu</p>
              </label>
              <DataPicker onDateTimeChange={handleDateTimeChange} />
              <label className="flex items-center space-x-3 py-1 cursor-pointer">
                <div className="checkbox-wrapper-20">
                  <div className="switch">
                    <input
                      id="startNow"
                      name="startNow"
                      className="input"
                      type="checkbox"
                      checked={roomSettings.startNow}
                      onChange={handleSettingChange}
                    />
                    <label htmlFor="startNow" className="slider"></label>
                  </div>
                </div>
                <span className="text-darkblue">Bắt đầu ngay bây giờ</span>
              </label>
            </div>
            {/* Cài đặt thời gian */}
            <div className="space-y-4 rounded-lg">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={ClockIcon} />
                <h2 className="font-medium text-gray-800">Cài đặt thời gian</h2>
              </div>
              <div className="space-y-3">
                <select
                  name="timeMode"
                  value={roomSettings.timeMode}
                  onChange={handleSettingChange}
                  className="w-full p-3 border border-gray-200 bg-[#fcfbfa] rounded-lg outline-none"
                >
                  <option value="perQuestion">
                    Thời gian cho từng câu hỏi
                  </option>
                  <option value="totalTime">Thời gian tổng</option>
                </select>

                {roomSettings.timeMode === "perQuestion" && (
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 py-1 cursor-pointer">
                      <div className="checkbox-wrapper-20">
                        <div className="switch">
                          <input
                            id="useDefaultTime"
                            name="useDefaultTime"
                            className="input"
                            type="checkbox"
                            checked={roomSettings.useDefaultTime}
                            onChange={handleSettingChange}
                          />
                          <label
                            htmlFor="useDefaultTime"
                            className="slider"
                          ></label>
                        </div>
                      </div>
                      <span className="text-darkblue">
                        Sử dụng thời gian mặc định của quiz
                      </span>
                    </label>

                    {!roomSettings.useDefaultTime && (
                      <div className="pt-2">
                        <label className="block text-darkblue font-medium mb-2">
                          Thời gian cho mỗi câu hỏi (giây)
                        </label>
                        <input
                          type="number"
                          name="timePerQuestion"
                          value={roomSettings.timePerQuestion}
                          onChange={handleSettingChange}
                          min="5"
                          max="300"
                          className="w-full p-3 border border-gray-300 rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                )}

                {roomSettings.timeMode === "totalTime" && (
                  <div className="pt-2">
                    <label className="block text-darkblue font-medium mb-2">
                      Thời gian tổng (phút)
                    </label>
                    <input
                      type="number"
                      name="totalTime"
                      value={roomSettings.totalTime}
                      onChange={handleSettingChange}
                      min="1"
                      max="180"
                      className="w-full p-3 border border-gray-300 rounded-lg "
                    />
                  </div>
                )}
              </div>
            </div>
            {/* Tùy chọn trộn */}
            <div className="rounded-lg space-y-4">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={CursorInfo02Icon} />
                <h2 className="font-medium text-gray-800">Tùy chọn câu hỏi</h2>
              </div>
              <div className="flex flex-col gap-3">
                <label className="flex items-center space-x-3 py-1 cursor-pointer">
                  <div className="checkbox-wrapper-20">
                    <div className="switch">
                      <input
                        id="shuffleQuestions"
                        name="shuffleQuestions"
                        className="input"
                        type="checkbox"
                        checked={roomSettings.shuffleQuestions}
                        onChange={handleSettingChange}
                      />
                      <label
                        htmlFor="shuffleQuestions"
                        className="slider"
                      ></label>
                    </div>
                  </div>
                  <span className="text-darkblue">Trộn câu hỏi</span>
                </label>

                <label className="flex items-center space-x-3 py-1 cursor-pointer">
                  <div className="checkbox-wrapper-20">
                    <div className="switch">
                      <input
                        id="shuffleAnswers"
                        name="shuffleAnswers"
                        className="input"
                        type="checkbox"
                        checked={roomSettings.shuffleAnswers}
                        onChange={handleSettingChange}
                      />
                      <label
                        htmlFor="shuffleAnswers"
                        className="slider"
                      ></label>
                    </div>
                  </div>
                  <span className="text-darkblue">Trộn đáp án</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
