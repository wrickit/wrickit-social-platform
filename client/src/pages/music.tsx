import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import RightSidebar from "@/components/RightSidebar";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music as MusicIcon, ExternalLink, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Music() {
  const { user } = useAuth();

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
  });

  const { data: relationships = [] } = useQuery<any[]>({
    queryKey: ["/api/relationships"],
  });

  const { data: friendGroups = [] } = useQuery<any[]>({
    queryKey: ["/api/friend-groups"],
  });

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen gradient-secondary-bg">
      <Header 
        user={{...user, relationships, friendGroups}} 
        notifications={notifications} 
      />
      
      <div className="w-full">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Mobile: Hide sidebar by default, show with toggle */}
            <div className="hidden lg:block lg:w-64 xl:w-72">
              <Sidebar user={user} relationships={relationships} friendGroups={friendGroups} />
            </div>
            
            <main className="flex-1 min-w-0">
              {/* Page Header */}
              <div className="glass-effect rounded-xl p-6 sparkle-border slide-in-up teen-shadow mb-6">
                <div className="flex items-center space-x-4">
                  <div className="text-4xl pulse-glow">🎵</div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold rainbow-text">Music Discovery</h1>
                    <p className="text-purple-700 mt-1">See what your friends are listening to on Spotify</p>
                  </div>
                  <MusicIcon className="w-8 h-8 text-purple-600" />
                </div>
              </div>

              {/* Info Card */}
              <Card className="mb-6 glass-effect sparkle-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-600" />
                    About Spotivity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">
                    Spotivity lets you see what your Spotify friends are listening to in real-time. 
                    Connect your Spotify account to discover new music and see what's trending among your friends.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('https://spotivity.me', '_blank')}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open in New Tab
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Embedded Spotivity */}
              <Card className="glass-effect sparkle-border">
                <CardContent className="p-0">
                  <div className="relative w-full" style={{ height: '80vh' }}>
                    <iframe
                      src="https://spotivity.me"
                      className="w-full h-full rounded-lg"
                      frameBorder="0"
                      allowFullScreen
                      title="Spotivity - See what your friends are listening to"
                      style={{ 
                        minHeight: '600px',
                        backgroundColor: '#ffffff'
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </main>

            {/* Right sidebar - hidden on mobile */}
            <div className="hidden xl:block xl:w-72">
              <RightSidebar relationships={relationships} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}