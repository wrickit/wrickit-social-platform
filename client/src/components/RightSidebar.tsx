import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

interface RightSidebarProps {
  relationships: any[];
  friendGroups: any[];
  notifications: any[];
  onOpenChat: (userId: number) => void;
}

export default function RightSidebar({ 
  relationships, 
  friendGroups, 
  notifications, 
  onOpenChat 
}: RightSidebarProps) {
  // Filter relationships by type
  const bestFriends = relationships.filter(r => r.type === 'best_friend').slice(0, 3);
  const friends = relationships.filter(r => r.type === 'friend').slice(0, 3);
  const acquaintances = relationships.filter(r => r.type === 'acquaintance').slice(0, 2);
  const crushes = relationships.filter(r => r.type === 'crush');
  
  // Find friend group notifications
  const friendGroupNotifications = notifications.filter(
    n => n.type === 'friend_group_created' && !n.isRead
  ).slice(0, 1);

  return (
    <aside className="w-64 flex-shrink-0 space-y-4">
      {/* Friend Group Notification */}
      {friendGroupNotifications.map((notification: any) => (
        <Card key={notification.id} className="content-box rounded p-4 bg-green-50 border-green-200">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-4 h-4 text-green-500" />
            <h4 className="font-bold text-fb-text">New Friend Group!</h4>
          </div>
          <p className="text-sm text-fb-text-light mb-2">{notification.message}</p>
          <Button
            size="sm"
            className="bg-green-500 text-white hover:bg-green-600"
          >
            View Group
          </Button>
        </Card>
      ))}

      {/* My Relationships */}
      <Card className="content-box rounded">
        <div className="p-3 border-b border-gray-200">
          <h4 className="font-bold text-fb-text">My Relationships</h4>
        </div>
        <div className="p-3 space-y-3">
          {bestFriends.length > 0 && (
            <div>
              <h5 className="text-sm font-bold text-fb-text mb-2">Best Friends ({bestFriends.length})</h5>
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
              <h5 className="text-sm font-bold text-fb-text mb-2">Crushes 💕</h5>
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
                >
                  Open Chat
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Messages - Placeholder for now */}
      <Card className="content-box rounded">
        <div className="p-3 border-b border-gray-200">
          <h4 className="font-bold text-fb-text">Recent Messages</h4>
        </div>
        <div className="p-3">
          <p className="text-sm text-fb-text-light text-center">
            No recent messages
          </p>
        </div>
      </Card>
    </aside>
  );
}
