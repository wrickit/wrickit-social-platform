import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2 } from "lucide-react";
import { formatTime } from "@/utils/audioUtils";

interface VoicePlayerProps {
  audioUrl: string;
  duration?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function VoicePlayer({ 
  audioUrl, 
  duration = 0, 
  className = "",
  size = "md" 
}: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);
  const [isLoading, setIsLoading] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      let actualDuration = duration;
      
      // If no duration provided or invalid, try to get from audio element
      if (!actualDuration || actualDuration <= 0 || !isFinite(actualDuration)) {
        actualDuration = audio.duration;
      }
      
      // Final fallback if audio duration is also invalid
      if (!actualDuration || actualDuration <= 0 || !isFinite(actualDuration)) {
        actualDuration = 0;
      } else {
        actualDuration = Math.ceil(actualDuration);
      }
      
      setAudioDuration(actualDuration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(Math.floor(audio.currentTime));
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleError = (e: Event) => {
      console.error('Audio playback error:', e);
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl]);

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audioDuration || audioDuration <= 0 || !isFinite(audioDuration)) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = percent * audioDuration;
    
    if (!isFinite(newTime) || newTime < 0) return;
    
    try {
      audio.currentTime = newTime;
      setCurrentTime(Math.round(newTime));
    } catch (error) {
      console.error('Error seeking audio:', error);
    }
  };



  const progressPercent = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;
  
  const buttonSize = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-10 w-10";
  const iconSize = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";

  return (
    <div className={`flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg max-w-xs ${className}`}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" crossOrigin="anonymous" />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={togglePlayPause}
        disabled={isLoading}
        className={`${buttonSize} text-blue-600 hover:text-blue-700 flex-shrink-0`}
      >
        {isLoading ? (
          <Volume2 className={`${iconSize} animate-pulse`} />
        ) : isPlaying ? (
          <Pause className={iconSize} />
        ) : (
          <Play className={iconSize} />
        )}
      </Button>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
          <span>Voice Message</span>
          <span>{formatTime(audioDuration)}</span>
        </div>
        
        <div 
          className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer relative overflow-hidden"
          onClick={handleProgressClick}
        >
          <div 
            className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-100"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {formatTime(currentTime)} / {formatTime(audioDuration)}
        </div>
      </div>
    </div>
  );
}