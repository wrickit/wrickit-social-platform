import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ThumbsUp, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

export default function PostFeed() {
  const queryClient = useQueryClient();
  const [showAll, setShowAll] = useState(false);
  
  const { data: allPosts = [], isLoading } = useQuery({
    queryKey: ["/api/posts"],
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  // Show only 5 most recent posts unless "View More" is clicked
  const posts = showAll ? allPosts : allPosts.slice(0, 5);

  const likePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      await apiRequest("POST", `/api/posts/${postId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

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
                className="hover:text-purple-600 p-0 h-auto"
              >
                <ThumbsUp className="w-4 h-4 mr-1" />
                <span>{post.likes || 0}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="hover:text-purple-600 p-0 h-auto"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                <span>Comment</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {!showAll && allPosts.length > 5 && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={() => setShowAll(true)}
            className="discord-purple border-purple-300 hover:bg-purple-50"
          >
            View More Posts ({allPosts.length - 5} more)
          </Button>
        </div>
      )}
      
      {showAll && allPosts.length > 5 && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={() => setShowAll(false)}
            className="discord-purple border-purple-300 hover:bg-purple-50"
          >
            Show Less
          </Button>
        </div>
      )}
    </div>
  );
}
