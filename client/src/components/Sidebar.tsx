import { Card } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { Home, Heart, Users, MessageCircle, Scale, Play } from "lucide-react";

interface SidebarProps {
  user: any;
  relationships: any[];
  friendGroups: any[];
}

export default function Sidebar({ user, relationships, friendGroups }: SidebarProps) {
  const [location] = useLocation();
  
  // Calculate relationship stats
  const bestFriends = relationships.filter(r => r.type === 'best_friend').length;
  const friends = relationships.filter(r => r.type === 'friend').length;  
  const acquaintances = relationships.filter(r => r.type === 'acquaintance').length;

  return (
    <aside className="w-64 flex-shrink-0">
      {/* User Profile Box */}
      <Card className="content-box rounded p-4 mb-4">
        <div className="flex items-center space-x-3">
          {user.profileImageUrl ? (
            <img
              src={user.profileImageUrl}
              alt="Profile"
              className="w-12 h-12 rounded-full profile-pic"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-lg font-bold text-gray-600">{user.name.charAt(0)}</span>
            </div>
          )}
          <div>
            <h3 className="font-bold text-fb-text">{user.name}</h3>
            <p className="text-sm text-fb-text-light">Class {user.class}</p>
          </div>
        </div>
      </Card>

      {/* Navigation Menu */}
      <Card className="content-box rounded mb-4">
        <nav className="p-2">
          <Link href="/">
            <div className={`flex items-center space-x-2 px-3 py-2 rounded cursor-pointer transition-colors ${
              location === "/" ? "discord-purple-bg text-white" : "hover:fb-gray-bg text-fb-text"
            }`}>
              <Home className="w-4 h-4 text-blue-600" />
              <span>Dashboard</span>
            </div>
          </Link>
          
          <Link href="/messages">
            <div className={`flex items-center space-x-2 px-3 py-2 rounded cursor-pointer transition-colors ${
              location === "/messages" ? "discord-purple-bg text-white" : "hover:fb-gray-bg text-fb-text"
            }`}>
              <MessageCircle className="w-4 h-4 text-green-500" />
              <span>Messages</span>
            </div>
          </Link>
          
          <Link href="/loops">
            <div className={`flex items-center space-x-2 px-3 py-2 rounded cursor-pointer transition-colors ${
              location === "/loops" ? "discord-purple-bg text-white" : "hover:fb-gray-bg text-fb-text"
            }`}>
              <Play className="w-4 h-4 text-purple-500" />
              <span>Loops</span>
            </div>
          </Link>

          <Link href="/disciplinary">
            <div className={`flex items-center space-x-2 px-3 py-2 rounded cursor-pointer transition-colors ${
              location === "/disciplinary" ? "discord-purple-bg text-white" : "hover:fb-gray-bg text-fb-text"
            }`}>
              <Scale className="w-4 h-4 text-orange-500" />
              <span>Disciplinary</span>
            </div>
          </Link>
          
          <Link href="/relationships">
            <div className={`flex items-center space-x-2 px-3 py-2 rounded cursor-pointer transition-colors ${
              location === "/relationships" ? "discord-purple-bg text-white" : "hover:fb-gray-bg text-fb-text"
            }`}>
              <Heart className="w-4 h-4 text-red-500" />
              <span>My Relationships</span>
            </div>
          </Link>
          <div className="flex items-center space-x-2 px-3 py-2 rounded text-fb-text">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Friend Groups</span>
          </div>

        </nav>
      </Card>

      {/* Quick Stats */}
      <Card className="content-box rounded p-4">
        <h4 className="font-bold text-fb-text mb-2">Quick Stats</h4>
        <div className="space-y-2 text-sm text-fb-text-light">
          <div className="flex justify-between">
            <span>Best Friends:</span>
            <span>{bestFriends}</span>
          </div>
          <div className="flex justify-between">
            <span>Friends:</span>
            <span>{friends}</span>
          </div>
          <div className="flex justify-between">
            <span>Acquaintances:</span>
            <span>{acquaintances}</span>
          </div>
          <div className="flex justify-between">
            <span>Friend Groups:</span>
            <span>{friendGroups.length}</span>
          </div>
        </div>
      </Card>
    </aside>
  );
}
