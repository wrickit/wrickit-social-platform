import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, MessageCircle, Mic } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";

interface RightSidebarProps {
  relationships: any[];
  friendGroups: any[];
  notifications: any[];
  user: any;
}

interface Conversation {
  fromUserId: number;
  toUserId: number;
  content: string;
  createdAt: string;
  isRead: boolean;
  voiceMessageUrl?: string;
  fromUser: {
    id: number;
    name: string;
    profileImageUrl?: string;
  };
  toUser: {
    id: number;
    name: string;
    profileImageUrl?: string;
  };
}

export default function RightSidebar({ 
  relationships, 
  friendGroups, 
  notifications, 
  user 
}: RightSidebarProps) {
  const [, setLocation] = useLocation();
  // Filter relationships by type with null checks
  const bestFriends = (relationships || []).filter(r => r.type === 'best_friend').slice(0, 3);
  const friends = (relationships || []).filter(r => r.type === 'friend').slice(0, 3);
  const acquaintances = (relationships || []).filter(r => r.type === 'acquaintance').slice(0, 2);
  const crushes = (relationships || []).filter(r => r.type === 'crush');
  
  // Find friend group notifications with null check
  const friendGroupNotifications = (notifications || []).filter(
    n => n.type === 'friend_group_created' && !n.isRead
  ).slice(0, 1);

  return (
    <aside className="w-64 flex-shrink-0 space-y-4">
      {/* Friend Group Notification */}
      {friendGroupNotifications.map((notification: any) => (
        <Card key={notification.id} className="glass-effect rounded-xl p-4 sparkle-border slide-in-up teen-shadow">
          <div className="flex items-center space-x-3 mb-3">
            <div className="text-2xl pulse-glow">🎉</div>
            <h4 className="font-bold rainbow-text">Squad Alert!</h4>
          </div>
          <p className="text-sm text-purple-700 mb-3">{notification.message}</p>
          <Button
            size="sm"
            className="gradient-secondary-bg text-white hover:scale-105 transition-transform duration-300 bouncy rounded-full w-full"
          >
            ✨ Check it Out
          </Button>
        </Card>
      ))}

      {/* My Relationships */}
      <Card className="glass-effect rounded-xl teen-shadow">
        <div className="p-4 border-b border-purple-200">
          <h4 className="font-bold rainbow-text text-lg">💖 My Circle</h4>
        </div>
        <div className="p-4 space-y-4">
          {bestFriends.length > 0 && (
            <div>
              <h5 className="text-sm font-bold text-purple-700 mb-3 flex items-center">
                <span className="mr-2">👑</span>
                Besties ({bestFriends.length})
              </h5>
              <div className="space-y-2">
                {bestFriends.map((relationship: any) => (
                  <div key={relationship.id} className="flex items-center space-x-2">
                    {relationship.toUser?.profileImageUrl ? (
                      <img
                        src={relationship.toUser.profileImageUrl}
                        alt="Best Friend"
                        className="w-6 h-6 rounded-full profile-pic"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-600">
                          {relationship.toUser?.name?.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                    <span className="text-sm text-fb-text">{relationship.toUser?.name || 'Unknown'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {crushes.length > 0 && (
            <div>
              <h5 className="text-sm font-bold text-pink-700 mb-3 flex items-center pulse-glow">
                <span className="mr-2">💕</span>
                Secret Crushes ({crushes.length})
              </h5>
              <div className="space-y-2">
                {crushes.map((relationship: any) => (
                  <div key={relationship.id} className="flex items-center space-x-2">
                    {relationship.toUser?.profileImageUrl ? (
                      <img
                        src={relationship.toUser.profileImageUrl}
                        alt="Crush"
                        className="w-6 h-6 rounded-full profile-pic"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-600">
                          {relationship.toUser?.name?.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                    <span className="text-sm text-fb-text">{relationship.toUser?.name || 'Unknown'}</span>
                    {/* Note: We'd need to check if it's mutual in a real implementation */}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Active Friend Groups */}
      {friendGroups.length > 0 && (
        <Card className="content-box rounded">
          <div className="p-3 border-b border-gray-200">
            <h4 className="font-bold text-fb-text">Friend Groups</h4>
          </div>
          <div className="p-3 space-y-3">
            {friendGroups.map((group: any) => (
              <div key={group.id} className="space-y-1">
                <h5 className="text-sm font-bold text-fb-text">{group.name}</h5>
                <p className="text-xs text-fb-text-light">
                  {group.members?.length || 0} members
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs text-blue-600 hover:underline p-0 h-auto"
                  onClick={() => setLocation(`/messages?group=${group.id}`)}
                >
                  Open Chat
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Messages */}
      <RecentMessages user={user} />
    </aside>
  );
}

function RecentMessages({ user }: { user: any }) {
  const [, setLocation] = useLocation();
  // Fetch recent conversations
  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/messages"],
    staleTime: 30000, // Keep data fresh for 30 seconds
  });

  // Get the conversation partner for each conversation
  const getConversationPartner = (conversation: Conversation) => {
    return conversation.fromUserId === user?.id ? conversation.toUser : conversation.fromUser;
  };

  // Get the 3 most recent conversations
  const recentConversations = conversations.slice(0, 3);

  return (
    <Card className="content-box rounded">
      <div className="p-3 border-b border-gray-200">
        <h4 className="font-bold text-fb-text">Recent Messages</h4>
      </div>
      <div className="p-3">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : recentConversations.length === 0 ? (
          <div className="text-center">
            <MessageCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-fb-text-light">No recent messages</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentConversations.map((conversation, index) => {
              const partner = getConversationPartner(conversation);
              const isUnread = !conversation.isRead && conversation.toUserId === user?.id;
              
              return (
                <div
                  key={`${conversation.fromUserId}-${conversation.toUserId}-${index}`}
                  className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                  onClick={() => setLocation(`/messages?user=${partner.id}`)}
                >
                  {partner.profileImageUrl ? (
                    <img
                      src={partner.profileImageUrl}
                      alt={partner.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-600">
                        {partner.name?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${isUnread ? 'font-semibold' : ''}`}>
                        {partner.name || 'Unknown User'}
                      </p>
                      {isUnread && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-fb-text-light truncate">
                        {conversation.fromUserId === user?.id ? "You: " : ""}
                        {conversation.voiceMessageUrl ? (
                          <span className="flex items-center">
                            <Mic className="w-3 h-3 mr-1" />
                            Voice message
                          </span>
                        ) : (
                          conversation.content || "..."
                        )}
                      </p>
                      <p className="text-xs text-fb-text-light ml-2 flex-shrink-0">
                        {formatDistanceToNow(new Date(conversation.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
