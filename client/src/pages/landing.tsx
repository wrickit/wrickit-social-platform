import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Heart, Users, MessageCircle, Bell } from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="app-gradient text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-3xl font-bold">Wrickit</h1>
            <div className="space-x-4">
              <Button
                variant="outline"
                className="text-white border-white hover:bg-white hover:text-purple-600"
                onClick={() => setLocation("/login")}
              >
                Login
              </Button>
              <Button
                className="bg-white text-purple-600 hover:bg-gray-100"
                onClick={() => setLocation("/register")}
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold app-text mb-4">
            Connect with Your Classmates
          </h2>
          <p className="text-xl app-text-light mb-8">
            Build friendships, discover mutual crushes, and stay connected with your class!
          </p>
          <Button
            size="lg"
            className="discord-purple-bg hover:bg-purple-700 text-white"
            onClick={() => setLocation("/register")}
          >
            Join Wrickit Today
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="content-box">
            <CardHeader className="text-center">
              <Heart className="w-12 h-12 text-red-500 mx-auto mb-2" />
              <CardTitle className="text-fb-text">Find Your Crush</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-fb-text-light text-center">
                Discover mutual crushes and get notified when someone likes you back!
              </p>
            </CardContent>
          </Card>

          <Card className="content-box">
            <CardHeader className="text-center">
              <Users className="w-12 h-12 text-blue-500 mx-auto mb-2" />
              <CardTitle className="text-fb-text">Friend Groups</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-fb-text-light text-center">
                Automatically form friend groups when you and your friends mark each other as best friends.
              </p>
            </CardContent>
          </Card>

          <Card className="content-box">
            <CardHeader className="text-center">
              <MessageCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <CardTitle className="text-fb-text">Chat & Connect</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-fb-text-light text-center">
                Message your friends and chat in friend groups to stay connected.
              </p>
            </CardContent>
          </Card>

          <Card className="content-box">
            <CardHeader className="text-center">
              <Bell className="w-12 h-12 text-purple-500 mx-auto mb-2" />
              <CardTitle className="text-fb-text">Share Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-fb-text-light text-center">
                Share updates with your class or entire grade and stay in the loop.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How it Works */}
        <section className="text-center">
          <h3 className="text-2xl font-bold text-fb-text mb-8">How Wrickit Works</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="font-semibold text-fb-text mb-2">Sign Up</h4>
              <p className="text-fb-text-light">
                Use your admission number to create your account and join your grade.
              </p>
            </div>
            <div>
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h4 className="font-semibold text-fb-text mb-2">Build Relationships</h4>
              <p className="text-fb-text-light">
                Add your classmates as friends, best friends, acquaintances, or crushes.
              </p>
            </div>
            <div>
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h4 className="font-semibold text-fb-text mb-2">Connect & Share</h4>
              <p className="text-fb-text-light">
                Chat with friends, share posts, and get notified about mutual connections.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-fb-text-light">
            © 2024 Wrickit - Connecting 9th Graders, One Friendship at a Time
          </p>
        </div>
      </footer>
    </div>
  );
}
