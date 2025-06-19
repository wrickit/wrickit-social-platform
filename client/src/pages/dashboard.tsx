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
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { Link } from "wouter";

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
      
      <div className="w-full">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Mobile: Hide sidebar by default, show with toggle */}
            <div className="hidden lg:block lg:w-64 xl:w-72">
              <Sidebar user={user} relationships={relationships} friendGroups={friendGroups} />
            </div>
            
            <main className="flex-1 min-w-0 space-y-4 sm:space-y-6">
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
            
            {/* Posts Section with Navigation */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold app-text">Recent Posts</h2>
                <Link href="/posts">
                  <Button variant="outline" size="sm" className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>View All Posts</span>
                  </Button>
                </Link>
              </div>
              <PostForm />
              <PostFeed maxPosts={10} />
            </div>
          </main>
          
          {/* Right sidebar - hidden on mobile and tablet */}
          <div className="hidden xl:block xl:w-80">
            <RightSidebar 
              relationships={relationships}
              friendGroups={friendGroups}
              notifications={notifications}
              onOpenChat={openChat}
            />
          </div>
          </div>
        </div>
      </div>

      {chatOpen && chatUserId && (
        <ChatWidget userId={chatUserId} onClose={closeChat} />
      )}
    </div>
  );
}
