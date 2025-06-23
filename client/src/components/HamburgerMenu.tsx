import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Menu, User, Settings, Shield, MessageSquare, Users, LogOut, Moon, Sun, Home, Scale, Heart, Play, Monitor } from "lucide-react";
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
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
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
                onClick={() => navigateTo("/loops")}
              >
                <Play className="w-4 h-4 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Loops</div>
                  <div className="text-xs text-gray-500">Short videos</div>
                </div>
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start p-3 h-auto"
                onClick={() => navigateTo("/relationships")}
              >
                <Heart className="w-4 h-4 mr-3" />
                <div className="text-left">
                  <div className="font-medium">My Relationships</div>
                  <div className="text-xs text-gray-500">Manage connections</div>
                </div>
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start p-3 h-auto"
                onClick={() => navigateTo("/disciplinary")}
              >
                <Scale className="w-4 h-4 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Disciplinary</div>
                  <div className="text-xs text-gray-500">Report issues</div>
                </div>
              </Button>
            </div>

            <Separator />

            {/* Quick Stats Section */}
            <div className="py-3">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
                  <div className="font-semibold text-blue-600 dark:text-blue-400">{bestFriends}</div>
                  <div className="text-xs text-blue-500 dark:text-blue-300">Best Friends</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
                  <div className="font-semibold text-green-600 dark:text-green-400">{friends}</div>
                  <div className="text-xs text-green-500 dark:text-green-300">Friends</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-2 text-center">
                  <div className="font-semibold text-gray-600 dark:text-gray-400">{acquaintances}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-300">Acquaintances</div>
                </div>
                <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-2 text-center">
                  <div className="font-semibold text-pink-600 dark:text-pink-400">{crushes}</div>
                  <div className="text-xs text-pink-500 dark:text-pink-300">Crushes</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2 text-center col-span-2">
                  <div className="font-semibold text-purple-600 dark:text-purple-400">{friendGroups.length}</div>
                  <div className="text-xs text-purple-500 dark:text-purple-300">Friend Groups</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* My Relationships Section */}
            {relationships.length > 0 && (
              <div className="py-3">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">My Relationships</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {/* Best Friends */}
                  {relationships.filter(r => r.type === 'best_friend').length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold text-blue-600 mb-1 flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        Best Friends
                      </h5>
                      <div className="space-y-1 ml-4">
                        {relationships.filter(r => r.type === 'best_friend').slice(0, 3).map((relationship: any) => (
                          <div key={relationship.id} className="flex items-center space-x-2 text-sm">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-xs font-bold text-blue-600">
                                {relationship.toUser?.name?.charAt(0) || '?'}
                              </span>
                            </div>
                            <span className="text-gray-700 dark:text-gray-300">{relationship.toUser?.name || 'Unknown'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Friends */}
                  {relationships.filter(r => r.type === 'friend').length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold text-green-600 mb-1 flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        Friends
                      </h5>
                      <div className="space-y-1 ml-4">
                        {relationships.filter(r => r.type === 'friend').slice(0, 3).map((relationship: any) => (
                          <div key={relationship.id} className="flex items-center space-x-2 text-sm">
                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                              <span className="text-xs font-bold text-green-600">
                                {relationship.toUser?.name?.charAt(0) || '?'}
                              </span>
                            </div>
                            <span className="text-gray-700 dark:text-gray-300">{relationship.toUser?.name || 'Unknown'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Crushes */}
                  {relationships.filter(r => r.type === 'crush').length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold text-pink-600 mb-1 flex items-center">
                        <Heart className="w-3 h-3 mr-1" />
                        Crushes
                      </h5>
                      <div className="space-y-1 ml-4">
                        {relationships.filter(r => r.type === 'crush').slice(0, 2).map((relationship: any) => (
                          <div key={relationship.id} className="flex items-center space-x-2 text-sm">
                            <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center">
                              <span className="text-xs font-bold text-pink-600">
                                {relationship.toUser?.name?.charAt(0) || '?'}
                              </span>
                            </div>
                            <span className="text-gray-700 dark:text-gray-300">{relationship.toUser?.name || 'Unknown'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Acquaintances */}
                  {relationships.filter(r => r.type === 'acquaintance').length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold text-gray-600 mb-1 flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        Acquaintances
                      </h5>
                      <div className="space-y-1 ml-4">
                        {relationships.filter(r => r.type === 'acquaintance').slice(0, 2).map((relationship: any) => (
                          <div key={relationship.id} className="flex items-center space-x-2 text-sm">
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                              <span className="text-xs font-bold text-gray-600">
                                {relationship.toUser?.name?.charAt(0) || '?'}
                              </span>
                            </div>
                            <span className="text-gray-700 dark:text-gray-300">{relationship.toUser?.name || 'Unknown'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Separator />

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
                ) : theme === "dark" ? (
                  <Monitor className="w-4 h-4 mr-3" />
                ) : (
                  <Sun className="w-4 h-4 mr-3" />
                )}
                <div className="text-left">
                  <div className="font-medium">
                    {theme === "light" ? "Switch to Dark" : theme === "dark" ? "Switch to System" : "Switch to Light"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {theme === "light" ? "Use dark theme" : theme === "dark" ? "Follow system setting" : "Use light theme"}
                  </div>
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