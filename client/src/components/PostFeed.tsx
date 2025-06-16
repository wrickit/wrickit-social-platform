import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ThumbsUp, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function PostFeed() {
  const queryClient = useQueryClient();
  
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["/api/posts"],
  });

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
                <h4 className="font-bold text-fb-text">{post.author?.name || 'Unknown User'}</h4>
                <p className="text-xs text-fb-text-light">
                  {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : 'Unknown time'} • 
                  Shared with {post.audience === 'class' ? 'Class' : 'Grade'}
                </p>
              </div>
            </div>
            
            <p className="text-fb-text mb-3">{post.content}</p>
            
            <div className="flex items-center space-x-4 text-sm text-fb-text-light">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => likePostMutation.mutate(post.id)}
                disabled={likePostMutation.isPending}
                className="hover:text-blue-600 p-0 h-auto"
              >
                <ThumbsUp className="w-4 h-4 mr-1" />
                <span>{post.likes || 0}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="hover:text-blue-600 p-0 h-auto"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                <span>Comment</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
