import React from "react";

interface ProgressBarProps {
  progress: number;
  total: number;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  total,
  className = "",
}) => {
  const percentage = Math.round((progress / total) * 100);

  return (
    <div
      className={`w-full h-2 bg-gray-700 rounded-full overflow-hidden ${className}`}
    >
      <div
        className="h-full bg-orange transition-all duration-300 ease-out"
        style={{ width: `${percentage}%` }}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
};

export default ProgressBar;
