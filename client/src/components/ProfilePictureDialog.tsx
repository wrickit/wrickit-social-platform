import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, Link as LinkIcon } from "lucide-react";

interface ProfilePictureDialogProps {
  trigger: React.ReactNode;
  userId: number;
  currentImageUrl?: string;
}

export default function ProfilePictureDialog({ trigger, userId, currentImageUrl }: ProfilePictureDialogProps) {
  const [open, setOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState(currentImageUrl || "");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl || "");
  const [activeTab, setActiveTab] = useState("url");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateProfilePictureMutation = useMutation({
    mutationFn: async (profileImageUrl: string) => {
      await apiRequest("PUT", `/api/users/${userId}`, { profileImageUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setOpen(false);
      toast({
        title: "Success",
        description: "Profile picture updated successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to update profile picture",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      setUploadedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (url: string) => {
    setImageUrl(url);
    setPreviewUrl(url);
  };

  const handleSave = () => {
    if (activeTab === "url" && imageUrl) {
      updateProfilePictureMutation.mutate(imageUrl);
    } else if (activeTab === "upload" && uploadedFile) {
      // For now, we'll convert the file to base64 and use it as a data URL
      // In a real app, you'd upload to a cloud service like Cloudinary or AWS S3
      const reader = new FileReader();
      reader.onload = () => {
        updateProfilePictureMutation.mutate(reader.result as string);
      };
      reader.readAsDataURL(uploadedFile);
    } else {
      toast({
        title: "No image selected",
        description: "Please provide an image URL or upload a file",
        variant: "destructive",
      });
    }
  };

  const handleRemove = () => {
    updateProfilePictureMutation.mutate("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Camera className="w-5 h-5" />
            <span>Update Profile Picture</span>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url" className="flex items-center space-x-2">
              <LinkIcon className="w-4 h-4" />
              <span>Image URL</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Upload File</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                placeholder="https://example.com/your-image.jpg"
                value={imageUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Paste a direct link to your image (JPG, PNG, GIF)
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fileUpload">Choose Image File</Label>
              <Input
                id="fileUpload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              <p className="text-xs text-gray-500">
                Select an image from your computer (max 5MB)
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Image Preview */}
        {previewUrl && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="flex justify-center">
              <img
                src={previewUrl}
                alt="Profile preview"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
              />
            </div>
          </div>
        )}

        <div className="flex justify-between space-x-2">
          <div>
            {currentImageUrl && (
              <Button
                variant="outline"
                onClick={handleRemove}
                disabled={updateProfilePictureMutation.isPending}
                className="text-red-600 hover:text-red-700"
              >
                Remove Photo
              </Button>
            )}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={updateProfilePictureMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateProfilePictureMutation.isPending || (!imageUrl && !uploadedFile)}
            >
              {updateProfilePictureMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}