import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";


export default function PostForm() {
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState("class");
  
  const queryClient = useQueryClient();

  const createPostMutation = useMutation({
    mutationFn: async (data: { content: string; audience: string }) => {
      await apiRequest("POST", "/api/posts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setContent("");
    },
    onError: (error: any) => {
      console.error("Failed to create post:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast({
        title: "Empty Post",
        description: "Please write something to share",
        variant: "destructive",
      });
      return;
    }

    createPostMutation.mutate({
      content: content.trim(),
      audience,
    });
  };

  return (
    <Card className="content-box rounded">
      <CardHeader>
        <CardTitle className="app-text">Create Post</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-20 resize-none"
          />
          
          <div className="flex items-center justify-between">
            <RadioGroup
              value={audience}
              onValueChange={setAudience}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="class" id="class" />
                <Label htmlFor="class" className="text-sm app-text-light">
                  Share with Class
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="grade" id="grade" />
                <Label htmlFor="grade" className="text-sm app-text-light">
                  Share with All Students
                </Label>
              </div>
            </RadioGroup>
            
            <Button
              type="submit"
              disabled={createPostMutation.isPending}
              className="discord-purple-bg hover:bg-purple-700 text-white"
            >
              {createPostMutation.isPending ? "Posting..." : "Post"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
