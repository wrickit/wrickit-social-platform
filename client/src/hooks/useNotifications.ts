import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useEffect, useRef, useState } from "react";

interface Notification {
  id: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedUserId?: number;
}

export function useNotifications() {
  const queryClient = useQueryClient();
  const previousNotificationCount = useRef<number>(0);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const originalTitle = useRef<string>(document.title || "Wrickit - Student Social Platform");
  const titleInterval = useRef<NodeJS.Timeout | null>(null);

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    refetchInterval: 10000, // Check every 10 seconds for new notifications
  });

  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  // Play notification sound
  const playNotificationSound = () => {
    try {
      // Create a notification sound using Web Audio API for a pleasant tone
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a pleasant notification chime
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Create a pleasant chime sound (major third interval)
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime); // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.15); // G5
      oscillator.type = 'sine';
      
      // Smooth fade in and out
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.02);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch (error) {
      console.log("Web Audio API not available, using fallback");
      // Fallback to HTML5 audio
      try {
        const audio = new Audio();
        audio.volume = 0.3;
        
        // Create a simple notification sound using data URL
        const audioData = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmcfBjiR1/LMeSoHKIHO8tiJNwgZaLvt559OEAw+m+DvsmEcBjiR1/LMeC4IJWu58tzNfChQoePwtmMcBjiR1/LMeSaWq+fvsWAcBjWR2PLEfCQJF3W/8diN';
        audio.src = audioData;
        audio.play().catch(() => {
          // Silent fail if even this doesn't work
        });
      } catch (e) {
        // Silent fail - notification sounds are not critical
      }
    }
  };

  // Update browser tab title with notification indicator
  const updateTabTitle = (count: number) => {
    if (count > 0) {
      document.title = `(${count}) Wrickit - New notifications!`;
      
      // Animate the title for attention
      if (!titleInterval.current) {
        let showCount = true;
        titleInterval.current = setInterval(() => {
          document.title = showCount 
            ? `(${count}) Wrickit - New notifications!`
            : originalTitle.current;
          showCount = !showCount;
        }, 1500);
      }
    } else {
      document.title = originalTitle.current;
      if (titleInterval.current) {
        clearInterval(titleInterval.current);
        titleInterval.current = null;
      }
    }
  };

  // Show browser notification if permission granted
  const showBrowserNotification = (notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notificationOptions = {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `wrickit-notification-${notification.id}`,
        requireInteraction: false,
        silent: false
      };

      const browserNotification = new Notification('Wrickit', notificationOptions);
      
      // Auto-close after 5 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 5000);

      // Handle click to focus the window
      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
      };
    }
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  };

  // Check for new notifications
  useEffect(() => {
    if (!isLoading && notifications.length > 0) {
      const currentUnreadCount = unreadCount;
      
      // Check if there are new unread notifications since last check
      if (previousNotificationCount.current > 0 && currentUnreadCount > previousNotificationCount.current) {
        const newNotificationsCount = currentUnreadCount - previousNotificationCount.current;
        
        // Play sound for new notifications
        playNotificationSound();
        setHasNewNotifications(true);
        
        // Show browser notification for the most recent notification
        const latestNotification = notifications
          .filter(n => !n.isRead)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        
        if (latestNotification) {
          showBrowserNotification(latestNotification);
        }
        
        // Clear the new notification flag after a delay
        setTimeout(() => setHasNewNotifications(false), 3000);
      }
      
      previousNotificationCount.current = currentUnreadCount;
    }
  }, [notifications, unreadCount, isLoading]);

  // Update tab title when unread count changes
  useEffect(() => {
    updateTabTitle(unreadCount);
    
    // Cleanup on unmount
    return () => {
      if (titleInterval.current) {
        clearInterval(titleInterval.current);
        titleInterval.current = null;
      }
      document.title = originalTitle.current;
    };
  }, [unreadCount]);

  // Handle page visibility change to reset title when user returns
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && unreadCount === 0) {
        document.title = originalTitle.current;
        if (titleInterval.current) {
          clearInterval(titleInterval.current);
          titleInterval.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [unreadCount]);

  return {
    notifications,
    unreadCount,
    hasNewNotifications,
    isLoading,
    requestNotificationPermission,
    playNotificationSound
  };
}