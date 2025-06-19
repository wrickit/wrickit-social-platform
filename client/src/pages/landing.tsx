import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Heart, Users, MessageCircle, Bell, Mail, IdCard, CheckCircle } from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-white force-light-mode">
      {/* Header */}
      <header className="app-gradient text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Wrickit</h1>
            <div className="flex space-x-2 sm:space-x-4">
              <Button
                size="sm"
                className="youtube-red-bg hover:youtube-red-dark text-white font-bold px-3 py-2 text-sm sm:px-6 sm:py-3 sm:text-base lg:px-8 lg:text-lg shadow-lg"
                onClick={() => setLocation("/login")}
              >
                <span className="hidden sm:inline">Login Now</span>
                <span className="sm:hidden">Login</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-white text-purple-600 border-2 border-white hover:bg-purple-50 font-bold px-3 py-2 text-sm sm:px-6 sm:py-3 sm:text-base lg:px-8 lg:text-lg"
                onClick={() => setLocation("/dev")}
              >
                <span className="hidden sm:inline">Dev Page</span>
                <span className="sm:hidden">Dev</span>
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
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              New Account Creation Process
            </h3>
            <p className="text-yellow-700 mb-4">
              To maintain security and prevent fake accounts, we now require ID verification. 
              Please email a clear photo of your student ID card to get started.
            </p>
            <div className="bg-white rounded-md p-3 border">
              <p className="text-gray-600 text-sm font-mono">
                Email: [Contact admin for email address]
              </p>
            </div>
          </div>
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
          <h3 className="text-2xl font-bold text-fb-text mb-8">How to Join Wrickit</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-semibold text-fb-text mb-2">Email Your ID</h4>
              <p className="text-fb-text-light">
                Send a clear photo of your student ID card to our verification email address.
              </p>
            </div>
            <div>
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <IdCard className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-semibold text-fb-text mb-2">ID Verification</h4>
              <p className="text-fb-text-light">
                Our team will review your ID card to verify your identity and grade level.
              </p>
            </div>
            <div>
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-semibold text-fb-text mb-2">Account Created</h4>
              <p className="text-fb-text-light">
                Once verified, we'll create your account and send you login credentials.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-fb-text-light">
            © 2024 Wrickit - Connecting Students, One Friendship at a Time
          </p>
        </div>
      </footer>
    </div>
  );
}
