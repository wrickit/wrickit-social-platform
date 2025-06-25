import React, { useState, forwardRef } from "react";
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

const ProfilePictureDialog = forwardRef<HTMLDivElement, ProfilePictureDialogProps>(({ trigger, userId, currentImageUrl }, ref) => {
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

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Set maximum dimensions
        const maxSize = 400;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressed);
      };
      
      const reader = new FileReader();
      reader.onload = () => img.src = reader.result as string;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB",
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

      try {
        const compressedDataUrl = await compressImage(file);
        setUploadedFile(file);
        setPreviewUrl(compressedDataUrl);
      } catch (error) {
        toast({
          title: "Error processing image",
          description: "Failed to process the selected image",
          variant: "destructive",
        });
      }
    }
  };

  const handleUrlChange = (url: string) => {
    setImageUrl(url);
    // Only set preview URL if it looks like a valid image URL
    if (url.trim() && (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.gif') || url.includes('.webp'))) {
      setPreviewUrl(url.trim());
    } else if (!url.trim()) {
      setPreviewUrl("");
    }
  };

  const handleSave = () => {
    if (activeTab === "url" && imageUrl) {
      updateProfilePictureMutation.mutate(imageUrl);
    } else if (activeTab === "upload" && uploadedFile && previewUrl) {
      // Use the compressed image data URL
      updateProfilePictureMutation.mutate(previewUrl);
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
    <div ref={ref}>
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
                onError={(e) => {
                  // Hide preview if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
                onLoad={(e) => {
                  // Show preview if image loads successfully
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'block';
                }}
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
    </div>
  );
});

ProfilePictureDialog.displayName = "ProfilePictureDialog";

export default ProfilePictureDialog;