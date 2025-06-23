import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Heart, UserCheck, UserMinus, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function Relationships() {
  const { user: currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: relationships = [], isLoading } = useQuery({
    queryKey: ["/api/relationships"],
    enabled: !!currentUser,
  }) as any;

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

  if (isLoading) {
    return (
      <div className="min-h-screen app-gray-bg">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="loading-spinner rounded-full h-8 w-8 border-4 border-gray-200 border-t-purple-600 mx-auto mb-4"></div>
            <p className="app-text-light">Loading relationships...</p>
          </div>
        </div>
      </div>
    );
  }

  // Group relationships by type
  const groupedRelationships = {
    best_friend: relationships.filter((r: any) => r.type === 'best_friend'),
    friend: relationships.filter((r: any) => r.type === 'friend'),
    crush: relationships.filter((r: any) => r.type === 'crush'),
    acquaintance: relationships.filter((r: any) => r.type === 'acquaintance'),
  };

  const getRelationshipIcon = (type: string) => {
    switch (type) {
      case 'best_friend':
        return <UserCheck className="w-4 h-4" />;
      case 'friend':
        return <Users className="w-4 h-4" />;
      case 'crush':
        return <Heart className="w-4 h-4" />;
      case 'acquaintance':
        return <UserMinus className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getRelationshipBadge = (type: string) => {
    switch (type) {
      case 'best_friend':
        return <Badge className="discord-purple-bg text-xs">Best Friend</Badge>;
      case 'friend':
        return <Badge variant="secondary" className="text-xs">Friend</Badge>;
      case 'crush':
        return <Badge className="youtube-red-bg text-xs">Crush 💕</Badge>;
      case 'acquaintance':
        return <Badge variant="outline" className="text-xs">Acquaintance</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{type}</Badge>;
    }
  };

  const getRelationshipTitle = (type: string) => {
    switch (type) {
      case 'best_friend':
        return 'Best Friends';
      case 'friend':
        return 'Friends';
      case 'crush':
        return 'Crushes';
      case 'acquaintance':
        return 'Acquaintances';
      default:
        return type;
    }
  };

  const getRelationshipColor = (type: string) => {
    switch (type) {
      case 'best_friend':
        return 'text-purple-600 dark:text-purple-400';
      case 'friend':
        return 'text-green-600 dark:text-green-400';
      case 'crush':
        return 'text-red-600 dark:text-red-400';
      case 'acquaintance':
        return 'text-gray-600 dark:text-gray-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="min-h-screen app-gray-bg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/dashboard")}
            className="app-text hover:discord-purple mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold app-text">My Relationships</h1>
          <p className="app-text-light mt-2">Manage all your connections in one place</p>
        </div>

        {relationships.length === 0 ? (
          <Card className="content-box text-center py-12">
            <CardContent>
              <Users className="w-16 h-16 mx-auto app-text-light mb-4" />
              <h3 className="text-xl font-semibold app-text mb-2">No Relationships Yet</h3>
              <p className="app-text-light mb-4">Start connecting with your classmates to build your social network!</p>
              <Button onClick={() => setLocation("/dashboard")} className="discord-purple-bg">
                Find Classmates
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedRelationships).map(([type, relationshipList]) => {
              if ((relationshipList as any[]).length === 0) return null;
              
              return (
                <Card key={type} className="content-box">
                  <CardHeader>
                    <CardTitle className={`flex items-center space-x-2 ${getRelationshipColor(type)}`}>
                      {getRelationshipIcon(type)}
                      <span>{getRelationshipTitle(type)}</span>
                      <span className="text-sm font-normal">({(relationshipList as any[]).length})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(relationshipList as any[]).map((relationship: any) => (
                        <div key={relationship.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                          <div className="flex items-center space-x-3">
                            {relationship.toUser?.profileImageUrl ? (
                              <img
                                src={relationship.toUser.profileImageUrl}
                                alt="Profile"
                                className="w-12 h-12 rounded-full profile-pic cursor-pointer"
                                onClick={() => setLocation(`/profile/${relationship.toUserId}`)}
                              />
                            ) : (
                              <div 
                                className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center cursor-pointer"
                                onClick={() => setLocation(`/profile/${relationship.toUserId}`)}
                              >
                                <span className="text-lg font-bold text-white">
                                  {relationship.toUser?.name?.charAt(0) || 'U'}
                                </span>
                              </div>
                            )}
                            <div>
                              <p 
                                className="font-semibold app-text cursor-pointer hover:text-purple-600"
                                onClick={() => setLocation(`/profile/${relationship.toUserId}`)}
                              >
                                {relationship.toUser?.name}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                {getRelationshipBadge(relationship.type)}
                                <span className="text-sm app-text-light">Class {relationship.toUser?.class}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLocation(`/profile/${relationship.toUserId}`)}
                              className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 border-blue-200"
                            >
                              View Profile
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteRelationshipMutation.mutate(relationship.toUserId)}
                              disabled={deleteRelationshipMutation.isPending}
                              className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              {deleteRelationshipMutation.isPending ? "Removing..." : "Remove"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Summary Stats */}
        {relationships.length > 0 && (
          <Card className="content-box mt-6">
            <CardHeader>
              <CardTitle className="app-text">Relationship Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {groupedRelationships.best_friend.length}
                  </div>
                  <div className="text-sm text-purple-500 dark:text-purple-300">Best Friends</div>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {groupedRelationships.friend.length}
                  </div>
                  <div className="text-sm text-green-500 dark:text-green-300">Friends</div>
                </div>
                <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {groupedRelationships.crush.length}
                  </div>
                  <div className="text-sm text-red-500 dark:text-red-300">Crushes</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                    {groupedRelationships.acquaintance.length}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-300">Acquaintances</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}