import { useState, useRef, useEffect, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Play, Pause, Trash2, Send } from "lucide-react";
import { getSupportedMimeType, formatTime, createAudioConstraints } from "@/utils/audioUtils";

interface VoiceRecorderProps {
  onRecordingComplete?: (audioUrl: string, duration: number) => void;
  onVoiceMessage?: (audioUrl: string, duration: number) => void;
  onSend?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
  size?: string;
  className?: string;
}

const VoiceRecorder = forwardRef<HTMLDivElement, VoiceRecorderProps>(({ 
  onRecordingComplete, 
  onVoiceMessage,
  onSend, 
  onCancel, 
  disabled 
}, ref) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = async () => {
    try {
      // Only request microphone access when user explicitly clicks to record
      const constraints = createAudioConstraints();
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      const mimeType = getSupportedMimeType();
      const options = { mimeType };
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = getSupportedMimeType();
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Use the recording time directly - it's more reliable than audio metadata for blob URLs
        let actualDuration = recordingTime;
        
        // Ensure we have a valid duration (minimum 1 second)
        if (!actualDuration || actualDuration <= 0) {
          actualDuration = 1;
        }
        
        setDuration(actualDuration);
        
        // Convert blob to base64 for storage
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          const callback = onRecordingComplete || onVoiceMessage;
          if (callback) {
            callback(base64, actualDuration);
          }
        };
        reader.readAsDataURL(blob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      startTimeRef.current = Date.now();
      
      // Start timer
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingTime(elapsed);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      
      // Show user-friendly error message
      let errorMessage = "Microphone access denied.";
      
      if (window.location.protocol === 'http:') {
        if (window.location.hostname.includes('replit') || window.location.hostname.includes('repl.co')) {
          errorMessage = "Voice recording requires HTTPS. Try using the deployment URL or enable HTTPS in your browser settings for this site.";
        } else {
          errorMessage = "Voice recording requires HTTPS. Please access the site via a secure connection.";
        }
      } else if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = "Microphone permission denied. Please allow microphone access in your browser settings.";
            break;
          case 'NotFoundError':
            errorMessage = "No microphone found. Please connect a microphone and try again.";
            break;
          case 'NotSupportedError':
            errorMessage = "Voice recording is not supported in this browser.";
            break;
          default:
            errorMessage = `Microphone error: ${error.message}`;
        }
      }
      
      alert(errorMessage);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const deleteRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setDuration(0);
    setRecordingTime(0);
    setCurrentTime(0);
    setIsPlaying(false);
    if (onCancel) {
      onCancel();
    }
  };



  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;
    
    try {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    } catch (error) {
      console.error('Error seeking audio:', error);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      
      const updateTime = () => setCurrentTime(audio.currentTime);
      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
      
      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('ended', handleEnded);
      
      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // If we have a recording, show playback controls
  if (audioUrl) {
    return (
      <div ref={ref} className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <audio ref={audioRef} src={audioUrl} />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={togglePlayback}
          className="h-8 w-8 p-0"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>

        <div className="flex-1">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Voice message • {formatTime(duration)}
          </div>
          <div 
            className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1 cursor-pointer"
            onClick={handleProgressClick}
          >
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-100"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={deleteRecording}
          className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
        >
          <Trash2 className="w-4 h-4" />
        </Button>

        {onSend && (
          <Button
            type="button"
            size="sm"
            onClick={onSend}
            disabled={disabled}
            className="h-8 px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }

  // Recording interface
  return (
    <div ref={ref} className="flex items-center space-x-2">
      {isRecording ? (
        <div className="flex items-center space-x-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-red-600 dark:text-red-400">
            Recording • {formatTime(recordingTime)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={stopRecording}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
          >
            <MicOff className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={startRecording}
          disabled={disabled}
          className="h-8 w-8 p-0"
          title="Record voice message"
        >
          <Mic className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
});

VoiceRecorder.displayName = "VoiceRecorder";

export default VoiceRecorder;