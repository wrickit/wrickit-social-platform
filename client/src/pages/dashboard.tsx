import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import RightSidebar from "@/components/RightSidebar";
import PostForm from "@/components/PostForm";
import PostFeed from "@/components/PostFeed";
import RelationshipForm from "@/components/RelationshipForm";
import ChatWidget from "@/components/ChatWidget";
import GroupChatWidget from "@/components/GroupChatWidget";
import WelcomeBanner from "@/components/WelcomeBanner";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { Link } from "wouter";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function Dashboard() {
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatUserId, setChatUserId] = useState<number | null>(null);
  const [groupChatOpen, setGroupChatOpen] = useState(false);
  const [groupChatId, setGroupChatId] = useState<number | null>(null);

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
  });

  const { data: relationships = [] } = useQuery<any[]>({
    queryKey: ["/api/relationships"],
  });

  const { data: friendGroups = [] } = useQuery<any[]>({
    queryKey: ["/api/friend-groups"],
  });

  const openChat = (userId: number) => {
    setChatUserId(userId);
    setChatOpen(true);
    setGroupChatOpen(false);
    setGroupChatId(null);
  };

  const closeChat = () => {
    setChatOpen(false);
    setChatUserId(null);
  };

  const openGroupChat = (groupId: number) => {
    setGroupChatId(groupId);
    setGroupChatOpen(true);
    setChatOpen(false);
    setChatUserId(null);
  };

  const closeGroupChat = () => {
    setGroupChatOpen(false);
    setGroupChatId(null);
  };

  if (!user) {
    return null;
  }

  // Find mutual crush notifications
  const mutualCrushNotifications = (notifications as any[]).filter(
    (n: any) => n.type === 'mutual_crush' && !n.isRead
  );

  return (
    <div className="min-h-screen gradient-secondary-bg">
      <Header 
        user={{...user, relationships, friendGroups}} 
      />
      
      <div className="w-full">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Mobile: Hide sidebar by default, show with toggle */}
            <div className="hidden lg:block lg:w-64 xl:w-72">
              <Sidebar user={user} relationships={relationships} friendGroups={friendGroups} />
            </div>
            
            <main className="flex-1 min-w-0 space-y-4 sm:space-y-6 dashboard-content">
            <ErrorBoundary>
              <WelcomeBanner user={user} />
            </ErrorBoundary>
            
            {/* Mutual Crush Notifications */}
            <ErrorBoundary>
              {mutualCrushNotifications.map((notification: any) => (
                <div key={notification.id} className="glass-effect rounded-xl p-6 sparkle-border slide-in-up teen-shadow">
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl pulse-glow">💕</div>
                    <div className="flex-1">
                      <h3 className="font-ubuntu-heading font-bold text-lg rainbow-text">OMG! You have a mutual crush! 🥰</h3>
                      <p className="text-sm text-purple-700 mt-1">{notification.message}</p>
                      <button
                        onClick={() => notification.relatedUserId && openChat(notification.relatedUserId)}
                        className="mt-3 gradient-accent-bg text-white px-6 py-2 rounded-full text-sm hover:scale-105 transition-transform duration-300 bouncy teen-shadow"
                      >
                        💌 Slide into DMs
                      </button>
                    </div>
                    <div className="text-2xl wiggle">✨</div>
                  </div>
                </div>
              ))}
            </ErrorBoundary>

            <ErrorBoundary>
              <RelationshipForm />
            </ErrorBoundary>
            
            {/* Posts Section with Navigation */}
            <ErrorBoundary>
              <div className="space-y-4">
                <div className="flex items-center justify-between glass-effect rounded-lg p-4 sparkle-border">
                  <h2 className="text-xl font-ubuntu-heading font-bold rainbow-text">📝 What's the Tea? ☕</h2>
                  <Link href="/posts">
                    <Button variant="outline" size="sm" className="flex items-center space-x-2 gradient-bg text-white border-none hover:scale-105 transition-transform duration-300 bouncy">
                      <FileText className="w-4 h-4" />
                      <span>✨ See All Drama</span>
                    </Button>
                  </Link>
                </div>
                <PostForm />
                <PostFeed maxPosts={10} relationships={relationships as any[]} />
              </div>
            </ErrorBoundary>
          </main>
          
          {/* Right sidebar - hidden on mobile and tablet */}
          <div className="hidden xl:block xl:w-80">
            <RightSidebar 
              relationships={relationships as any[]}
              friendGroups={friendGroups as any[]}
              notifications={notifications as any[]}
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
