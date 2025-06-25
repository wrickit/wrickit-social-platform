import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { Bell, Heart, MessageCircle, UserPlus, AlertTriangle, Volume2 } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { TooltipWrapper } from "./TooltipWrapper";

interface Notification {
  id: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedUserId?: number;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const queryClient = useQueryClient();

  const { 
    notifications, 
    unreadCount, 
    hasNewNotifications, 
    isLoading, 
    requestNotificationPermission,
    playNotificationSound 
  } = useNotifications();

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await apiRequest("POST", `/api/notifications/${notificationId}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  // Check notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      setShowPermissionPrompt(true);
    }
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setShowPermissionPrompt(false);
    if (granted) {
      // Play a test sound to confirm it's working
      playNotificationSound();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "mutual_crush":
        return <span className="text-lg pulse-glow">💕</span>;
      case "message":
        return <span className="text-lg">💬</span>;
      case "group_message":
        return <span className="text-lg">💬</span>;
      case "post":
        return <span className="text-lg">📝</span>;
      case "relationship":
        return <span className="text-lg">👥</span>;
      case "group":
        return <span className="text-lg">👥</span>;
      case "disciplinary":
        return <span className="text-lg">⚠️</span>;
      case "mention":
        return <span className="text-lg">@</span>;
      default:
        return <span className="text-lg">🔔</span>;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <TooltipWrapper 
        content={unreadCount > 0 ? `You have ${unreadCount} new notifications` : "View your notifications"}
        mobileContent={unreadCount > 0 ? `${unreadCount} new` : "Notifications"}
        side="bottom"
      >
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`relative p-2 hover:scale-110 transition-transform duration-300 ${
              unreadCount > 0 || hasNewNotifications ? 'pulse-glow' : ''
            } ${hasNewNotifications ? 'animate-bounce' : ''}`}
          >
            <span className={`text-xl ${hasNewNotifications ? 'animate-pulse' : 'wiggle'}`}>🔔</span>
            {unreadCount > 0 && (
              <Badge 
                className={`absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs gradient-accent-bg text-white ${
                  hasNewNotifications ? 'animate-ping' : 'pulse-glow'
                }`}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
      </TooltipWrapper>
      <PopoverContent className="w-80 p-0 glass-effect teen-shadow sparkle-border" align="end">
        <div className="flex items-center justify-between p-4 border-b border-purple-200 gradient-bg text-white">
          <h3 className="font-semibold">✨ What's Happening</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
            <TooltipWrapper content="Test notification sound" mobileContent="Test sound" side="bottom">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 p-1 h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  playNotificationSound();
                }}
              >
                <Volume2 className="h-3 w-3" />
              </Button>
            </TooltipWrapper>
          </div>
        </div>

        {/* Permission prompt */}
        {showPermissionPrompt && (
          <div className="p-4 bg-blue-50 border-b">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Enable notifications</p>
                <p className="text-xs text-blue-700 mb-2">Get instant alerts for new messages and updates</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleEnableNotifications}
                  >
                    Enable
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setShowPermissionPrompt(false)}
                  >
                    Maybe later
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No notifications yet</p>
              <p className="text-sm">We'll notify you when something happens!</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification: Notification) => (
                <div
                  key={notification.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? "bg-blue-50 border-l-2 border-l-blue-500" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.isRead ? "font-medium" : ""}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <div className="p-3 border-t text-center">
            <Button variant="ghost" size="sm" className="text-xs text-gray-500">
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}