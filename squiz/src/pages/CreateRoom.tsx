import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import {
  AlarmClockIcon,
  Backward01Icon,
  HelpSquareIcon,
  Quiz01Icon,
  ClockIcon,
  Setting07Icon,
  DigitalClockIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import "../style/checkbox2.css";
import DataPicker from "../components/DataPicker";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";

interface Section {
  difficulty: "easy" | "medium" | "hard" | "total";
  numberOfQuestions: number;
}

export default function CreateRoom() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { getToken } = useAuth();
  const [quiz, setQuiz] = useState<any>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [roomSettings, setRoomSettings] = useState({
    roomName: "",
    startNow: false,
    startTime: "",
    timeMode: "totalTime",
    durationMinutes: 30,
    perQuestionTime: 30, // Giá trị tạm thời, sẽ được cập nhật từ API
    useDefaultQuestionTime: true,
  });
  console.log("id của quizz: ", id);

  useEffect(() => {
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

  const getQuiz = async () => {
    try {
      const token = await getToken();
      console.log("id của quizz: ", id);
      const response = await axios.get(
        `http://localhost:5000/api/quiz/quizuser/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setQuiz(response.data.quiz); // Đặt response.data.quiz thay vì response.data

      // Cập nhật thời gian mặc định từ quiz
      setRoomSettings((prev) => ({
        ...prev,
        perQuestionTime: response.data?.quiz?.timePerQuestion || 30, // Thêm fallback 30 nếu undefined
        roomName: response.data?.quiz?.name || "Phòng thi mới", // Thêm fallback
      }));
    } catch (error) {
      console.error("Error fetching exam set:", error);
    }
  };

  useEffect(() => {
    getQuiz();
  }, [id]);

  const handleSettingChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setRoomSettings((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleDateTimeChange = (dateTime: string) => {
    setRoomSettings((prev) => ({
      ...prev,
      startTime: dateTime,
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!roomSettings.roomName.trim()) {
      newErrors.roomName = "Vui lòng nhập tên phòng";
    }

    if (!roomSettings.startNow && !roomSettings.startTime) {
      newErrors.startTime = "Vui lòng chọn thời gian bắt đầu";
    }

    if (roomSettings.timeMode === "totalTime") {
      if (
        roomSettings.durationMinutes < 1 ||
        roomSettings.durationMinutes > 180
      ) {
        newErrors.durationMinutes = "Thời gian tổng phải từ 1 đến 180 phút";
      }
    } else {
      if (
        !roomSettings.useDefaultQuestionTime &&
        (roomSettings.perQuestionTime < 5 || roomSettings.perQuestionTime > 300)
      ) {
        newErrors.perQuestionTime =
          "Thời gian mỗi câu hỏi phải từ 5 đến 300 giây";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateRoom = async () => {
    if (!validateForm()) return;

    const token = await getToken();
    console.log(roomSettings.roomName);
    try {
      const requestBody = {
        quizId: id,
        roomName: roomSettings.roomName,
        startTime: roomSettings.startNow
          ? new Date().toISOString()
          : roomSettings.startTime,
        sections: sections,
        ...(roomSettings.timeMode === "totalTime"
          ? { durationMinutes: roomSettings.durationMinutes }
          : {
              perQuestionTime: roomSettings.useDefaultQuestionTime
                ? quiz?.timePerQuestion
                : roomSettings.perQuestionTime,
            }),
      };

      const response = await fetch(`http://localhost:5000/api/quizRoom`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

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
            <HugeiconsIcon icon={Quiz01Icon} />
            <p className="font-semibold">{quiz?.name}</p>
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
        <div className="flex items-center gap-5">
          <div
            onClick={handleCreateRoom}
            className="p-3 flex gap-1 items-center cursor-pointer bg-orange btn-hover rounded font-semibold text-lg"
          >
            <HugeiconsIcon icon={DigitalClockIcon} />
            <p>Tạo phòng</p>
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
            {/* Tên phòng */}
            <div className="space-y-2">
              <label className="block text-darkblue font-medium">
                Tên phòng
              </label>
              <input
                type="text"
                name="roomName"
                value={roomSettings.roomName}
                onChange={handleSettingChange}
                className="w-full p-3 border border-gray-300 rounded-lg"
                placeholder="Nhập tên phòng"
              />
              {errors.roomName && (
                <p className="text-red-500 text-sm">{errors.roomName}</p>
              )}
            </div>

            {/* Thời gian bắt đầu */}
            {!roomSettings.startNow && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-darkblue font-medium">
                  <HugeiconsIcon icon={AlarmClockIcon} />
                  <p>Thời gian bắt đầu</p>
                </label>
                <DataPicker onDateTimeChange={handleDateTimeChange} />
                {errors.startTime && (
                  <p className="text-red-500 text-sm">{errors.startTime}</p>
                )}
              </div>
            )}

            {/* <label className="flex items-center space-x-3 py-1 cursor-pointer">
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
            </label> */}

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
                            id="useDefaultQuestionTime"
                            name="useDefaultQuestionTime"
                            className="input"
                            type="checkbox"
                            checked={roomSettings.useDefaultQuestionTime}
                            onChange={handleSettingChange}
                          />
                          <label
                            htmlFor="useDefaultQuestionTime"
                            className="slider"
                          ></label>
                        </div>
                      </div>
                      <span className="text-darkblue">
                        Sử dụng thời gian mặc định của quiz (
                        {quiz?.timePerQuestion || 30} giây)
                      </span>
                    </label>

                    {!roomSettings.useDefaultQuestionTime && (
                      <div className="pt-2">
                        <label className="block text-darkblue font-medium mb-2">
                          Thời gian cho mỗi câu hỏi (giây)
                        </label>
                        <input
                          type="number"
                          name="perQuestionTime"
                          value={roomSettings.perQuestionTime}
                          onChange={handleSettingChange}
                          min="5"
                          max="300"
                          className="w-full p-3 border border-gray-300 rounded-lg"
                        />
                        {errors.perQuestionTime && (
                          <p className="text-red-500 text-sm">
                            {errors.perQuestionTime}
                          </p>
                        )}
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
                      name="durationMinutes"
                      value={roomSettings.durationMinutes}
                      onChange={handleSettingChange}
                      min="1"
                      max="180"
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                    {errors.durationMinutes && (
                      <p className="text-red-500 text-sm">
                        {errors.durationMinutes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
