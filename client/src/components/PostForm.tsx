import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Image, Video, Link, X, Plus } from "lucide-react";


// Image compression utility
const compressImage = (file: File, maxWidth: number = 1200, quality: number = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = document.createElement('img');
    
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      // Only resize if image is larger than maxWidth
      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        } else {
          width = (width * maxWidth) / height;
          height = maxWidth;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Clear canvas and draw image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, width, height);
      
      resolve(canvas.toDataURL('image/jpeg', quality));
      
      // Clean up object URL
      URL.revokeObjectURL(img.src);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
      URL.revokeObjectURL(img.src);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

export default function PostForm() {
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState("class");
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [mediaTypes, setMediaTypes] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createPostMutation = useMutation({
    mutationFn: async (data: { content: string; audience: string; mediaUrls?: string[]; mediaTypes?: string[] }) => {
      await apiRequest("POST", "/api/posts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setContent("");
      setMediaFiles([]);
      setMediaTypes([]);
      setUrlInput("");
    },
    onError: (error: any) => {
      console.error("Failed to create post:", error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && mediaFiles.length === 0) {
      toast({
        title: "Missing Content",
        description: "Please add some text or media to your post.",
        variant: "destructive",
      });
      return;
    }

    createPostMutation.mutate({
      content: content.trim(),
      audience,
      mediaUrls: mediaFiles.length > 0 ? mediaFiles : undefined,
      mediaTypes: mediaTypes.length > 0 ? mediaTypes : undefined,
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File Too Large",
          description: "Please select files smaller than 10MB.",
          variant: "destructive",
        });
        continue;
      }

      try {
        if (file.type.startsWith('image/')) {
          const compressedImage = await compressImage(file);
          setMediaFiles(prev => [...prev, compressedImage]);
          setMediaTypes(prev => [...prev, 'image']);
          toast({
            title: "Image Added",
            description: "Image uploaded successfully!",
          });
        } else if (file.type.startsWith('video/')) {
          // For videos, we'll create a data URL directly
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target && e.target.result) {
              setMediaFiles(prev => [...prev, e.target!.result as string]);
              setMediaTypes(prev => [...prev, 'video']);
              toast({
                title: "Video Added",
                description: "Video uploaded successfully!",
              });
            }
          };
          reader.onerror = () => {
            toast({
              title: "Upload Error",
              description: "Failed to process video. Please try again.",
              variant: "destructive",
            });
          };
          reader.readAsDataURL(file);
        } else {
          toast({
            title: "Unsupported File",
            description: "Please select image or video files only.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('File processing failed:', error);
        toast({
          title: "Upload Error",
          description: "Failed to process file. Please try again.",
          variant: "destructive",
        });
      }
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Helper function to convert YouTube/Vimeo URLs to embed format
  const getEmbedUrl = (url: string): string => {
    // YouTube URL conversion
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Vimeo URL conversion
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    
    return url; // Return original URL if no conversion needed
  };

  const handleUrlAdd = () => {
    if (!urlInput.trim()) return;
    
    const url = urlInput.trim();
    let mediaType = 'image';
    let finalUrl = url;
    
    // Detect and convert video URLs
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      mediaType = 'embed_video';
      finalUrl = getEmbedUrl(url);
    } else if (url.includes('vimeo.com')) {
      mediaType = 'embed_video';
      finalUrl = getEmbedUrl(url);
    } else if (url.match(/\.(mp4|webm|ogg)$/i)) {
      mediaType = 'video';
    }
    
    setMediaFiles(prev => [...prev, finalUrl]);
    setMediaTypes(prev => [...prev, mediaType]);
    setUrlInput("");
    setShowUrlDialog(false);
    
    toast({
      title: "Media Added",
      description: `${mediaType === 'embed_video' ? 'Video' : mediaType === 'video' ? 'Video' : 'Image'} URL added successfully!`,
    });
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaTypes(prev => prev.filter((_, i) => i !== index));
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

          {/* Media Preview */}
          {mediaFiles.length > 0 && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {mediaFiles.map((media, index) => (
                <div key={index} className="relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMedia(index)}
                    className="absolute top-1 right-1 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                  {mediaTypes[index] === 'image' ? (
                    <img
                      src={media}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 object-contain rounded-lg bg-white dark:bg-gray-600"
                    />
                  ) : mediaTypes[index] === 'embed_video' ? (
                    <div className="w-full h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <Video className="w-8 h-8 text-blue-500" />
                      <span className="ml-2 text-sm text-blue-600 dark:text-blue-400">Embedded Video</span>
                    </div>
                  ) : (
                    <div className="w-full h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <Video className="w-8 h-8 text-gray-500" />
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Video File</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Media Upload Controls */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <Image className="w-4 h-4 mr-1" />
                Photo/Video
              </Button>

              <Dialog open={showUrlDialog} onOpenChange={setShowUrlDialog}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    <Link className="w-4 h-4 mr-1" />
                    URL
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Media URL</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Enter image or video URL..."
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUrlAdd()}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowUrlDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleUrlAdd}
                        disabled={!urlInput.trim()}
                      >
                        Add Media
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
          
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
