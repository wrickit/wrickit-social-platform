import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, UserPlus, BarChart3, Users, Clock, TrendingUp, Activity } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

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
  const queryClient = useQueryClient();

  const handleDevAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "callofdutywarzonewikipediaspotify") {
      setIsAuthenticated(true);
    } else {
      // Access denied - do nothing
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
        
        // Invalidate analytics queries to refresh the data
        queryClient.invalidateQueries({ queryKey: ["/api/dev/analytics/total-users"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dev/analytics/active-users-today"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dev/analytics/new-users-7days"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dev/analytics/most-active-users"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dev/analytics/most-active-users"] });
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
      <div className="min-h-screen bg-white force-light-mode">
        <header className="fb-gradient text-white shadow-md">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-2">
                <img src="/favicon-32x32.png" alt="Wrickit Logo" className="w-6 h-6 sm:w-8 sm:h-8" />
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold">Wrickit Dev Panel</h1>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-white border-white hover:bg-white hover:text-blue-600 text-xs sm:text-sm px-2 sm:px-4"
                onClick={() => setLocation("/")}
              >
                <span className="hidden sm:inline">Back to Home</span>
                <span className="sm:hidden">Home</span>
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
    <div className="min-h-screen bg-white force-light-mode">
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

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <Card className="content-box max-w-md mx-auto">
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
                      placeholder="Set password (min 6 characters)"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Password must be at least 6 characters long
                    </p>
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
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <AnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// Analytics Dashboard Component
function AnalyticsDashboard() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Fetch analytics data
  const { data: totalUsers, isLoading: loadingTotal } = useQuery({
    queryKey: ["/api/dev/analytics/total-users"],
  });

  const { data: activeToday, isLoading: loadingActive } = useQuery({
    queryKey: ["/api/dev/analytics/active-users-today"],
  });

  const { data: hourlyData, isLoading: loadingHourly } = useQuery({
    queryKey: ["/api/dev/analytics/active-users-by-hour"],
  });

  const { data: newUsersData, isLoading: loadingNewUsers } = useQuery({
    queryKey: ["/api/dev/analytics/new-users-7days"],
  });

  const { data: mostActiveUsers, isLoading: loadingMostActive } = useQuery({
    queryKey: ["/api/dev/analytics/most-active-users"],
  });

  const { data: userAnalytics, isLoading: loadingUserAnalytics } = useQuery({
    queryKey: ["/api/dev/analytics/user", selectedUserId],
    enabled: !!selectedUserId,
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (loadingTotal || loadingActive || loadingHourly || loadingNewUsers || loadingMostActive) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="loading-spinner rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers?.count || 0}</div>
            <p className="text-xs text-gray-500">All registered accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeToday?.count || 0}</div>
            <p className="text-xs text-gray-500">Users active today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hourlyData ? 
                hourlyData.reduce((max: any, current: any) => 
                  current.activeUsers > max.activeUsers ? current : max
                ).hour + ":00" 
                : "N/A"
              }
            </div>
            <p className="text-xs text-gray-500">Most active hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {newUsersData ? 
                (newUsersData.reduce((sum: number, day: any) => sum + day.count, 0) / 7).toFixed(1)
                : "0"
              }
            </div>
            <p className="text-xs text-gray-500">New users/day avg</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Users by Hour Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Active Users by Hour (Today)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="activeUsers" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* New Users Last 7 Days */}
        <Card>
          <CardHeader>
            <CardTitle>New User Registrations (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={newUsersData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Most Active Users */}
      <Card>
        <CardHeader>
          <CardTitle>Most Active Users (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mostActiveUsers?.map((user: any, index: number) => (
              <div 
                key={user.id} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => setSelectedUserId(user.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.class}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{user.totalTimeMinutes} min</p>
                  <p className="text-sm text-gray-500">{user.sessionsCount} sessions</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Individual User Analytics */}
      {selectedUserId && userAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle>
              User Analytics: {mostActiveUsers?.find((u: any) => u.id === selectedUserId)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* User Stats */}
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900">Daily Average</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {userAnalytics.avgDailyTimeMinutes.toFixed(1)} min
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-900">Session Average</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {userAnalytics.avgSessionTimeMinutes.toFixed(1)} min
                  </p>
                </div>
              </div>

              {/* Activity Breakdown Chart */}
              <div className="col-span-2">
                <h3 className="font-medium mb-4">Activity Breakdown</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={userAnalytics.activityBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ activityType, percentage }) => `${activityType} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {userAnalytics.activityBreakdown.map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Activity List */}
            <div className="mt-6">
              <h3 className="font-medium mb-4">Feature Usage Ranking</h3>
              <div className="space-y-2">
                {userAnalytics.activityBreakdown
                  .sort((a: any, b: any) => b.count - a.count)
                  .map((activity: any, index: number) => (
                  <div key={activity.activityType} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <span className="capitalize">{activity.activityType}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{activity.count} actions</span>
                      <span className="text-sm text-gray-500">({activity.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => setSelectedUserId(null)}
            >
              Close User Analytics
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}