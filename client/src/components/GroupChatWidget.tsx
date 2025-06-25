import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, Mic, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import VoiceRecorder from "./VoiceRecorder";
import VoicePlayer from "./VoicePlayer";

interface GroupChatWidgetProps {
  groupId: number;
  onClose: () => void;
}

interface GroupMessage {
  id: number;
  fromUserId: number;
  groupId: number;
  content: string;
  voiceMessageUrl?: string;
  voiceMessageDuration?: number;
  createdAt: string;
  fromUser: {
    id: number;
    name: string;
    profileImageUrl?: string;
  };
}

interface FriendGroup {
  id: number;
  name: string;
  members: Array<{
    user: {
      id: number;
      name: string;
      profileImageUrl?: string;
    };
  }>;
}

export default function GroupChatWidget({ groupId, onClose }: GroupChatWidgetProps) {
  const [message, setMessage] = useState("");
  const [voiceMessage, setVoiceMessage] = useState<{ url: string; duration: number } | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: group } = useQuery<FriendGroup>({
    queryKey: ["/api/friend-groups", groupId],
    queryFn: async () => {
      const response = await fetch(`/api/friend-groups`);
      const groups = await response.json();
      return groups.find((g: any) => g.id === groupId);
    },
  });

  const { data: messages = [] } = useQuery<GroupMessage[]>({
    queryKey: ["/api/group-messages", groupId],
    queryFn: async () => {
      const response = await fetch(`/api/group-messages/${groupId}`);
      return response.json();
    },
    refetchInterval: 2000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { 
      groupId: number; 
      content: string; 
      voiceMessageUrl?: string; 
      voiceMessageDuration?: number; 
    }) => {
      await apiRequest("POST", "/api/group-messages", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/group-messages", groupId] });
      setMessage("");
      setVoiceMessage(null);
    },
  });

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() && !voiceMessage) return;

    sendMessageMutation.mutate({
      groupId,
      content: message.trim() || "",
      voiceMessageUrl: voiceMessage?.url,
      voiceMessageDuration: voiceMessage?.duration,
    });
  };

  const handleVoiceMessage = (audioData: string, duration: number) => {
    setVoiceMessage({ url: audioData, duration });
    setIsVoiceMode(true);
  };

  const handleSendVoiceMessage = () => {
    if (!voiceMessage) return;
    
    sendMessageMutation.mutate({
      groupId,
      content: "",
      voiceMessageUrl: voiceMessage.url,
      voiceMessageDuration: voiceMessage.duration,
    });
    
    setIsVoiceMode(false);
    setVoiceMessage(null);
  };

  const handleCancelVoiceMessage = () => {
    setVoiceMessage(null);
    setIsVoiceMode(false);
  };

  if (!group) return null;

  return (
    <Card className="fixed bottom-4 right-4 w-80 glass-effect rounded-xl teen-shadow sparkle-border">
      <CardHeader className="gradient-bg text-white p-3 rounded-t-xl flex flex-row items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center pulse-glow">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold">{group.name}</span>
            <p className="text-xs text-white/80">{group.members?.length || 0} members</p>
          </div>
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
            {messages.length === 0 ? (
              <div className="text-center text-fb-text-light py-8">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <div className="space-y-2 min-h-full flex flex-col justify-end">
                {messages.map((msg) => (
                  <div key={msg.id} className="space-y-1">
                    <div className="flex items-center space-x-2">
                      {msg.fromUser.profileImageUrl ? (
                        <img
                          src={msg.fromUser.profileImageUrl}
                          alt={msg.fromUser.name}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-600">
                            {msg.fromUser.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <span className="text-xs font-semibold text-fb-text">
                        {msg.fromUser.name}
                      </span>
                      <span className="text-xs text-fb-text-light">
                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="ml-8 p-2 rounded bg-white border">
                      {msg.voiceMessageUrl ? (
                        <VoicePlayer
                          audioUrl={msg.voiceMessageUrl}
                          duration={msg.voiceMessageDuration}
                          size="sm"
                        />
                      ) : (
                        <p className="text-sm">{msg.content}</p>
                      )}
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
                placeholder="Type a group message..."
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