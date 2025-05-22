import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
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
import axios from "axios";

interface Section {
  difficulty: "easy" | "medium" | "hard";
  numberOfQuestions: number;
}

export default function CreateRoom() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { getToken } = useAuth();
  const [examSet, setExamSet] = useState<any>(null);
  const [sections, setSections] = useState<Section[]>([]);
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

  useEffect(() => {
    // Lấy sections từ URL params
    const sectionsParam = searchParams.get("sections");
    if (sectionsParam) {
      try {
        const parsedSections = JSON.parse(sectionsParam);
        setSections(parsedSections);
      } catch (error) {
        console.error("Error parsing sections:", error);
      }
    }
  }, [searchParams]);

  const handleSettingChange = (e: any) => {
    const { name, value, type } = e.target;
    setRoomSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? e.target.checked : value,
    }));
  };

  const handleDateTimeChange = (dateTime: string) => {
    setRoomSettings((prev) => ({
      ...prev,
      startTime: dateTime,
    }));
  };

  const getExamSet = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(
        `http://localhost:5000/api/examSets/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setExamSet(response.data);
    } catch (error) {
      console.error("Error fetching exam set:", error);
    }
  };

  useEffect(() => {
    getExamSet();
  }, [id]);

  const handleCreateRoom = async () => {
    const token = await getToken();
    try {
      const requestBody = {
        examSetId: id,
        durationMinutes: roomSettings.totalTime,
        startTime: roomSettings.startNow
          ? new Date().toISOString()
          : roomSettings.startTime,
        sections: sections,
        roomName: examSet?.name || "Phòng thi mới",
      };

      console.log("Sending request with body:", requestBody);

      const response = await fetch(`http://localhost:5000/api/quizRoom`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("Server response:", data);

      if (!response.ok) {
        console.error("Server error:", data);
        alert(data.message || "Có lỗi xảy ra khi tạo phòng thi");
        return;
      }

      if (!data.success) {
        console.error("Operation failed:", data.message);
        alert(data.message || "Có lỗi xảy ra khi tạo phòng thi");
        return;
      }

      navigate(`/dashboard/room-manager?refresh=${Date.now()}`);
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Có lỗi xảy ra khi tạo phòng thi");
    }
  };

  const handleCreateRoomLive = async () => {
    const token = await getToken();
    try {
      const response = await axios.post(
        "http://localhost:5000/api/quizRooms",
        {
          examSetId: id,
          sections,
          durationMinutes: roomSettings.totalTime,
          startTime: roomSettings.startTime,
          startNow: true, // Luôn bắt đầu ngay cho chế độ trực tiếp
          shuffleAnswers: roomSettings.shuffleAnswers,
          shuffleQuestions: roomSettings.shuffleQuestions,
          timeMode: roomSettings.timeMode,
          timePerQuestion: roomSettings.timePerQuestion,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        navigate(`/join-room/${response.data.data._id}`);
      } else {
        alert(response.data.message || "Có lỗi xảy ra khi tạo phòng thi");
      }
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Có lỗi xảy ra khi tạo phòng thi");
    }
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
            <p className="font-semibold">{examSet?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={HelpSquareIcon} />
            <p className="font-semibold">
              {sections.reduce(
                (sum, section) => sum + section.numberOfQuestions,
                0
              )}{" "}
              câu hỏi
            </p>
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
