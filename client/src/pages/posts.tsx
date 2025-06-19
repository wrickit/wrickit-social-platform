import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PostFeed from "@/components/PostFeed";
import PostForm from "@/components/PostForm";
import { useState } from "react";

export default function PostsPage() {
  const [showPostForm, setShowPostForm] = useState(false);
  const [sortBy, setSortBy] = useState("recent");

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
  });

  const { data: relationships = [] } = useQuery({
    queryKey: ["/api/relationships"],
  });

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Posts
              </h1>
            </div>
            <Button
              onClick={() => setShowPostForm(!showPostForm)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Post
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Post Creation Form */}
          {showPostForm && (
            <Card className="content-box">
              <CardHeader>
                <CardTitle className="app-text">Create a New Post</CardTitle>
              </CardHeader>
              <CardContent>
                <PostForm />
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowPostForm(false)}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Posts Feed */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Posts
              </h2>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="likes">Most Liked</SelectItem>
                    <SelectItem value="friends">Friends' Posts</SelectItem>
                    <SelectItem value="crushes">Crush Posts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <PostFeed showAll={true} sortBy={sortBy} relationships={relationships} />
          </div>
        </div>
      </div>
    </div>
  );
}