import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/theme-toggle";
import NotificationDropdown from "@/components/NotificationDropdown";
import UserSearchDialog from "@/components/UserSearchDialog";
import HamburgerMenu from "@/components/HamburgerMenu";
import CreateChatGroupDialog from "@/components/CreateChatGroupDialog";
import ProfilePictureDialog from "@/components/ProfilePictureDialog";
import ServiceBanner from "@/components/ServiceBanner";
import { TooltipWrapper } from "./TooltipWrapper";
import { Home, Users, MessageCircle, Bell, LogOut, UserPlus, Search } from "lucide-react";
import { useLocation, Link } from "wouter";

interface HeaderProps {
  user: any;
}

export default function Header({ user }: HeaderProps) {
  const { logout } = useAuth();
  const [location] = useLocation();
  const isOnDashboard = location === "/" || location === "/dashboard";

  return (
    <>
      <ServiceBanner />
      <header className="gradient-bg text-white shadow-md w-full teen-shadow">
        <div className="w-full px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2 cursor-pointer">
              <img src="/favicon-32x32.png" alt="Wrickit Logo" className="w-8 h-8 rounded-full" />
              <h1 className="text-2xl font-ubuntu-heading font-bold rainbow-text wiggle">
                Wrickit
              </h1>
            </div>
            <nav className="hidden md:flex space-x-6 font-ubuntu-body">
              {!isOnDashboard && (
                <TooltipWrapper content="Go back to your main dashboard">
                  <a href="/" className="hover:text-yellow-200 flex items-center space-x-1 transition-all duration-300 hover:scale-110">
                    <Home className="w-4 h-4" />
                    <span>🏠 Home</span>
                  </a>
                </TooltipWrapper>
              )}

              <TooltipWrapper content="Chat with your friends and classmates">
                <Link href="/messages" className="hover:text-blue-200 flex items-center space-x-1 transition-all duration-300 hover:scale-110">
                  <MessageCircle className="w-4 h-4" />
                  <span>💬 Chats</span>
                </Link>
              </TooltipWrapper>
            </nav>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Desktop Search and Group Creation */}
            <div className="hidden md:flex items-center space-x-2">
              <TooltipWrapper content="Search for classmates and friends" mobileContent="Find friends">
                <UserSearchDialog 
                  trigger={
                    <Button variant="ghost" size="sm" className="text-white hover:text-yellow-200 transition-all duration-300 hover:scale-105 bouncy">
                      <Search className="w-4 h-4 mr-1" />
                      <span className="hidden lg:inline">🔍 Find</span>
                    </Button>
                  }
                />
              </TooltipWrapper>
              <TooltipWrapper content="Create a new friend group chat" mobileContent="Make group">
                <CreateChatGroupDialog
                  trigger={
                    <Button variant="ghost" size="sm" className="text-white hover:text-green-200 transition-all duration-300 hover:scale-105">
                      <Users className="w-4 h-4 mr-1" />
                      <span className="hidden lg:inline">✨ Squad Up</span>
                    </Button>
                  }
                />
              </TooltipWrapper>
            </div>
            
            <NotificationDropdown />
            
            <div className="flex items-center space-x-2">
              <TooltipWrapper 
                content={user.profileImageUrl ? "Click to change profile picture" : "Add a profile picture"} 
                mobileContent="Profile pic"
                side="bottom"
              >
                <ProfilePictureDialog
                  userId={user.id}
                  currentImageUrl={user.profileImageUrl}
                  trigger={
                    user.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt="Profile"
                        className="w-8 h-8 rounded-full profile-pic sparkle-border hover:scale-110 transition-transform duration-300 cursor-pointer"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full glass-effect flex items-center justify-center sparkle-border hover:scale-110 transition-transform duration-300 cursor-pointer">
                        <span className="text-sm font-bold">
                          {user.name?.charAt(0) || user.firstName?.charAt(0) || "😊"}
                        </span>
                      </div>
                    )
                  }
                />
              </TooltipWrapper>
              <span className="hidden sm:inline">{user.name || user.firstName}</span>
            </div>
            
            <TooltipWrapper content="Open navigation menu" mobileContent="Menu" side="bottom">
              <HamburgerMenu user={user} relationships={user.relationships || []} friendGroups={user.friendGroups || []} />
            </TooltipWrapper>
          </div>
        </div>
        </div>
      </header>
    </>
  );
}
