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
      <header className="app-gradient text-white shadow-md w-full">
        <div className="w-full px-4 sm:px-6">
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
            </nav>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Desktop Search and Group Creation */}
            <div className="hidden md:flex items-center space-x-2">
              <UserSearchDialog 
                trigger={
                  <Button variant="ghost" size="sm" className="text-white hover:text-gray-200">
                    <Search className="w-4 h-4 mr-1" />
                    <span className="hidden lg:inline">Find</span>
                  </Button>
                }
              />
              <CreateChatGroupDialog
                trigger={
                  <Button variant="ghost" size="sm" className="text-white hover:text-gray-200">
                    <Users className="w-4 h-4 mr-1" />
                    <span className="hidden lg:inline">Group</span>
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
                  className="w-8 h-8 rounded-full profile-pic"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-sm font-bold">{user.name?.charAt(0) || user.firstName?.charAt(0)}</span>
                </div>
              )}
              <span className="hidden sm:inline">{user.name || user.firstName}</span>
            </div>
            
            <HamburgerMenu user={user} />
          </div>
        </div>
        </div>
      </header>
    </>
  );
}
