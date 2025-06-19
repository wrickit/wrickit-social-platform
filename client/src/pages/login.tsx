import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [classGrade, setClassGrade] = useState("9");
  const [division, setDivision] = useState("A");
  const [verificationCode, setVerificationCode] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login, register } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  const sendVerificationCode = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setEmailVerificationSent(true);
        toast({
          title: "Verification code sent!",
          description: "Check your email for the 6-digit verification code.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to send verification code",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailCode = async () => {
    if (!verificationCode) {
      toast({
        title: "Error",
        description: "Please enter the verification code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      if (response.ok) {
        setIsEmailVerified(true);
        toast({
          title: "Email verified!",
          description: "You can now complete your registration.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Invalid verification code",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if we're on register route
  React.useEffect(() => {
    if (location === "/register") {
      setIsLogin(false);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(admissionNumber, password);
        toast({
          title: "Welcome back!",
          description: "You've successfully logged in to Wrickit.",
        });
      } else {
        if (!isEmailVerified) {
          toast({
            title: "Email verification required",
            description: "Please verify your email before registering",
            variant: "destructive",
          });
          return;
        }

        await register({
          admissionNumber,
          username,
          password,
          firstName,
          lastName,
          email,
          class: `${classGrade}${division}`,
          division,
        });
        toast({
          title: "Welcome to Wrickit!",
          description: "Your account has been created successfully.",
        });
      }
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fb-gradient text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-3xl font-bold">Wrickit</h1>
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
              {isLogin ? "Login to Wrickit" : "Join Wrickit"}
            </CardTitle>
            <p className="text-fb-text-light">
              {isLogin
                ? "Welcome back! Sign in to connect with your classmates."
                : "Create your account to start connecting with your 9th grade classmates."}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="admissionNumber">Admission Number</Label>
                <Input
                  id="admissionNumber"
                  type="text"
                  placeholder="Enter your admission number"
                  value={admissionNumber}
                  onChange={(e) => setAdmissionNumber(e.target.value)}
                  required
                />
              </div>

              {!isLogin && (
                <>
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Choose a username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="First name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="flex gap-2">
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isEmailVerified}
                      />
                      {!emailVerificationSent && !isEmailVerified && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={sendVerificationCode}
                          disabled={loading || !email}
                          className="whitespace-nowrap"
                        >
                          Send Code
                        </Button>
                      )}
                      {isEmailVerified && (
                        <div className="flex items-center text-green-600 font-medium">
                          ✓ Verified
                        </div>
                      )}
                    </div>
                  </div>

                  {emailVerificationSent && !isEmailVerified && (
                    <div>
                      <Label htmlFor="verificationCode">Verification Code</Label>
                      <div className="flex gap-2">
                        <Input
                          id="verificationCode"
                          type="text"
                          placeholder="Enter 6-digit code"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          maxLength={6}
                          required
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={verifyEmailCode}
                          disabled={loading || !verificationCode}
                          className="whitespace-nowrap"
                        >
                          Verify
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Check your email for the verification code. It expires in 10 minutes.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="class">Class</Label>
                      <select
                        id="class"
                        value={classGrade}
                        onChange={(e) => setClassGrade(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        required
                      >
                        <option value="9">9th Grade</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="division">Division</Label>
                      <select
                        id="division"
                        value={division}
                        onChange={(e) => setDivision(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        required
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
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
                {loading ? "Please wait..." : isLogin ? "Login" : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-fb-text-light text-sm">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
              </p>
              <Button
                variant="outline"
                className="w-full text-blue-600 border-blue-600 hover:bg-blue-50"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setLocation(isLogin ? "/register" : "/login");
                }}
              >
                {isLogin ? "Create New Account" : "Login to Existing Account"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
