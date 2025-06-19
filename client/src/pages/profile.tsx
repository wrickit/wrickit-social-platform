import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Save, X, Camera } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

import { useLocation } from "wouter";

export default function Profile() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [editedBio, setEditedBio] = useState("");
  const [editedName, setEditedName] = useState("");
  const queryClient = useQueryClient();

  const { data: profileUser, isLoading } = useQuery({
    queryKey: ["/api/users", userId],
    enabled: !!userId,
  });

  const { data: userRelationships = [] } = useQuery({
    queryKey: ["/api/users", userId, "relationships"],
    enabled: !!userId,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name?: string; bio?: string; profileImageUrl?: string }) => {
      await apiRequest("PUT", `/api/users/${userId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      console.error("Failed to update profile:", error);
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      name: editedName,
      bio: editedBio,
    });
  };

  const startEditing = () => {
    setEditedName(profileUser?.name || "");
    setEditedBio(profileUser?.bio || "");
    setIsEditing(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center app-gray-bg">
        <div className="text-center">
          <div className="loading-spinner rounded-full h-8 w-8 border-4 border-gray-200 border-t-purple-600 mx-auto mb-4"></div>
          <p className="app-text-light">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center app-gray-bg">
        <div className="text-center">
          <h2 className="text-2xl font-bold app-text mb-4">User Not Found</h2>
          <Button onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profileUser.id;
  const relationshipTypes = userRelationships.map((rel: any) => rel.type);

  return (
    <div className="min-h-screen app-gray-bg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/dashboard")}
            className="app-text hover:discord-purple"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info Card */}
          <div className="lg:col-span-2">
            <Card className="content-box">
              <CardHeader className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      {profileUser.profileImageUrl ? (
                        <img
                          src={profileUser.profileImageUrl}
                          alt="Profile"
                          className="w-20 h-20 rounded-full profile-pic"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">
                            {profileUser.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                      )}
                      {isOwnProfile && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="absolute -bottom-2 -right-2 w-8 h-8 p-0 rounded-full"
                        >
                          <Camera className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div>
                      {isEditing ? (
                        <Input
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="text-xl font-bold mb-2"
                        />
                      ) : (
                        <CardTitle className="text-2xl app-text">{profileUser.name}</CardTitle>
                      )}
                      <p className="app-text-light">Class {profileUser.class}</p>
                      {relationshipTypes.length > 0 && !isOwnProfile && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {relationshipTypes.includes('best_friend') && <Badge className="discord-purple-bg">Best Friend</Badge>}
                          {relationshipTypes.includes('friend') && <Badge variant="secondary">Friend</Badge>}
                          {relationshipTypes.includes('crush') && <Badge className="youtube-red-bg">Crush 💕</Badge>}
                          {relationshipTypes.includes('acquaintance') && <Badge variant="outline">Acquaintance</Badge>}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </CardHeader>
              <CardContent>
                <div>
                  <Label className="text-base font-semibold app-text">Bio</Label>
                  {isEditing ? (
                    <Textarea
                      value={editedBio}
                      onChange={(e) => setEditedBio(e.target.value)}
                      placeholder="Tell others about yourself..."
                      className="mt-2 min-h-32"
                    />
                  ) : (
                    <p className="mt-2 app-text-light">
                      {profileUser.bio || "No bio available."}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats & Actions */}
          <div className="space-y-4">
            <Card className="content-box">
              <CardHeader>
                <CardTitle className="app-text">Social Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="app-text-light">Friends:</span>
                  <span className="font-semibold app-text">
                    {userRelationships.filter((r: any) => ['friend', 'best_friend'].includes(r.type)).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="app-text-light">Connections:</span>
                  <span className="font-semibold app-text">{userRelationships.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="app-text-light">Member since:</span>
                  <span className="font-semibold app-text">
                    {new Date(profileUser.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {!isOwnProfile && (
              <Card className="content-box">
                <CardHeader>
                  <CardTitle className="app-text">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full discord-purple-bg hover:bg-purple-700">
                    Send Message
                  </Button>
                  <Button variant="outline" className="w-full">
                    Add Connection
                  </Button>
                  <Button variant="outline" className="w-full youtube-red text-red-600 hover:bg-red-50">
                    Report User
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}