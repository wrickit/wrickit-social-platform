import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, Mic, Play, Pause } from "lucide-react";
import VoiceRecorder from "./VoiceRecorder";
import VoicePlayer from "./VoicePlayer";
import ReadReceipt from "./ReadReceipt";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface ChatWidgetProps {
  userId: number;
  onClose: () => void;
}

// Voice message player component for ChatWidget
function VoiceMessagePlayer({ 
  audioUrl, 
  duration, 
  isOwnMessage 
}: { 
  audioUrl: string; 
  duration: number; 
  isOwnMessage: boolean; 
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlayback = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(Math.floor(audio.currentTime));
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const handleLoadedMetadata = () => {
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [duration]);

  // Use provided duration or fallback to audio duration
  const actualDuration = duration > 0 ? duration : Math.ceil(audioRef.current?.duration || 0);
  const progress = actualDuration > 0 ? (currentTime / actualDuration) * 100 : 0;

  return (
    <div className="flex items-center space-x-2 min-w-[180px]">
      <audio ref={audioRef} src={audioUrl} />
      
      <button
        onClick={togglePlayback}
        className={`w-6 h-6 rounded-full flex items-center justify-center ${
          isOwnMessage 
            ? 'bg-blue-400 hover:bg-blue-300' 
            : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
        }`}
      >
        {isPlaying ? (
          <Pause className="w-3 h-3" />
        ) : (
          <Play className="w-3 h-3 ml-0.5" />
        )}
      </button>

      <div className="flex-1">
        <div className={`w-full h-1 rounded-full ${
          isOwnMessage ? 'bg-blue-300' : 'bg-gray-300 dark:bg-gray-600'
        }`}>
          <div 
            className={`h-1 rounded-full transition-all duration-100 ${
              isOwnMessage ? 'bg-white' : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className={`text-xs mt-0.5 ${
          isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
        }`}>
          {formatTime(currentTime)} / {formatTime(actualDuration)}
        </div>
      </div>
    </div>
  );
}

export default function ChatWidget({ userId, onClose }: ChatWidgetProps) {
  const [message, setMessage] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [voiceMessage, setVoiceMessage] = useState<{ url: string; duration: number } | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery<any[]>({
    queryKey: ["/api/messages", userId],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { toUserId: number; content: string; voiceMessageUrl?: string; voiceMessageDuration?: number }) => {
      await apiRequest("POST", "/api/messages", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", userId] });
      setMessage("");
      setVoiceMessage(null);
    },
  });

  // WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("WebSocket connected");
      setWs(socket);
      
      // Authenticate user with WebSocket server
      // Note: userId here is the chat partner, we need to get current user
      fetch('/api/user')
        .then(res => res.json())
        .then(currentUser => {
          if (currentUser.id) {
            socket.send(JSON.stringify({
              type: 'auth',
              userId: currentUser.id
            }));
          }
        })
        .catch(console.warn);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'message') {
        queryClient.invalidateQueries({ queryKey: ["/api/messages", userId] });
      }
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
      setWs(null);
    };

    return () => {
      socket.close();
    };
  }, [userId, queryClient]);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Scroll to bottom when widget opens
  useEffect(() => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      }, 100);
    }
  }, [userId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() && !voiceMessage) return;

    sendMessageMutation.mutate({
      toUserId: userId,
      content: message.trim() || "",
      voiceMessageUrl: voiceMessage?.url,
      voiceMessageDuration: voiceMessage?.duration,
    });

    // Send message via WebSocket for real-time updates
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'message',
        toUserId: userId,
        content: message.trim() || "",
        voiceMessageUrl: voiceMessage?.url,
        voiceMessageDuration: voiceMessage?.duration,
      }));
    }
  };

  const handleVoiceMessage = (audioData: string, duration: number) => {
    setVoiceMessage({ url: audioData, duration });
    setIsVoiceMode(true);
  };

  const handleSendVoiceMessage = () => {
    if (!voiceMessage) return;
    
    sendMessageMutation.mutate({
      toUserId: userId,
      content: "",
      voiceMessageUrl: voiceMessage.url,
      voiceMessageDuration: voiceMessage.duration,
    });
    
    // Reset voice mode after sending
    setIsVoiceMode(false);
    setVoiceMessage(null);
  };

  const handleCancelVoiceMessage = () => {
    setVoiceMessage(null);
    setIsVoiceMode(false);
  };

  // For demo purposes, we'll show a placeholder user name
  const contactName = `User ${userId}`;

  return (
    <Card className="fixed bottom-4 right-4 w-80 glass-effect rounded-xl teen-shadow sparkle-border">
      <CardHeader className="gradient-bg text-white p-3 rounded-t-xl flex flex-row items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center pulse-glow">
            <span className="text-sm font-bold">{contactName.charAt(0)}</span>
          </div>
          <span className="font-bold">💬 {contactName}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white hover:bg-white/20 p-1 h-auto"
        >
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="h-64 overflow-hidden flex flex-col bg-gray-50">
          <div className="flex-1 overflow-y-auto p-3" style={{ scrollBehavior: 'smooth' }}>
            {(messages as any[]).length === 0 ? (
              <div className="text-center text-fb-text-light py-8">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <div className="space-y-2 min-h-full flex flex-col justify-end">
                {(messages as any[]).map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`p-2 rounded text-sm ${
                      msg.fromUserId === userId
                        ? "bg-white ml-8"
                        : "fb-blue-bg text-white mr-8"
                    }`}
                  >
                    {msg.voiceMessageUrl ? (
                      <VoicePlayer
                        audioUrl={msg.voiceMessageUrl}
                        duration={msg.voiceMessageDuration}
                        size="sm"
                      />
                    ) : (
                      <p>{msg.content}</p>
                    )}
                    <div className={`flex items-center justify-between mt-1 ${
                      msg.fromUserId === userId
                        ? "text-fb-text-light"
                        : "text-blue-100"
                    }`}>
                      <p className="text-xs">
                        {msg.createdAt ? formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true }) : 'Just now'}
                      </p>
                      <ReadReceipt 
                        isRead={msg.isRead}
                        readAt={msg.readAt}
                        isOwnMessage={msg.fromUserId !== userId}
                      />
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>
        
        <div className="p-3 border-t border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          {isVoiceMode ? (
            <VoiceRecorder
              onRecordingComplete={handleVoiceMessage}
              onSend={handleSendVoiceMessage}
              onCancel={handleCancelVoiceMessage}
              disabled={sendMessageMutation.isPending}
            />
          ) : (
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <Input
                type="text"
                placeholder="Type something cute... 💕"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 text-sm border-purple-200 focus:border-purple-400 rounded-full"
              />
              <Button
                type="button"
                onClick={() => setIsVoiceMode(true)}
                variant="ghost"
                className="text-purple-700 hover:bg-purple-50 rounded-full w-10 h-10 p-0"
                title="Record voice message"
              >
                <Mic className="w-4 h-4" />
              </Button>
              <Button
                type="submit"
                disabled={sendMessageMutation.isPending || !message.trim()}
                className="gradient-bg hover:scale-110 transition-transform duration-300 text-white rounded-full w-10 h-10 p-0 teen-shadow"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
