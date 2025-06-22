import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { 
  Search, 
  Send, 
  UserPlus, 
  MessageCircle, 
  Phone, 
  Video, 
  MoreVertical,
  ArrowLeft 
} from "lucide-react";

interface Conversation {
  id: number;
  fromUserId: number;
  toUserId: number;
  content: string;
  createdAt: string;
  isRead: boolean;
  fromUser: {
    id: number;
    name: string;
    admissionNumber: string;
    profileImageUrl?: string;
  };
  toUser: {
    id: number;
    name: string;
    admissionNumber: string;
    profileImageUrl?: string;
  };
}

interface User {
  id: number;
  name: string;
  admissionNumber: string;
  class: string;
  profileImageUrl?: string;
}

interface AuthUser {
  id: number;
  name: string;
  admissionNumber: string;
  class: string;
  profileImageUrl?: string;
}

export default function Messages() {
  const { user } = useAuth() as { user: AuthUser | null };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch recent conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/messages"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/messages", selectedConversation],
    enabled: !!selectedConversation,
    refetchInterval: 2000, // Refresh every 2 seconds
  });

  // Search users for new conversations
  const { data: searchResults = [] } = useQuery<User[]>({
    queryKey: ["/api/users/search-all", searchQuery],
    queryFn: async () => {
      if (searchQuery.length < 2) return [];
      const response = await fetch(`/api/users/search-all?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: searchQuery.length > 2,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ toUserId, content }: { toUserId: number; content: string }) => {
      await apiRequest("POST", "/api/messages", { toUserId, content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      if (selectedConversation) {
        queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedConversation] });
      }
      setNewMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Scroll to bottom when conversation changes
  useEffect(() => {
    if (selectedConversation && messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      }, 100);
    }
  }, [selectedConversation]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;
    
    sendMessageMutation.mutate({
      toUserId: selectedConversation,
      content: newMessage.trim(),
    });
  };

  const startNewConversation = (targetUser: User) => {
    setSelectedConversation(targetUser.id);
    setShowNewChat(false);
    setSearchQuery("");
    // Refresh conversations to update read status
    queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
  };

  const getConversationPartner = (conversation: Conversation) => {
    if (!user) return conversation.fromUser;
    return conversation.fromUserId === (user as any).id ? conversation.toUser : conversation.fromUser;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString();
  };

  const selectedUser = conversations.find((conv: Conversation) => 
    getConversationPartner(conv).id === selectedConversation
  );

  // Mobile: Show conversation list or chat view
  const showConversationList = isMobile ? !selectedConversation : true;
  const showChatView = isMobile ? !!selectedConversation : !!selectedConversation;

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Conversation List */}
      {showConversationList && (
        <div className={`${isMobile ? 'w-full' : 'w-80'} border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/")}
                  className="app-text hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <h1 className="text-xl font-bold app-text">Messages</h1>
              </div>
              <Button
                onClick={() => setShowNewChat(!showNewChat)}
                size="sm"
                className="discord-purple-bg hover:bg-purple-700 text-white"
              >
                <UserPlus className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Search for new conversations */}
            {showNewChat && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search users by name or username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {searchResults.length > 0 && (
                  <ScrollArea className="h-32 border rounded-md p-2">
                    {searchResults.map((searchUser: User) => (
                      <div
                        key={searchUser.id}
                        onClick={() => startNewConversation(searchUser)}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={searchUser.profileImageUrl} />
                          <AvatarFallback>{searchUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium app-text">{searchUser.name}</p>
                          <p className="text-xs app-text-light">Class {searchUser.class}</p>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                )}
              </div>
            )}
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1">
            {conversationsLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="app-text-light">No conversations yet</p>
                <p className="text-xs app-text-light mt-1">Start a new conversation above</p>
              </div>
            ) : (
              <div className="p-2">
                {conversations.map((conversation: Conversation) => {
                  const partner = getConversationPartner(conversation);
                  const isSelected = partner.id === selectedConversation;
                  
                  return (
                    <div
                      key={`${conversation.fromUserId}-${conversation.toUserId}`}
                      onClick={() => setSelectedConversation(partner.id)}
                      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={partner.profileImageUrl} />
                          <AvatarFallback>{partner.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium app-text truncate">{partner.name}</p>
                          <span className="text-xs app-text-light">{formatTime(conversation.createdAt)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm app-text-light truncate">
                            {conversation.fromUserId === (user as any)?.id ? "You: " : ""}{conversation.content}
                          </p>
                          {!conversation.isRead && conversation.toUserId === (user as any)?.id && (
                            <Badge className="bg-blue-500 text-white text-xs">new</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* Chat View */}
      {showChatView ? (
        <div className={`${isMobile ? 'w-full' : 'flex-1'} flex flex-col bg-white dark:bg-gray-800`}>
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                )}
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedUser ? getConversationPartner(selectedUser).profileImageUrl : undefined} />
                    <AvatarFallback>
                      {selectedUser ? getConversationPartner(selectedUser).name.charAt(0) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border border-white dark:border-gray-800 rounded-full"></div>
                </div>
                <div>
                  <p className="font-medium app-text">
                    {selectedUser ? getConversationPartner(selectedUser).name : "Select a conversation"}
                  </p>
                  <p className="text-sm app-text-light">Active now</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-4" style={{ scrollBehavior: 'smooth' }}>
              {messagesLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                      <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-10 w-48"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4 min-h-full flex flex-col justify-end">
                  {messages.map((message: any) => {
                    const isOwnMessage = message.fromUserId === (user as any)?.id;
                    
                    return (
                      <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          isOwnMessage 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-100 dark:bg-gray-700 app-text'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            isOwnMessage ? 'text-blue-100' : 'app-text-light'
                          }`}>
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Message Input */}
          {selectedConversation && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                  disabled={sendMessageMutation.isPending}
                />
                <Button
                  type="submit"
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="discord-purple-bg hover:bg-purple-700 text-white"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          )}
        </div>
      ) : !isMobile && (
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold app-text mb-2">Select a conversation</h2>
            <p className="app-text-light">Choose from your existing conversations or start a new one</p>
          </div>
        </div>
      )}
    </div>
  );
}