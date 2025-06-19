import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Menu, User, Settings, Shield, MessageSquare, Users, LogOut, Moon, Sun, Home, Scale, Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/theme-provider";
import { useLocation } from "wouter";
import ProfileSettings from "./ProfileSettings";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface HamburgerMenuProps {
  user: any;
  relationships?: any[];
  friendGroups?: any[];
}

export default function HamburgerMenu({ user, relationships = [], friendGroups = [] }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [location, setLocation] = useLocation();

  // Calculate relationship stats
  const bestFriends = relationships.filter(r => r.type === 'best_friend').length;
  const friends = relationships.filter(r => r.type === 'friend').length;  
  const acquaintances = relationships.filter(r => r.type === 'acquaintance').length;
  const crushes = relationships.filter(r => r.type === 'crush').length;

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  const navigateTo = (path: string) => {
    setLocation(path);
    setIsOpen(false);
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="p-2">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-80 overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-left">Settings & More</SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-1 h-full overflow-y-auto pb-6">
            {/* Profile Section */}
            <div className="pb-3">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Profile</h3>
              <Dialog open={showProfileSettings} onOpenChange={setShowProfileSettings}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start p-3 h-auto">
                    <User className="w-4 h-4 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Edit Profile</div>
                      <div className="text-xs text-gray-500">Update your information</div>
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <ProfileSettings user={user} />
                </DialogContent>
              </Dialog>
            </div>

            <Separator />

            {/* Navigation Section */}
            <div className="py-3">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Navigation</h3>
              <Button
                variant="ghost"
                className="w-full justify-start p-3 h-auto"
                onClick={() => navigateTo("/")}
              >
                <Home className="w-4 h-4 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Dashboard</div>
                  <div className="text-xs text-gray-500">Home page</div>
                </div>
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start p-3 h-auto"
                onClick={() => navigateTo("/messages")}
              >
                <MessageSquare className="w-4 h-4 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Messages</div>
                  <div className="text-xs text-gray-500">Chat with classmates</div>
                </div>
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start p-3 h-auto"
                onClick={() => navigateTo("/disciplinary")}
              >
                <Shield className="w-4 h-4 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Community Standards</div>
                  <div className="text-xs text-gray-500">Report concerns</div>
                </div>
              </Button>
            </div>

            <Separator />

            {/* Preferences Section */}
            <div className="py-3">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Preferences</h3>
              <Button
                variant="ghost"
                className="w-full justify-start p-3 h-auto"
                onClick={toggleTheme}
              >
                {theme === "light" ? (
                  <Moon className="w-4 h-4 mr-3" />
                ) : (
                  <Sun className="w-4 h-4 mr-3" />
                )}
                <div className="text-left">
                  <div className="font-medium">
                    {theme === "light" ? "Dark Mode" : "Light Mode"}
                  </div>
                  <div className="text-xs text-gray-500">Change appearance</div>
                </div>
              </Button>
            </div>

            <Separator />

            {/* Account Section */}
            <div className="py-3">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Account</h3>
              <Button
                variant="ghost"
                className="w-full justify-start p-3 h-auto text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Sign Out</div>
                  <div className="text-xs opacity-70">Log out of your account</div>
                </div>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}