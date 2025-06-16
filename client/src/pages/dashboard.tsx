import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import RightSidebar from "@/components/RightSidebar";
import PostForm from "@/components/PostForm";
import PostFeed from "@/components/PostFeed";
import RelationshipForm from "@/components/RelationshipForm";
import ChatWidget from "@/components/ChatWidget";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export default function Dashboard() {
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatUserId, setChatUserId] = useState<number | null>(null);

  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
  });

  const { data: relationships = [] } = useQuery({
    queryKey: ["/api/relationships"],
  });

  const { data: friendGroups = [] } = useQuery({
    queryKey: ["/api/friend-groups"],
  });

  const openChat = (userId: number) => {
    setChatUserId(userId);
    setChatOpen(true);
  };

  const closeChat = () => {
    setChatOpen(false);
    setChatUserId(null);
  };

  if (!user) {
    return null;
  }

  // Find mutual crush notifications
  const mutualCrushNotifications = notifications.filter(
    (n: any) => n.type === 'mutual_crush' && !n.isRead
  );

  return (
    <div className="min-h-screen app-gray-bg">
      <Header user={user} notifications={notifications} />
      
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <Sidebar user={user} relationships={relationships} friendGroups={friendGroups} />
          
          <main className="flex-1 space-y-6">
            {/* Mutual Crush Notifications */}
            {mutualCrushNotifications.map((notification: any) => (
              <div key={notification.id} className="content-box rounded p-4 bg-pink-50 border-pink-200">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">💕</div>
                  <div>
                    <h3 className="font-bold app-text">You have a mutual crush!</h3>
                    <p className="text-sm app-text-light">{notification.message}</p>
                    <button
                      onClick={() => notification.relatedUserId && openChat(notification.relatedUserId)}
                      className="mt-2 youtube-red-bg text-white px-4 py-1 rounded text-sm hover:bg-red-700"
                    >
                      Send Message
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <RelationshipForm />
            <PostForm />
            <PostFeed />
          </main>
          
          <RightSidebar 
            relationships={relationships}
            friendGroups={friendGroups}
            notifications={notifications}
            onOpenChat={openChat}
          />
        </div>
      </div>

      {chatOpen && chatUserId && (
        <ChatWidget userId={chatUserId} onClose={closeChat} />
      )}
    </div>
  );
}
