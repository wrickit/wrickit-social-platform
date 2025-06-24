import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

import { useLocation } from "wouter";
import { Mail, AlertCircle } from "lucide-react";

export default function Login() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(name, password);
      setLocation("/");
    } catch (error: any) {
      console.error("Login failed:", error);
      setError("Invalid username or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: 'name' | 'password', value: string) => {
    if (error) setError(""); // Clear error when user starts typing
    if (field === 'name') setName(value);
    if (field === 'password') setPassword(value);
  };

  return (
    <div className="min-h-screen bg-white force-light-mode">
      {/* Header */}
      <header className="fb-gradient text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <img src="/favicon-32x32.png" alt="Wrickit Logo" className="w-8 h-8" />
              <h1 className="text-3xl font-bold">Wrickit</h1>
            </div>
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

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-12">
        <Card className="content-box">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-fb-text">
              Login to Wrickit
            </CardTitle>
            <p className="text-fb-text-light">
              Welcome back! Sign in to connect with your classmates.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  className={error ? "border-red-300 focus:border-red-500" : ""}
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  className={error ? "border-red-300 focus:border-red-500" : ""}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full fb-blue-bg hover:bg-blue-700 text-white"
              >
                {loading ? "Please wait..." : "Login"}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-800 mb-2">Need an Account?</h4>
                  <p className="text-blue-700 text-sm mb-3">
                    We no longer allow self-registration. To create an account, please email a clear photo of your student ID card for verification.
                  </p>
                  <div className="flex items-center gap-2 bg-white rounded-md p-2 border">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600 text-sm font-mono">
                      [Contact admin for email address]
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}