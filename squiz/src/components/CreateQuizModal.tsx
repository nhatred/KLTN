import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { useAuth, useUser } from "@clerk/clerk-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, ImageUploadIcon } from "@hugeicons/core-free-icons";
import imageCompression from "browser-image-compression";

const API_BASE_URL = "http://localhost:5000/api";

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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange to-red-wine p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Create New Quiz</h2>
            <button
              onClick={onClose}
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
              <input
                {...register("name", { required: "Quiz name is required" })}
                type="text"
                placeholder="Enter Quiz name"
                className={`w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-orange/30 transition-all duration-200 ${
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
                <select
                  {...register("topic", { required: "Topic is required" })}
                  className={`w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-orange/30 transition-all duration-200 ${
                    errors.topic ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select Topic</option>
                  <option value="math">Mathematics</option>
                  <option value="english">English</option>
                  <option value="physics">Physics</option>
                  <option value="history">History</option>
                  <option value="other">Other</option>
                </select>
                {errors.topic && (
                  <p className="mt-1 text-red-500 text-sm">
                    {errors.topic.message?.toString()}
                  </p>
                )}
              </div>

              <div>
                <select
                  {...register("difficulty", {
                    required: "Difficulty is required",
                  })}
                  className={`w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-orange/30 transition-all duration-200 ${
                    errors.difficulty ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select Difficulty</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                {errors.difficulty && (
                  <p className="mt-1 text-red-500 text-sm">
                    {errors.difficulty.message?.toString()}
                  </p>
                )}
              </div>
            </div>

            <div>
              <select
                {...register("isPublic")}
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange/30 transition-all duration-200"
              >
                <option value="true">Public</option>
                <option value="false">Private</option>
              </select>
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
                  className={`cursor-pointer flex items-center gap-2 p-3 border border-dashed border-gray-300 rounded-lg hover:border-orange/50 transition-colors duration-200 ${
                    isUploading ? "opacity-50" : ""
                  }`}
                >
                  <HugeiconsIcon
                    icon={ImageUploadIcon}
                    size={24}
                    className="text-gray-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {isUploading
                      ? "Uploading image..."
                      : "Upload Quiz background image"}
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
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-6 py-2 bg-gradient-to-r from-orange to-red-wine text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <span className="loader"></span>
                  <span>Creating...</span>
                </>
              ) : (
                "Create Quiz"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
