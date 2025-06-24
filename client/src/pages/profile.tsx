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
import ProfilePictureDialog from "@/components/ProfilePictureDialog";
import TutorialButton from "@/components/TutorialButton";

import { useLocation } from "wouter";

export default function Profile() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [editedBio, setEditedBio] = useState("");
  const [editedName, setEditedName] = useState("");
  const queryClient = useQueryClient();

  // If userId is provided, fetch that user's profile, otherwise use current user
  const { data: profileUser, isLoading } = useQuery({
    queryKey: userId ? [`/api/users/${userId}`] : ["/api/user"],
    enabled: true,
  });

  const isOwnProfile = !userId || (currentUser && profileUser && (profileUser as any)?.id === currentUser.id);

  const { data: userRelationships = [] } = useQuery({
    queryKey: [`/api/users/${userId}/relationships`],
    enabled: !!userId,
  }) as any;

  const { data: currentUserRelationships = [] } = useQuery({
    queryKey: ["/api/relationships"],
    enabled: isOwnProfile && !!currentUser,
  }) as any;

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name?: string; bio?: string; profileImageUrl?: string }) => {
      await apiRequest("PUT", `/api/users/${userId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      console.error("Failed to update profile:", error);
    },
  });

  const deleteRelationshipMutation = useMutation({
    mutationFn: async (otherUserId: number) => {
      await apiRequest("DELETE", `/api/relationships/${otherUserId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/relationships"] });
    },
    onError: (error: any) => {
      console.error("Failed to remove relationship:", error);
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      name: editedName,
      bio: editedBio,
    });
  };

  const startEditing = () => {
    setEditedName((profileUser as any)?.name || "");
    setEditedBio((profileUser as any)?.bio || "");
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


  const profileUserData = profileUser as any;
  const relationshipTypes = (userRelationships as any[]).map((rel: any) => rel.type);

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
                      {profileUserData.profileImageUrl ? (
                        <img
                          src={profileUserData.profileImageUrl}
                          alt="Profile"
                          className="w-20 h-20 rounded-full profile-pic"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">
                            {profileUserData.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                      )}
                      {isOwnProfile && (
                        <ProfilePictureDialog
                          userId={profileUserData.id}
                          currentImageUrl={profileUserData.profileImageUrl}
                          trigger={
                            <Button
                              size="sm"
                              variant="secondary"
                              className="absolute -bottom-2 -right-2 w-8 h-8 p-0 rounded-full"
                            >
                              <Camera className="w-4 h-4" />
                            </Button>
                          }
                        />
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
                        <CardTitle className="text-2xl app-text">{profileUserData.name}</CardTitle>
                      )}
                      <p className="app-text-light">Class {profileUserData.class}</p>
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
                      {profileUserData.bio || "No bio available."}
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
                    {(userRelationships as any[]).filter((r: any) => ['friend', 'best_friend'].includes(r.type)).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="app-text-light">Connections:</span>
                  <span className="font-semibold app-text">{(userRelationships as any[]).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="app-text-light">Member since:</span>
                  <span className="font-semibold app-text">
                    {new Date(profileUserData.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {isOwnProfile && (
              <Card className="content-box">
                <CardHeader>
                  <CardTitle className="app-text">Help & Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <TutorialButton 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Need help? Take the interactive tutorial to learn about all features.
                  </p>
                </CardContent>
              </Card>
            )}

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

        {/* Relationships Management - Only show on own profile */}
        {isOwnProfile && (currentUserRelationships as any[]).length > 0 && (
          <div className="mt-8">
            <Card className="content-box">
              <CardHeader>
                <CardTitle className="app-text">My Connections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(currentUserRelationships as any[]).map((relationship: any) => (
                    <div key={relationship.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center space-x-3">
                        {relationship.toUser?.profileImageUrl ? (
                          <img
                            src={relationship.toUser.profileImageUrl}
                            alt="Profile"
                            className="w-10 h-10 rounded-full profile-pic"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                            <span className="text-sm font-bold text-white">
                              {relationship.toUser?.name?.charAt(0) || 'U'}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-semibold app-text">{relationship.toUser?.name}</p>
                          <div className="flex items-center space-x-2">
                            {relationship.type === 'best_friend' && <Badge className="discord-purple-bg text-xs">Best Friend</Badge>}
                            {relationship.type === 'friend' && <Badge variant="secondary" className="text-xs">Friend</Badge>}
                            {relationship.type === 'crush' && <Badge className="youtube-red-bg text-xs">Crush 💕</Badge>}
                            {relationship.type === 'acquaintance' && <Badge variant="outline" className="text-xs">Acquaintance</Badge>}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteRelationshipMutation.mutate(relationship.toUserId)}
                        disabled={deleteRelationshipMutation.isPending}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                      >
                        {deleteRelationshipMutation.isPending ? "Removing..." : "Remove"}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}