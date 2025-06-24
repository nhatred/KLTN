import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { useAuth, useUser } from "@clerk/clerk-react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  ImageUploadIcon,
  FileEditIcon,
} from "@hugeicons/core-free-icons";
import imageCompression from "browser-image-compression";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;


interface CreateQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateQuizModal({
  isOpen,
  onClose,
}: CreateQuizModalProps) {
  const navigate = useNavigate();
  const { user } = useUser();
  const { getToken } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [imageData, setImageData] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
  } = useForm({
    mode: "onChange",
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setIsUploading(true);

      try {
        if (file.size > 3 * 1024 * 1024) {
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          };

          const compressedFile = await imageCompression(file, options);
          setImageData(compressedFile);
        } else {
          setImageData(file);
        }
      } catch (error) {
        console.error("Error compressing image:", error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const onSubmit = async (data: any) => {
    try {
      setIsCreating(true);
      const token = await getToken();

      const formData = new FormData();
      formData.append("creator", user?.id || "");
      formData.append(
        "creatorInfo",
        JSON.stringify({
          name: user?.fullName,
          avatar: user?.imageUrl,
        })
      );
      formData.append("name", data.name);
      formData.append("topic", data.topic);
      formData.append("difficulty", data.difficulty);
      formData.append("isPublic", data.isPublic);
      formData.append("imageUrl", imageData || "");
      formData.append("timePerQuestion", "30");
      formData.append("scorePerQuestion", "1");

      const response = await fetch(`${API_BASE_URL}/quiz`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        navigate(`/edit-quiz/${result.quiz._id}`);
      } else {
        throw new Error(result.message || "Cannot create new Quiz");
      }
    } catch (error) {
      console.error("Error creating quiz:", error);
      alert("Failed to create quiz. Please try again.");
    } finally {
      setIsCreating(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300 ${
        isAnimating ? "opacity-0" : "opacity-100"
      }`}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden transition-all duration-300 transform ${
          isAnimating ? "scale-95 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange to-red-wine p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex gap-3 items-center">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <HugeiconsIcon icon={FileEditIcon} className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-background">
                  Tạo một quiz mới
                </h2>
                <p className="text-blue-100 text-sm">
                  Tạo một quiz mới để bắt đầu học tập và thi thử
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsAnimating(true);
                setTimeout(() => {
                  setIsAnimating(false);
                  onClose();
                }, 300);
              }}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                className="w-6 h-6 text-white"
              />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">
                Tên quiz <span className="text-red-500">*</span>
              </label>
              <input
                {...register("name", { required: "Quiz name is required" })}
                type="text"
                placeholder="Nhập tên quiz"
                className={`w-full p-4 font-medium border-2 border-gray-200 rounded-xl focus:border-orange transition-all duration-200 text-gray-900 ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-red-500 text-sm">
                  {errors.name.message?.toString()}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">
                  Môn học <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("topic", { required: "Topic is required" })}
                  className={`w-full p-4 font-medium border-2 border-gray-200 rounded-xl focus:border-orange transition-all duration-200 text-gray-900 ${
                    errors.topic ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Chọn môn học</option>
                  <option value="math">Toán</option>
                  <option value="english">Tiếng Anh</option>
                  <option value="physics">Vật lý</option>
                  <option value="history">Lịch sử</option>
                  <option value="other">Khác</option>
                </select>
                {errors.topic && (
                  <p className="mt-1 text-red-500 text-sm">
                    {errors.topic.message?.toString()}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">
                  Độ khó <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("difficulty", {
                    required: "Difficulty is required",
                  })}
                  className={`w-full p-4 font-medium border-2 border-gray-200 rounded-xl focus:border-orange transition-all duration-200 text-gray-900 ${
                    errors.difficulty ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Chọn độ khó</option>
                  <option value="easy">Dễ</option>
                  <option value="medium">Trung bình</option>
                  <option value="hard">Khó</option>
                </select>
                {errors.difficulty && (
                  <p className="mt-1 text-red-500 text-sm">
                    {errors.difficulty.message?.toString()}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">
                Công khai <span className="text-red-500">*</span>
              </label>
              <select
                {...register("isPublic", { required: "isPublic is required" })}
                className={`w-full p-4 font-medium border-2 border-gray-200 rounded-xl focus:border-orange transition-all duration-200 text-gray-900 ${
                  errors.isPublic ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Chọn công khai</option>
                <option value="true">Công khai</option>
                <option value="false">Riêng tư</option>
              </select>
              {errors.isPublic && (
                <p className="mt-1 text-red-500 text-sm">
                  {errors.isPublic.message?.toString()}
                </p>
              )}
            </div>

            <div>
              <div className="relative">
                <input
                  accept="image/*"
                  {...register("imageUrl", {
                    required: "Quiz image is required",
                  })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  type="file"
                  onChange={handleImageUpload}
                  id="image-upload"
                  disabled={isUploading}
                />
                <label
                  htmlFor="image-upload"
                  className={`cursor-pointer flex items-center gap-2 p-3 border-2 border-dashed border-orange rounded-lg hover:border-orange/50 transition-colors duration-200 ${
                    isUploading ? "opacity-50" : ""
                  }`}
                >
                  <HugeiconsIcon
                    icon={ImageUploadIcon}
                    size={24}
                    className="text-gray-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {isUploading ? "Đang tải ảnh..." : "Tải ảnh nền quiz"}
                  </span>
                </label>
              </div>
              {errors.imageUrl && (
                <p className="mt-1 text-red-500 text-sm">
                  {errors.imageUrl.message?.toString()}
                </p>
              )}
              {imageData && !isUploading && (
                <div className="mt-4">
                  <img
                    src={URL.createObjectURL(imageData)}
                    alt="Preview"
                    className="rounded-lg w-full max-h-48 object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer */}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                setIsAnimating(true);
                setTimeout(() => {
                  setIsAnimating(false);
                  onClose();
                }, 300);
              }}
              className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-xl transition-all duration-200 font-medium"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isCreating || !isValid || !isDirty}
              className="px-6 py-3 bg-gradient-to-r from-orange to-red-wine text-white rounded-xl hover:from-orange-700 hover:to-red-wine-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <span className="loader"></span>
                  <span>Đang tạo...</span>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={FileEditIcon} className="w-5 h-5" />
                  <span>Tạo quiz</span>
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
