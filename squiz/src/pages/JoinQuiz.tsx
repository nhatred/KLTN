import "../style/linearbg.css";
import "../style/animatedBackground.css";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon, Share08Icon, Setting07Icon, AlarmClockIcon } from "@hugeicons/core-free-icons";
import "../style/switch.css";
import "../style/dashboard.css";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
const API_BASE_URL = "http://localhost:5000/api";

export default function JoinQuiz() {
    const { id } = useParams();
    const [quizData, setQuizData] = useState({
    creator: "",
    name: "",
    topic: "",
    difficulty: "",
    isPublic: "public",
    questions: [{}],
    imageUrl: null,
  });
    const getQuizData = async () => {
        const response = await fetch(`${API_BASE_URL}/quiz/${id}`);
        const data = await response.json();
        
        const responseData = data.data;
        console.log(responseData.creator);
        const quizData = {
            creator: responseData.creator || "",
            name: responseData.name || "",
            topic: responseData.topic || "",
            difficulty: responseData.difficulty || "",
            isPublic: responseData.isPublic || "public",
            questions: responseData.questions || [],
            imageUrl: responseData.imageUrl || null,
        }
        setQuizData(quizData);
        return data;
    }
    useEffect(() => {
        getQuizData()
    }, [id]);

    return (
        <div className="flex gap-3 flex-col items-center justify-center h-screen background-color-gradient1 animated-background">
            <ul className="circles">
                <li></li>
                <li></li>
                <li></li>
                <li></li>
                <li></li>
                <li></li>
                <li></li>
                <li></li>
                <li></li>
                <li></li>
            </ul>
            <div className="relative z-10">
                <div className="flex justify-center ">
                    <h1 className="text-darkblue uppercase text-6xl font-black mb-2">Tham gia Squiz</h1>
                </div>
                <div className="flex mb-2 box-shadow gap-2 flex-col items-center justify-center bg-background rounded-lg p-5">
                    <button className="bg-orange btn-hover w-full rounded-lg p-4 flex items-center justify-center gap-2">
                        <HugeiconsIcon icon={PlayIcon} size={36} color="black" />
                        <p className="text-darkblue text-xl font-bold ">Bắt đầu</p>
                    </button>
                </div>
                <div className="box-shadow bg-background rounded-lg p-5">
                    <div className="grid grid-cols-8 gap-2">
                        <div className="flex gap-2 col-span-6 items-center">
                            <img src={ quizData.imageUrl || "/assets/background.avif" } alt="" className="w-16 h-16 object-cover rounded" />
                            <div>
                                <p className="text-darkblue mb-2 text-lg font-bold ">{ quizData.name }</p>
                                <p className="text-darkblue text-sm font-bold ">{ quizData.questions.length } câu hỏi</p>
                            </div>
                        </div>
                        <button className="border btn-hover col-span-2 rounded-lg p-3 flex items-center gap-2">
                            <HugeiconsIcon icon={Share08Icon} size={24} />
                            <p className="text-darkblue text-sm font-bold ">Chia sẻ</p>
                        </button>
                    </div>
                    <div>
                        <div className="flex gap-2 items-center mt-5 mb-2">
                            <HugeiconsIcon icon={Setting07Icon} size={24} />
                            <p className="text-darkblue text-sm font-bold ">Cài đặt</p>
                        </div>
                        <label htmlFor="s1-14" className="bg-white cursor-pointer flex justify-between rounded-lg p-5">
                            <div className="flex gap-2 items-center">
                                <HugeiconsIcon icon={AlarmClockIcon} size={24} />
                                <p className="text-darkblue text-sm font-bold ">Đếm ngược</p>
                            </div>
                            <div className="checkbox-wrapper-14">
                                <input id="s1-14" type="checkbox" className="switch" />
                            </div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    )
}
