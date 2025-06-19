import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ThumbsUp, MessageCircle, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface PostFeedProps {
  showAll?: boolean;
  maxPosts?: number;
}

export default function PostFeed({ showAll = false, maxPosts = 5 }: PostFeedProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showAllLocal, setShowAllLocal] = useState(showAll);
  const [showComments, setShowComments] = useState<Record<number, boolean>>({});
  const [commentTexts, setCommentTexts] = useState<Record<number, string>>({});
  
  const { data: allPosts = [], isLoading } = useQuery({
    queryKey: ["/api/posts"],
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  // Show posts based on props and local state
  const posts = showAll || showAllLocal ? allPosts : allPosts.slice(0, maxPosts);

  const likePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const response = await apiRequest("POST", `/api/posts/${postId}/like`);
      return response;
    },
    onSuccess: (data, postId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: data.isLiked ? "Post Liked" : "Post Unliked",
        description: data.isLiked ? "You liked this post!" : "You unliked this post!",
      });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: number; content: string }) => {
      await apiRequest("POST", `/api/posts/${postId}/comments`, { content });
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setCommentTexts(prev => ({ ...prev, [postId]: "" }));
      toast({
        title: "Comment Added",
        description: "Your comment has been posted!",
      });
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
    return (
      <Card className="content-box rounded p-8 text-center">
        <p className="text-fb-text-light">No posts yet. Be the first to share something!</p>
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
              <div>
                <h4 className="font-bold app-text">{post.author?.name || 'Unknown User'}</h4>
                <p className="text-xs app-text-light">
                  {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : 'Unknown time'} • 
                  Shared with {post.audience === 'class' ? 'Class' : 'All Students'}
                </p>
              </div>
            </div>
            
            <p className="app-text mb-3">{post.content}</p>
            
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
      
      {!showAll && !showAllLocal && allPosts.length > maxPosts && (
        <div className="text-center pt-4">
          <Link href="/posts">
            <Button
              variant="outline"
              className="discord-purple border-purple-300 hover:bg-purple-50"
            >
              View More Posts ({allPosts.length - maxPosts} more)
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
