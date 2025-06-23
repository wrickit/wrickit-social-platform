import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { 
  Play, 
  Pause, 
  Heart, 
  MessageCircle, 
  Share2, 
  Plus,
  ArrowLeft,
  Music,
  Video,
  Upload,
  Eye
} from "lucide-react";

interface Loop {
  id: number;
  authorId: number;
  videoUrl: string;
  thumbnailUrl?: string;
  description?: string;
  songTitle?: string;
  songArtist?: string;
  songUrl?: string;
  songStartTime: number;
  songDuration: number;
  likes: number;
  views: number;
  isPublic: boolean;
  createdAt: string;
  author: {
    id: number;
    name: string;
    username: string;
    profileImageUrl?: string;
  };
  isLiked?: boolean;
}

interface AuthUser {
  id: number;
  name: string;
  username: string;
  profileImageUrl?: string;
}

export default function Loops() {
  const { user } = useAuth() as { user: AuthUser | null };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Fetch loops
  const { data: loops = [], isLoading } = useQuery<Loop[]>({
    queryKey: ["/api/loops"],
    refetchInterval: 30000,
  });

  // Like loop mutation
  const likeLoopMutation = useMutation({
    mutationFn: async (loopId: number) => {
      await apiRequest("POST", `/api/loops/${loopId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loops"] });
    },
  });

  // View loop mutation
  const viewLoopMutation = useMutation({
    mutationFn: async (loopId: number) => {
      await apiRequest("POST", `/api/loops/${loopId}/view`);
    },
  });

  // Handle video play/pause
  const togglePlayPause = (index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;

    if (video.paused) {
      // Pause all other videos
      videoRefs.current.forEach((v, i) => {
        if (v && i !== index) {
          v.pause();
        }
      });
      video.play();
      setIsPlaying(true);
      setCurrentVideoIndex(index);
      
      // Record view
      if (loops[index]) {
        viewLoopMutation.mutate(loops[index].id);
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  // Handle like
  const handleLike = (loopId: number) => {
    likeLoopMutation.mutate(loopId);
  };

  // Auto-play next video when current ends
  useEffect(() => {
    const handleVideoEnd = (index: number) => {
      if (index < loops.length - 1) {
        setCurrentVideoIndex(index + 1);
        setTimeout(() => togglePlayPause(index + 1), 100);
      }
    };

    videoRefs.current.forEach((video, index) => {
      if (video) {
        video.addEventListener('ended', () => handleVideoEnd(index));
      }
    });

    return () => {
      videoRefs.current.forEach((video, index) => {
        if (video) {
          video.removeEventListener('ended', () => handleVideoEnd(index));
        }
      });
    };
  }, [loops.length]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading Loops...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <h1 className="text-xl font-bold">Loops</h1>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            Create
          </Button>
        </div>
      </div>

      {/* Video Feed */}
      <div className="pt-20">
        {loops.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[80vh] text-center">
            <Video className="w-16 h-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Loops yet</h2>
            <p className="text-gray-400 mb-4">Be the first to create a Loop!</p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Plus className="w-4 h-4 mr-1" />
              Create Loop
            </Button>
          </div>
        ) : (
          <div className="space-y-0">
            {loops.map((loop, index) => (
              <div key={loop.id} className="h-screen w-full relative">
                {/* Video */}
                <video
                  ref={(el) => (videoRefs.current[index] = el)}
                  src={loop.videoUrl}
                  className="w-full h-full object-cover"
                  loop
                  muted
                  playsInline
                  onClick={() => togglePlayPause(index)}
                />

                {/* Play/Pause Overlay */}
                {currentVideoIndex === index && !isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={() => togglePlayPause(index)}
                      className="bg-white/20 hover:bg-white/30 rounded-full w-16 h-16"
                    >
                      <Play className="w-8 h-8 text-white" />
                    </Button>
                  </div>
                )}

                {/* Right Side Actions */}
                <div className="absolute right-4 bottom-20 flex flex-col space-y-4">
                  {/* Author Avatar */}
                  <div className="flex flex-col items-center">
                    <Avatar className="w-12 h-12 border-2 border-white">
                      <AvatarImage src={loop.author.profileImageUrl} />
                      <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        {loop.author.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Like Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(loop.id)}
                    className="flex flex-col items-center space-y-1 text-white hover:bg-white/20 rounded-full w-12 h-12 p-0"
                  >
                    <Heart className={`w-6 h-6 ${loop.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                    <span className="text-xs">{loop.likes}</span>
                  </Button>

                  {/* Views */}
                  <div className="flex flex-col items-center space-y-1 text-white">
                    <Eye className="w-6 h-6" />
                    <span className="text-xs">{loop.views}</span>
                  </div>

                  {/* Share Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex flex-col items-center space-y-1 text-white hover:bg-white/20 rounded-full w-12 h-12 p-0"
                  >
                    <Share2 className="w-6 h-6" />
                  </Button>
                </div>

                {/* Bottom Info */}
                <div className="absolute bottom-4 left-4 right-20">
                  <div className="space-y-2">
                    {/* Author */}
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">@{loop.author.username}</span>
                    </div>

                    {/* Description */}
                    {loop.description && (
                      <p className="text-sm">{loop.description}</p>
                    )}

                    {/* Song Info */}
                    {loop.songTitle && (
                      <div className="flex items-center space-x-2 bg-black/50 rounded-full px-3 py-1 w-fit">
                        <Music className="w-4 h-4" />
                        <span className="text-sm">
                          {loop.songTitle} {loop.songArtist && `• ${loop.songArtist}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Loop Modal */}
      {showCreateModal && (
        <CreateLoopModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: ["/api/loops"] });
          }}
        />
      )}
    </div>
  );
}

// Create Loop Modal Component
function CreateLoopModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [songArtist, setSongArtist] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const createLoopMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/loops", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Loop created successfully!",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create loop",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) {
      toast({
        title: "Error",
        description: "Please select a video file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // Convert video to base64 for demo purposes
      const reader = new FileReader();
      reader.onloadend = () => {
        const videoUrl = reader.result as string;
        
        createLoopMutation.mutate({
          videoUrl,
          description: description.trim() || undefined,
          songTitle: songTitle.trim() || undefined,
          songArtist: songArtist.trim() || undefined,
          isPublic,
        });
      };
      reader.readAsDataURL(videoFile);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process video file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Create Loop</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Video Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video File *
              </label>
              <Input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this loop about?"
                rows={3}
              />
            </div>

            {/* Song Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center">
                <Music className="w-4 h-4 mr-1" />
                Add Song (Optional)
              </h3>
              
              <Input
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                placeholder="Song title"
              />
              
              <Input
                value={songArtist}
                onChange={(e) => setSongArtist(e.target.value)}
                placeholder="Artist name"
              />
            </div>

            {/* Privacy */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="isPublic" className="text-sm text-gray-700">
                Make this loop public
              </label>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!videoFile || isUploading || createLoopMutation.isPending}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isUploading || createLoopMutation.isPending ? (
                  <Upload className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-1" />
                )}
                Create Loop
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}