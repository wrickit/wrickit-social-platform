import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ThumbsUp, MessageCircle, Send, Users, Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

import { Link } from "wouter";

interface PostFeedProps {
  showAll?: boolean;
  maxPosts?: number;
  sortBy?: string;
  relationships?: any[];
}

export default function PostFeed({ showAll = false, maxPosts = 5, sortBy = "recent", relationships = [] }: PostFeedProps) {
  const queryClient = useQueryClient();
  const [showAllLocal, setShowAllLocal] = useState(showAll);
  const [showComments, setShowComments] = useState<Record<number, boolean>>({});
  const [commentTexts, setCommentTexts] = useState<Record<number, string>>({});
  
  const { data: allPosts = [], isLoading } = useQuery({
    queryKey: ["/api/posts"],
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  // Get friend and crush user IDs for filtering
  const friendIds = relationships
    .filter(r => r.type === 'friend' || r.type === 'best_friend')
    .map(r => r.toUserId);
  const crushIds = relationships
    .filter(r => r.type === 'crush')
    .map(r => r.toUserId);

  // Sort and filter posts based on sortBy value
  const getSortedPosts = () => {
    let filteredPosts = [...allPosts];

    // Apply filters first
    if (sortBy === 'friends') {
      filteredPosts = filteredPosts.filter(post => friendIds.includes(post.authorId));
    } else if (sortBy === 'crushes') {
      filteredPosts = filteredPosts.filter(post => crushIds.includes(post.authorId));
    }

    // Then apply sorting
    switch (sortBy) {
      case 'oldest':
        filteredPosts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'likes':
        filteredPosts.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
        break;
      case 'recent':
      case 'friends':
      case 'crushes':
      default:
        filteredPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return filteredPosts;
  };

  const sortedPosts = getSortedPosts();
  const posts = showAll || showAllLocal ? sortedPosts : sortedPosts.slice(0, maxPosts);

  const likePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const response = await apiRequest("POST", `/api/posts/${postId}/like`);
      return response;
    },
    onSuccess: (data, postId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: number; content: string }) => {
      await apiRequest("POST", `/api/posts/${postId}/comments`, { content });
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setCommentTexts(prev => ({ ...prev, [postId]: "" }));
    },
  });

  const toggleComments = (postId: number) => {
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleCommentSubmit = (postId: number) => {
    const content = commentTexts[postId]?.trim();
    if (!content) return;
    
    createCommentMutation.mutate({ postId, content });
  };

  // Function to get relationship status for a post author
  const getAuthorRelationship = (authorId: number) => {
    const relationship = relationships.find(r => r.toUserId === authorId);
    return relationship?.type || null;
  };

  // Function to render relationship badge
  const renderRelationshipBadge = (authorId: number) => {
    const relationshipType = getAuthorRelationship(authorId);
    
    if (!relationshipType) return null;
    
    switch (relationshipType) {
      case 'best_friend':
        return (
          <div className="flex items-center space-x-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
            <Users className="w-3 h-3" />
            <span>Best Friend</span>
          </div>
        );
      case 'friend':
        return (
          <div className="flex items-center space-x-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
            <Users className="w-3 h-3" />
            <span>Friend</span>
          </div>
        );
      case 'crush':
        return (
          <div className="flex items-center space-x-1 bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs font-medium">
            <Heart className="w-3 h-3" />
            <span>Crush</span>
          </div>
        );
      case 'acquaintance':
        return (
          <div className="flex items-center space-x-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
            <Users className="w-3 h-3" />
            <span>Acquaintance</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="content-box rounded p-4">
            <div className="animate-pulse">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    const getEmptyMessage = () => {
      switch (sortBy) {
        case 'friends':
          return "No posts from your friends yet. Add some friends to see their posts!";
        case 'crushes':
          return "No posts from your crushes yet. Maybe they're being shy! 💕";
        default:
          return "No posts yet. Be the first to share something!";
      }
    };

    return (
      <Card className="content-box rounded p-8 text-center">
        <p className="text-fb-text-light">{getEmptyMessage()}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post: any) => (
        <Card key={post.id} className="content-box rounded">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              {post.author?.profileImageUrl ? (
                <img
                  src={post.author.profileImageUrl}
                  alt="Author"
                  className="w-10 h-10 rounded-full profile-pic"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-600">
                    {post.author?.name?.charAt(0) || '?'}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-bold app-text">{post.author?.name || 'Unknown User'}</h4>
                  {renderRelationshipBadge(post.authorId)}
                </div>
                <p className="text-xs app-text-light">
                  {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : 'Unknown time'} • 
                  Shared with {post.audience === 'class' ? 'Class' : 'All Students'}
                </p>
              </div>
            </div>
            
            <p className="app-text mb-3">{post.content}</p>
            
            {/* Voice Message */}
            {post.voiceMessageUrl && (
              <div className="mb-3">
                <VoicePlayer
                  audioUrl={post.voiceMessageUrl}
                  duration={post.voiceMessageDuration}
                  size="md"
                />
              </div>
            )}

            {/* Media Content */}
            {post.mediaUrls && post.mediaUrls.length > 0 && (
              <div className="mb-3">
                {post.mediaUrls.length === 1 ? (
                  <div className="w-full">
                    {post.mediaTypes?.[0] === 'image' ? (
                      <img
                        src={post.mediaUrls[0]}
                        alt="Post media"
                        className="w-full max-h-96 object-contain rounded-lg border bg-gray-50 dark:bg-gray-800"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : post.mediaTypes?.[0] === 'embed_video' ? (
                      <iframe
                        src={post.mediaUrls[0]}
                        className="w-full h-80 rounded-lg border"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Embedded video"
                      />
                    ) : (
                      <video
                        src={post.mediaUrls[0]}
                        controls
                        className="w-full max-h-96 rounded-lg border"
                        onError={(e) => {
                          const target = e.target as HTMLVideoElement;
                          target.style.display = 'none';
                        }}
                      >
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {post.mediaUrls.map((mediaUrl: string, index: number) => (
                      <div key={index} className="aspect-square">
                        {post.mediaTypes?.[index] === 'image' ? (
                          <img
                            src={mediaUrl}
                            alt={`Post media ${index + 1}`}
                            className="w-full h-full object-contain rounded-lg border bg-gray-50 dark:bg-gray-800"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : post.mediaTypes?.[index] === 'embed_video' ? (
                          <iframe
                            src={mediaUrl}
                            className="w-full h-full rounded-lg border"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={`Embedded video ${index + 1}`}
                          />
                        ) : (
                          <video
                            src={mediaUrl}
                            controls
                            className="w-full h-full rounded-lg border"
                            onError={(e) => {
                              const target = e.target as HTMLVideoElement;
                              target.style.display = 'none';
                            }}
                          >
                            Your browser does not support the video tag.
                          </video>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div className="flex items-center space-x-4 text-sm app-text-light">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => likePostMutation.mutate(post.id)}
                disabled={likePostMutation.isPending}
                className={`p-0 h-auto ${post.isLikedByUser ? 'text-purple-600' : 'hover:text-purple-600'}`}
              >
                <ThumbsUp className={`w-4 h-4 mr-1 ${post.isLikedByUser ? 'fill-current' : ''}`} />
                <span>{post.likesCount || 0}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleComments(post.id)}
                className="hover:text-purple-600 p-0 h-auto"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                <span>{post.comments?.length || 0} Comments</span>
              </Button>
            </div>

            {/* Comments Section */}
            {showComments[post.id] && (
              <div className="mt-4 space-y-3 border-t pt-4">
                {/* Existing Comments */}
                {post.comments && post.comments.length > 0 ? (
                  <div className="space-y-2">
                    {post.comments.map((comment: any) => (
                      <div key={comment.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            {comment.author.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No comments yet. Be the first to comment!</p>
                )}

                {/* Add Comment Form */}
                <div className="flex space-x-2">
                  <Textarea
                    placeholder="Write a comment..."
                    value={commentTexts[post.id] || ""}
                    onChange={(e) => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                    className="flex-1 min-h-[80px] resize-none"
                  />
                  <Button
                    onClick={() => handleCommentSubmit(post.id)}
                    disabled={createCommentMutation.isPending || !commentTexts[post.id]?.trim()}
                    size="sm"
                    className="self-end"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      
      {!showAll && !showAllLocal && sortedPosts.length > maxPosts && (
        <div className="text-center pt-4">
          <Link href="/posts">
            <Button
              variant="outline"
              className="discord-purple border-purple-300 hover:bg-purple-50"
            >
              View More Posts ({sortedPosts.length - maxPosts} more)
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
