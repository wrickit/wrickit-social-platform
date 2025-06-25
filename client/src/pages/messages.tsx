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
  ArrowLeft,
  Play,
  Pause,
  Mic,
  Users
} from "lucide-react";
import VoiceRecorder from "@/components/VoiceRecorder";
import ReadReceipt from "@/components/ReadReceipt";
import VoiceCall from "@/components/VoiceCall";

interface Conversation {
  id: number;
  fromUserId: number;
  toUserId: number;
  content: string;
  createdAt: string;
  isRead: boolean;
  voiceMessageUrl?: string;
  voiceMessageDuration?: number;
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

// Voice message player component
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
    <div className="flex items-center space-x-2 min-w-[200px]">
      <audio ref={audioRef} src={audioUrl} />
      
      <button
        onClick={togglePlayback}
        className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isOwnMessage 
            ? 'bg-blue-400 hover:bg-blue-300' 
            : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
        }`}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
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

export default function Messages() {
  const { user } = useAuth() as { user: AuthUser | null };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newConversationUser, setNewConversationUser] = useState<User | null>(null);
  const [selectedGroupChat, setSelectedGroupChat] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [voiceMessage, setVoiceMessage] = useState<{ url: string; duration: number } | null>(null);
  const [voiceCall, setVoiceCall] = useState<{
    isOpen: boolean;
    targetUser: {
      id: number;
      name: string;
      profileImageUrl?: string;
    };
    isIncoming: boolean;
  } | null>(null);
  
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const ringtoneIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!user) return;

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}`;
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log("WebSocket connected");
        setWs(socket);
      
      // Authenticate user with WebSocket server
      socket.send(JSON.stringify({
        type: 'auth',
        userId: user.id
      }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'message') {
        queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
        if (selectedConversation) {
          queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedConversation] });
        }
      } else if (data.type === 'call-offer') {
        // Handle incoming voice call
        handleIncomingCall(data.fromUserId);
      }
    };

      socket.onerror = (error) => {
        console.warn("WebSocket error:", error);
        setWs(null);
      };

      socket.onclose = () => {
        console.log("WebSocket disconnected");
        setWs(null);
      };

      return () => {
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close();
        }
      };
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      setWs(null);
    }
  }, [user, queryClient, selectedConversation, selectedGroupChat]);

  // Fetch recent conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/messages"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Handle URL parameters for auto-opening chats
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user');
    const groupId = urlParams.get('group');
    
    if (userId) {
      const userIdNum = parseInt(userId, 10);
      if (!isNaN(userIdNum) && user) {
        // Check if conversation exists, if not create new conversation
        const existingConversation = conversations.find(conv => 
          (conv.fromUserId === user.id && conv.toUserId === userIdNum) ||
          (conv.fromUserId === userIdNum && conv.toUserId === user.id)
        );
        
        if (existingConversation) {
          // Open existing conversation
          setSelectedConversation(userIdNum);
          setNewConversationUser(null);
        } else {
          // Create new conversation by fetching user info and setting as new conversation
          fetch(`/api/users/${userIdNum}`)
            .then(response => response.json())
            .then(userData => {
              setNewConversationUser(userData);
              setSelectedConversation(null);
              setSelectedGroupChat(null);
            })
            .catch(console.error);
        }
        
        // Clear URL parameters after handling
        window.history.replaceState({}, document.title, '/messages');
      }
    } else if (groupId) {
      const groupIdNum = parseInt(groupId, 10);
      if (!isNaN(groupIdNum)) {
        setSelectedGroupChat(groupIdNum);
        setSelectedConversation(null);
        setNewConversationUser(null);
        // Clear URL parameters after handling
        window.history.replaceState({}, document.title, '/messages');
      }
    }
  }, [conversations, user]);

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery<any[]>({
    queryKey: ["/api/messages", selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const response = await fetch(`/api/messages/${selectedConversation}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedConversation,
    refetchInterval: 2000, // Refresh every 2 seconds
  });

  // Fetch friend groups
  const { data: friendGroups = [] } = useQuery<FriendGroup[]>({
    queryKey: ["/api/friend-groups"],
  });

  // Fetch group messages for selected group chat
  const { data: groupMessages = [], isLoading: groupMessagesLoading } = useQuery<GroupMessage[]>({
    queryKey: ["/api/group-messages", selectedGroupChat],
    queryFn: async () => {
      if (!selectedGroupChat) return [];
      const response = await fetch(`/api/group-messages/${selectedGroupChat}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedGroupChat,
    refetchInterval: 2000, // Refresh every 2 seconds
  });

  // Get selected group info
  const selectedGroup = selectedGroupChat ? friendGroups.find(g => g.id === selectedGroupChat) : null;

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
    mutationFn: async ({ 
      toUserId, 
      content, 
      voiceMessageUrl, 
      voiceMessageDuration 
    }: { 
      toUserId: number; 
      content: string; 
      voiceMessageUrl?: string; 
      voiceMessageDuration?: number; 
    }) => {
      await apiRequest("POST", "/api/messages", { 
        toUserId, 
        content, 
        voiceMessageUrl, 
        voiceMessageDuration 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      if (selectedConversation) {
        queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedConversation] });
      }
      setNewMessage("");
      setVoiceMessage(null);
      
      // Send real-time update via WebSocket
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'message',
          toUserId: selectedConversation,
          content: newMessage.trim(),
        }));
      }
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
    if ((!newMessage.trim() && !voiceMessage)) return;
    if (!selectedConversation && !newConversationUser && !selectedGroupChat) return;
    
    if (selectedGroupChat) {
      // Send group message
      sendMessageMutation.mutate({
        groupId: selectedGroupChat,
        content: newMessage.trim() || "",
        voiceMessageUrl: voiceMessage?.url,
        voiceMessageDuration: voiceMessage?.duration,
      });
    } else {
      // Send regular message
      const targetUserId = selectedConversation || newConversationUser?.id;
      if (targetUserId) {
        sendMessageMutation.mutate({
          toUserId: targetUserId,
          content: newMessage.trim() || "",
          voiceMessageUrl: voiceMessage?.url,
          voiceMessageDuration: voiceMessage?.duration,
        });
      }
    }
  };

  const handleVoiceMessage = (audioUrl: string, duration: number) => {
    setVoiceMessage({ url: audioUrl, duration });
  };

  const handleSendVoiceMessage = () => {
    if (!voiceMessage) return;
    if (!selectedConversation && !newConversationUser && !selectedGroupChat) return;
    
    if (selectedGroupChat) {
      // Send group voice message
      sendMessageMutation.mutate({
        groupId: selectedGroupChat,
        content: "",
        voiceMessageUrl: voiceMessage.url,
        voiceMessageDuration: voiceMessage.duration,
      });
    } else {
      // Send regular voice message
      const targetUserId = selectedConversation || newConversationUser?.id;
      if (targetUserId) {
        sendMessageMutation.mutate({
          toUserId: targetUserId,
          content: "",
          voiceMessageUrl: voiceMessage.url,
          voiceMessageDuration: voiceMessage.duration,
        });
      }
    }
  };

  const startNewConversation = (targetUser: User) => {
    setSelectedConversation(targetUser.id);
    setNewConversationUser(targetUser);
    setShowNewChat(false);
    setSearchQuery("");
    // Refresh conversations to update read status
    queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
  };

  const startRingtone = () => {
    // Create simple repeating beep sound
    const playBeep = () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch (error) {
        console.warn('Could not play ringtone beep:', error);
      }
    };

    // Play immediately and then repeat every 1.5 seconds
    playBeep();
    ringtoneIntervalRef.current = setInterval(playBeep, 1500);
  };

  const stopRingtone = () => {
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
  };

  const handleIncomingCall = async (fromUserId: number) => {
    // Get caller info
    try {
      const response = await fetch(`/api/users/${fromUserId}`);
      const caller = await response.json();
      
      // Start ringing sound
      startRingtone();
      
      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Incoming call from ${caller.name}`, {
          body: 'Click to answer the call',
          icon: caller.profileImageUrl || '/default-avatar.png'
        });
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        // Request permission for future notifications
        Notification.requestPermission();
      }
      
      setVoiceCall({
        isOpen: true,
        targetUser: {
          id: caller.id,
          name: caller.name,
          profileImageUrl: caller.profileImageUrl
        },
        isIncoming: true
      });
    } catch (error) {
      console.error('Error getting caller info:', error);
    }
  };

  const startVoiceCall = (targetUser: { id: number; name: string; profileImageUrl?: string }) => {
    setVoiceCall({
      isOpen: true,
      targetUser,
      isIncoming: false
    });
  };

  const closeVoiceCall = () => {
    stopRingtone();
    setVoiceCall(null);
  };

  const acceptCall = () => {
    stopRingtone();
    // Call will be handled by VoiceCall component
  };

  const declineCall = () => {
    stopRingtone();
    setVoiceCall(null);
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

  // Check online status of selected conversation partner
  const { data: onlineStatus } = useQuery<{ isOnline: boolean }>({
    queryKey: [`/api/users/${selectedConversation}/online`],
    enabled: !!selectedConversation,
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Get online status for conversation partners (simplified approach)
  const conversationPartnerIds = conversations.map(conv => getConversationPartner(conv).id);
  const { data: allOnlineStatuses = {} } = useQuery<Record<number, boolean>>({
    queryKey: ["/api/users/online-statuses", conversationPartnerIds.join(",")],
    queryFn: async () => {
      if (conversationPartnerIds.length === 0) return {};
      
      const statuses: Record<number, boolean> = {};
      // Check online status for each partner
      for (const userId of conversationPartnerIds) {
        try {
          const response = await fetch(`/api/users/${userId}/online`);
          if (response.ok) {
            const data = await response.json();
            statuses[userId] = data.isOnline;
          } else {
            statuses[userId] = false;
          }
        } catch {
          statuses[userId] = false;
        }
      }
      return statuses;
    },
    enabled: conversationPartnerIds.length > 0,
    refetchInterval: 45000, // Check every 45 seconds
  });

  // Mobile: Show conversation list or chat view
  const showConversationList = isMobile ? (!selectedConversation && !selectedGroupChat) : true;
  const showChatView = selectedConversation || newConversationUser || selectedGroupChat;

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
            ) : conversations.length === 0 && friendGroups.length === 0 ? (
              <div className="p-4 text-center">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="app-text-light">No conversations yet</p>
                <p className="text-xs app-text-light mt-1">Start a new conversation above</p>
              </div>
            ) : (
              <div className="p-2">
                {/* Friend Groups */}
                {friendGroups.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium app-text-light px-3 mb-2">Friend Groups</h3>
                    {friendGroups.map((group: FriendGroup) => {
                      const isSelected = group.id === selectedGroupChat;
                      
                      return (
                        <div
                          key={`group-${group.id}`}
                          onClick={() => {
                            setSelectedGroupChat(group.id);
                            setSelectedConversation(null);
                            setNewConversationUser(null);
                          }}
                          className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            isSelected 
                              ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700' 
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
                              <Users className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium app-text truncate">{group.name}</p>
                            </div>
                            <p className="text-sm app-text-light truncate">
                              {group.members?.length || 0} members
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Direct Messages */}
                {conversations.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium app-text-light px-3 mb-2">Direct Messages</h3>
                    {conversations.map((conversation: Conversation) => {
                      const partner = getConversationPartner(conversation);
                      const isSelected = partner.id === selectedConversation;
                      
                      return (
                        <div
                          key={`${conversation.fromUserId}-${conversation.toUserId}`}
                          onClick={() => {
                            setSelectedConversation(partner.id);
                            setNewConversationUser(null);
                            setSelectedGroupChat(null);
                          }}
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
                            {allOnlineStatuses[partner.id] && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium app-text truncate">{partner.name}</p>
                              <span className="text-xs app-text-light">{formatTime(conversation.createdAt)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-sm app-text-light truncate">
                                {conversation.fromUserId === (user as any)?.id ? "You: " : ""}
                                {conversation.voiceMessageUrl ? (
                                  <span className="flex items-center">
                                    <Mic className="w-3 h-3 mr-1" />
                                    Voice message
                                  </span>
                                ) : (
                                  conversation.content
                                )}
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
                    onClick={() => {
                      setSelectedConversation(null);
                      setNewConversationUser(null);
                      setSelectedGroupChat(null);
                    }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                )}
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedUser ? getConversationPartner(selectedUser).profileImageUrl : 
                                     newConversationUser ? newConversationUser.profileImageUrl : undefined} />
                    <AvatarFallback>
                      {selectedUser ? getConversationPartner(selectedUser).name.charAt(0) : 
                       newConversationUser ? newConversationUser.name.charAt(0) :
                       selectedGroup ? selectedGroup.name.charAt(0) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  {onlineStatus?.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border border-white dark:border-gray-800 rounded-full"></div>
                  )}
                </div>
                <div>
                  <p className="font-medium app-text">
                    {selectedUser ? getConversationPartner(selectedUser).name : 
                     newConversationUser ? newConversationUser.name :
                     selectedGroup ? selectedGroup.name :
                     "Select a conversation"}
                  </p>
                  <p className="text-sm app-text-light">
                    {selectedGroup ? `${selectedGroup.members?.length || 0} members` :
                     onlineStatus?.isOnline ? "Active now" : 
                     (selectedUser || newConversationUser) ? "Offline" : ""}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    const partner = selectedUser ? getConversationPartner(selectedUser) : newConversationUser;
                    if (partner) {
                      startVoiceCall({
                        id: partner.id,
                        name: partner.name,
                        profileImageUrl: partner.profileImageUrl
                      });
                    }
                  }}
                >
                  <Phone className="w-4 h-4" />
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
                          {message.voiceMessageUrl ? (
                            <VoiceMessagePlayer 
                              audioUrl={message.voiceMessageUrl}
                              duration={message.voiceMessageDuration || 0}
                              isOwnMessage={isOwnMessage}
                            />
                          ) : (
                            <p className="text-sm">{message.content}</p>
                          )}
                          <div className={`flex items-center justify-between mt-1 ${
                            isOwnMessage ? 'text-blue-100' : 'app-text-light'
                          }`}>
                            <p className="text-xs">
                              {formatTime(message.createdAt)}
                            </p>
                            <div className="flex items-center">
                              <ReadReceipt 
                                isRead={message.isRead}
                                readAt={message.readAt}
                                isOwnMessage={isOwnMessage}
                              />
                            </div>
                          </div>
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
          {(selectedConversation || newConversationUser || selectedGroupChat) && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              {voiceMessage ? (
                <VoiceRecorder
                  onRecordingComplete={handleVoiceMessage}
                  onSend={handleSendVoiceMessage}
                  onCancel={() => setVoiceMessage(null)}
                  disabled={sendMessageMutation.isPending}
                />
              ) : (
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setVoiceMessage({ url: "", duration: 0 })}
                    disabled={sendMessageMutation.isPending}
                    className="h-9 w-9 p-0"
                    title="Record voice message"
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                  <Button
                    type="submit"
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    className="discord-purple-bg hover:bg-purple-700 text-white"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              )}
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

      {/* Voice Call Component */}
      {voiceCall && (
        <VoiceCall
          isOpen={voiceCall.isOpen}
          onClose={closeVoiceCall}
          targetUser={voiceCall.targetUser}
          isIncoming={voiceCall.isIncoming}
          onAccept={acceptCall}
          onDecline={declineCall}
          existingWs={ws}
          currentUserId={user?.id}
        />
      )}
    </div>
  );
}