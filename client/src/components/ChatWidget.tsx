import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, Mic } from "lucide-react";
import VoiceRecorder from "./VoiceRecorder";
import VoicePlayer from "./VoicePlayer";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface ChatWidgetProps {
  userId: number;
  onClose: () => void;
}

export default function ChatWidget({ userId, onClose }: ChatWidgetProps) {
  const [message, setMessage] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [voiceMessage, setVoiceMessage] = useState<{ url: string; duration: number } | null>(null);
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
    // Auto-send voice message
    sendMessageMutation.mutate({
      toUserId: userId,
      content: "",
      voiceMessageUrl: audioData,
      voiceMessageDuration: duration,
    });
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
                    <p className={`text-xs mt-1 ${
                      msg.fromUserId === userId
                        ? "text-fb-text-light"
                        : "text-blue-100"
                    }`}>
                      {msg.createdAt ? formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true }) : 'Just now'}
                    </p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>
        
        <div className="p-3 border-t border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              type="text"
              placeholder="Type something cute... 💕"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 text-sm border-purple-200 focus:border-purple-400 rounded-full"
            />
            <VoiceRecorder
              onVoiceMessage={handleVoiceMessage}
              size="sm"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            />
            <Button
              type="submit"
              disabled={sendMessageMutation.isPending || (!message.trim() && !voiceMessage)}
              className="gradient-bg hover:scale-110 transition-transform duration-300 text-white rounded-full w-10 h-10 p-0 teen-shadow"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
