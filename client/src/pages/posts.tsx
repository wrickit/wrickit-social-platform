import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import PostFeed from "@/components/PostFeed";
import PostForm from "@/components/PostForm";
import PostSearch from "@/components/PostSearch";
import ContentRenderer from "@/components/ContentRenderer";
import { useState } from "react";

export default function PostsPage() {
  const [showPostForm, setShowPostForm] = useState(false);
  const [sortBy, setSortBy] = useState("recent");
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
  });

  const { data: relationships = [] } = useQuery({
    queryKey: ["/api/relationships"],
  });

  const handleSearch = async (query: string, type: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(`/api/search/posts?query=${encodeURIComponent(query)}&type=${type}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchResults(null);
  };

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

          {/* Search */}
          <Card className="content-box">
            <CardContent className="pt-6">
              <PostSearch onSearch={handleSearch} isLoading={isSearching} />
              {searchResults && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Search Results ({Array.isArray(searchResults) ? searchResults.length : 0} posts)
                    </span>
                    <Button variant="outline" size="sm" onClick={clearSearch}>
                      Clear Search
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Posts Feed */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {searchResults ? 'Search Results' : 'Posts'}
              </h2>
              {!searchResults && (
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
              )}
            </div>
            {searchResults ? (
              <div className="space-y-4">
                {Array.isArray(searchResults) && searchResults.length > 0 ? (
                  searchResults.map((post: any) => (
                    <Card key={post.id} className="content-box">
                      <CardContent className="pt-6">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                            <span className="text-purple-600 dark:text-purple-400 font-medium text-sm">
                              {post.author?.name?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {post.author?.name || 'Unknown User'}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                @{post.author?.username || 'unknown'}
                              </span>
                            </div>
                            <ContentRenderer content={post.content} className="app-text mb-3" />
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                              <span>{post.likesCount || 0} likes</span>
                              <span>{post.comments?.length || 0} comments</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No posts found matching your search.
                  </div>
                )}
              </div>
            ) : (
              <PostFeed showAll={true} sortBy={sortBy} relationships={relationships as any[]} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}