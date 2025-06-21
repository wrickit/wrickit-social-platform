import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";


export default function PostForm() {
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState("class");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      return;
    }

    createPostMutation.mutate({
      content: content.trim(),
      audience,
    });
  };

  return (
    <Card className="glass-effect rounded-xl teen-shadow sparkle-border">
      <CardHeader>
        <CardTitle className="rainbow-text font-bold text-lg">✨ Spill the Tea! ☕</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="What's the tea today? 👀✨"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-20 resize-none border-purple-200 focus:border-purple-400 rounded-lg"
          />
          
          <div className="flex items-center justify-between">
            <RadioGroup
              value={audience}
              onValueChange={setAudience}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="class" id="class" />
                <Label htmlFor="class" className="text-sm text-purple-700 font-medium">
                  🏫 My Class Only
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="grade" id="grade" />
                <Label htmlFor="grade" className="text-sm text-purple-700 font-medium">
                  🌍 Everyone at School
                </Label>
              </div>
            </RadioGroup>
            
            <Button
              type="submit"
              disabled={createPostMutation.isPending}
              className="gradient-bg text-white hover:scale-105 transition-transform duration-300 bouncy rounded-full px-8 teen-shadow"
            >
              {createPostMutation.isPending ? "✨ Posting..." : "🚀 Share the Vibes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
