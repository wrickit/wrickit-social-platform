import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Lock, UserPlus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function DevPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Signup form state
  const [name, setName] = useState("");
  const [userClass, setUserClass] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleDevAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "callofdutywarzonewikipediaspotify") {
      setIsAuthenticated(true);
      toast({
        title: "Access granted",
        description: "Welcome to the developer panel.",
      });
    } else {
      toast({
        title: "Access denied",
        description: "Invalid password.",
        variant: "destructive",
      });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupLoading(true);

    try {
      const response = await apiRequest("POST", "/api/dev-register", {
        name,
        class: userClass,
        password: userPassword,
      });
      
      if (response.ok) {
        toast({
          title: "Account created!",
          description: "User account has been successfully created.",
        });
        setName("");
        setUserClass("");
        setUserPassword("");
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to create account",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setSignupLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white">
        <header className="fb-gradient text-white shadow-md">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-3xl font-bold">Wrickit Dev Panel</h1>
              <Button
                variant="outline"
                className="text-white border-white hover:bg-white hover:text-blue-600"
                onClick={() => setLocation("/")}
              >
                Back to Home
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-12">
          <Card className="content-box">
            <CardHeader className="text-center">
              <Lock className="w-12 h-12 text-red-500 mx-auto mb-2" />
              <CardTitle className="text-2xl font-bold text-fb-text">
                Restricted Access
              </CardTitle>
              <p className="text-fb-text-light">
                Enter the developer password to continue.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDevAuth} className="space-y-4">
                <div>
                  <Label htmlFor="password">Developer Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter developer password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full fb-blue-bg hover:bg-blue-700 text-white"
                >
                  {loading ? "Please wait..." : "Access Dev Panel"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="fb-gradient text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-3xl font-bold">Wrickit Dev Panel</h1>
            <div className="space-x-4">
              <Button
                variant="outline"
                className="text-white border-white hover:bg-white hover:text-blue-600"
                onClick={() => setLocation("/")}
              >
                Back to Home
              </Button>
              <Button
                variant="outline"
                className="text-white border-white hover:bg-white hover:text-red-600"
                onClick={() => setIsAuthenticated(false)}
              >
                Lock Panel
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-12">
        <Card className="content-box">
          <CardHeader className="text-center">
            <UserPlus className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <CardTitle className="text-2xl font-bold text-fb-text">
              Create User Account
            </CardTitle>
            <p className="text-fb-text-light">
              Manually create new user accounts for the platform.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter user's full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="class">Class</Label>
                <Input
                  id="class"
                  type="text"
                  placeholder="Enter class (e.g., 9A, 10B, 11C)"
                  value={userClass}
                  onChange={(e) => setUserClass(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="userPassword">Password</Label>
                <Input
                  id="userPassword"
                  type="password"
                  placeholder="Set password for user"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={signupLoading}
                className="w-full fb-blue-bg hover:bg-blue-700 text-white"
              >
                {signupLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}