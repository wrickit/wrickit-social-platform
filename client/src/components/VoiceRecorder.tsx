import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Play, Pause, Trash2, Send } from "lucide-react";

interface VoiceRecorderProps {
  onVoiceMessage: (audioData: string, duration: number) => void;
  onCancel?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function VoiceRecorder({ 
  onVoiceMessage, 
  onCancel, 
  className = "",
  size = "md" 
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setDuration(recordingTime);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl("");
    setDuration(0);
    setRecordingTime(0);
    setIsPlaying(false);
  };

  const sendVoiceMessage = async () => {
    if (audioBlob) {
      // Convert blob to base64 data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const audioData = reader.result as string;
        onVoiceMessage(audioData, duration);
        deleteRecording();
      };
      reader.readAsDataURL(audioBlob);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const buttonSize = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-10 w-10";
  const iconSize = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";

  if (audioBlob && audioUrl) {
    // Show playback controls
    return (
      <div className={`flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg ${className}`}>
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              setDuration(Math.round(audioRef.current.duration));
            }
          }}
        />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={playAudio}
          className={`${buttonSize} text-blue-600 hover:text-blue-700`}
        >
          {isPlaying ? <Pause className={iconSize} /> : <Play className={iconSize} />}
        </Button>
        
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Voice Message
          </div>
          <div className="text-xs text-gray-500">
            {formatTime(duration)}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={deleteRecording}
          className={`${buttonSize} text-red-600 hover:text-red-700`}
        >
          <Trash2 className={iconSize} />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={sendVoiceMessage}
          className={`${buttonSize} text-green-600 hover:text-green-700`}
        >
          <Send className={iconSize} />
        </Button>
      </div>
    );
  }

  if (isRecording) {
    // Show recording interface
    return (
      <div className={`flex items-center space-x-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg ${className}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={stopRecording}
          className={`${buttonSize} text-red-600 hover:text-red-700 animate-pulse`}
        >
          <MicOff className={iconSize} />
        </Button>
        
        <div className="flex-1">
          <div className="text-sm font-medium text-red-700 dark:text-red-300">
            Recording...
          </div>
          <div className="text-xs text-red-600 dark:text-red-400">
            {formatTime(recordingTime)}
          </div>
        </div>
        
        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              stopRecording();
              deleteRecording();
              onCancel();
            }}
            className={`${buttonSize} text-gray-600 hover:text-gray-700`}
          >
            <Trash2 className={iconSize} />
          </Button>
        )}
      </div>
    );
  }

  // Show initial record button
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={startRecording}
      className={`${buttonSize} text-blue-600 hover:text-blue-700 ${className}`}
      title="Record voice message"
    >
      <Mic className={iconSize} />
    </Button>
  );
}