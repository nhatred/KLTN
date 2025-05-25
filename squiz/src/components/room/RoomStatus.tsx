import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ClockIcon, UserGroup03Icon } from "@hugeicons/core-free-icons";

interface RoomStatusProps {
  status: "waiting" | "active" | "completed";
  participantCount: number;
  timeRemaining?: string;
}

const RoomStatus: React.FC<RoomStatusProps> = ({
  status,
  participantCount,
  timeRemaining,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case "waiting":
        return "text-yellow-500";
      case "active":
        return "text-green-500";
      case "completed":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "waiting":
        return "Đang chờ";
      case "active":
        return "Đang diễn ra";
      case "completed":
        return "Đã kết thúc";
      default:
        return "Không xác định";
    }
  };

  return (
    <div className="flex items-center space-x-6 text-white">
      <div className="flex items-center space-x-2">
        <HugeiconsIcon icon={UserGroup03Icon} size={20} />
        <span>{participantCount} thí sinh</span>
      </div>

      {timeRemaining && (
        <div className="flex items-center space-x-2">
          <HugeiconsIcon icon={ClockIcon} size={20} />
          <span>{timeRemaining}</span>
        </div>
      )}

      <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
        <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
        <span>{getStatusText()}</span>
      </div>
    </div>
  );
};

export default RoomStatus;
