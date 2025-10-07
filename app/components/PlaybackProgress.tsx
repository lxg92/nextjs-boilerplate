"use client";

import { PlaybackProgress as PlaybackProgressType } from "../types";

interface PlaybackProgressProps {
  progress: PlaybackProgressType;
  isLooping?: boolean;
  className?: string;
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const PlaybackProgress = ({ progress, isLooping = false, className = "" }: PlaybackProgressProps) => {
  const { currentTime, duration, progress: progressPercentage } = progress;

  // Choose color based on loop state
  const progressBarColor = isLooping 
  ? "bg-blue-600 dark:bg-blue-500"
  : "bg-green-600 dark:bg-green-500" 

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Progress Bar */}
      <div className="relative">
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${progressBarColor} transition-all duration-100 ease-linear`}
            style={{ width: `${progressPercentage * 100}%` }}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Time Display */}
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
        <span className="font-mono">
          {formatTime(currentTime)}
        </span>
        <span className="font-mono">
          {formatTime(duration)}
        </span>
      </div>

      {/* Progress Percentage */}
      <div className="text-center text-xs text-gray-500 dark:text-gray-500">
        {Math.round(progressPercentage * 100)}% complete
      </div>
    </div>
  );
};
