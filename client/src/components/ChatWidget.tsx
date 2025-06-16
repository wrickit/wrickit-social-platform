import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send } from "lucide-react";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ["/api/messages", userId],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { toUserId: number; content: string }) => {
      await apiRequest("POST", "/api/messages", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", userId] });
      setMessage("");
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;

    sendMessageMutation.mutate({
      toUserId: userId,
      content: message.trim(),
    });

    // Send message via WebSocket for real-time updates
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'message',
        toUserId: userId,
        content: message.trim(),
      }));
    }
  };

  // For demo purposes, we'll show a placeholder user name
  const contactName = `User ${userId}`;

  return (
    <Card className="fixed bottom-4 right-4 w-80 content-box rounded-lg shadow-lg">
      <CardHeader className="fb-blue-bg text-white p-3 rounded-t-lg flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-xs font-bold">{contactName.charAt(0)}</span>
          </div>
          <span className="font-bold">{contactName}</span>
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
        <div className="h-64 p-3 overflow-y-auto bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-center text-fb-text-light py-8">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((msg: any) => (
                <div
                  key={msg.id}
                  className={`p-2 rounded text-sm ${
                    msg.fromUserId === userId
                      ? "bg-white ml-8"
                      : "fb-blue-bg text-white mr-8"
                  }`}
                >
                  <p>{msg.content}</p>
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
        
        <div className="p-3 border-t border-gray-200">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 text-sm"
            />
            <Button
              type="submit"
              disabled={sendMessageMutation.isPending}
              className="fb-blue-bg hover:bg-blue-700 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
