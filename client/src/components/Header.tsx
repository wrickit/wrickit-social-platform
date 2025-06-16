import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Home, Users, MessageCircle, Bell, LogOut } from "lucide-react";

interface HeaderProps {
  user: any;
  notifications: any[];
}

export default function Header({ user, notifications }: HeaderProps) {
  const { logout } = useAuth();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="fb-gradient text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold">Wrickit</h1>
            <nav className="hidden md:flex space-x-6">
              <a href="#" className="hover:text-gray-200 flex items-center space-x-1">
                <Home className="w-4 h-4" />
                <span>Home</span>
              </a>
              <a href="#" className="hover:text-gray-200 flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>Friends</span>
              </a>
              <a href="#" className="hover:text-gray-200 flex items-center space-x-1">
                <MessageCircle className="w-4 h-4" />
                <span>Messages</span>
              </a>
              <a href="#" className="hover:text-gray-200 flex items-center space-x-1">
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {user.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt="Profile"
                  className="w-8 h-8 rounded-full profile-pic"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-sm font-bold">{user.name.charAt(0)}</span>
                </div>
              )}
              <span>{user.name}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="hover:text-gray-200"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
