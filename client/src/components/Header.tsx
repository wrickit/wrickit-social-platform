import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/theme-toggle";
import NotificationDropdown from "@/components/NotificationDropdown";
import UserSearchDialog from "@/components/UserSearchDialog";
import HamburgerMenu from "@/components/HamburgerMenu";
import CreateChatGroupDialog from "@/components/CreateChatGroupDialog";
import ServiceBanner from "@/components/ServiceBanner";
import { Home, Users, MessageCircle, Bell, LogOut, UserPlus, Search } from "lucide-react";

interface HeaderProps {
  user: any;
  notifications: any[];
}

export default function Header({ user, notifications }: HeaderProps) {
  const { logout } = useAuth();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      <ServiceBanner />
      <header className="gradient-bg text-white shadow-md w-full teen-shadow">
        <div className="w-full px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold rainbow-text wiggle cursor-pointer">
              ✨ Wrickit 🌟
            </h1>
            <nav className="hidden md:flex space-x-6">
              <a href="#" className="hover:text-yellow-200 flex items-center space-x-1 transition-all duration-300 hover:scale-110">
                <Home className="w-4 h-4" />
                <span>🏠 Home</span>
              </a>
              <a href="#" className="hover:text-pink-200 flex items-center space-x-1 transition-all duration-300 hover:scale-110">
                <Users className="w-4 h-4" />
                <span>👥 Squad</span>
              </a>
              <a href="#" className="hover:text-blue-200 flex items-center space-x-1 transition-all duration-300 hover:scale-110">
                <MessageCircle className="w-4 h-4" />
                <span>💬 Chats</span>
              </a>
            </nav>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Desktop Search and Group Creation */}
            <div className="hidden md:flex items-center space-x-2">
              <UserSearchDialog 
                trigger={
                  <Button variant="ghost" size="sm" className="text-white hover:text-yellow-200 transition-all duration-300 hover:scale-105 bouncy">
                    <Search className="w-4 h-4 mr-1" />
                    <span className="hidden lg:inline">🔍 Find</span>
                  </Button>
                }
              />
              <CreateChatGroupDialog
                trigger={
                  <Button variant="ghost" size="sm" className="text-white hover:text-green-200 transition-all duration-300 hover:scale-105">
                    <Users className="w-4 h-4 mr-1" />
                    <span className="hidden lg:inline">✨ Squad Up</span>
                  </Button>
                }
              />
            </div>
            
            <NotificationDropdown />
            
            <div className="flex items-center space-x-2">
              {user.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt="Profile"
                  className="w-8 h-8 rounded-full profile-pic sparkle-border hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-8 h-8 rounded-full glass-effect flex items-center justify-center sparkle-border hover:scale-110 transition-transform duration-300 cursor-pointer" title="Click to add a profile pic! 📸">
                  <span className="text-sm font-bold">
                    {user.name?.charAt(0) || user.firstName?.charAt(0) || "😊"}
                  </span>
                </div>
              )}
              <span className="hidden sm:inline">{user.name || user.firstName}</span>
            </div>
            
            <HamburgerMenu user={user} relationships={user.relationships || []} friendGroups={user.friendGroups || []} />
          </div>
        </div>
        </div>
      </header>
    </>
  );
}
