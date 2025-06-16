import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function RelationshipForm() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [relationshipType, setRelationshipType] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addRelationshipMutation = useMutation({
    mutationFn: async (data: { toUserId: number; type: string }) => {
      await apiRequest("POST", "/api/relationships", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/relationships"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Relationship Added",
        description: "The relationship has been added successfully!",
      });
      setSearchTerm("");
      setSelectedUserId(null);
      setRelationshipType("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add relationship",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId || !relationshipType) {
      toast({
        title: "Missing Information",
        description: "Please select a classmate and relationship type",
        variant: "destructive",
      });
      return;
    }

    addRelationshipMutation.mutate({
      toUserId: selectedUserId,
      type: relationshipType,
    });
  };

  // For now, we'll use a simple approach where users enter admission numbers directly
  // In a real app, you'd want proper user search
  const handleAdmissionNumberSearch = () => {
    // Simple validation - just check if it's a number
    const admissionNumber = parseInt(searchTerm);
    if (!isNaN(admissionNumber)) {
      setSelectedUserId(admissionNumber);
    }
  };

  return (
    <Card className="content-box rounded">
      <CardHeader>
        <CardTitle className="app-text">Add Social Relationship</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="search" className="app-text-light">
              Student Admission Number:
            </Label>
            <div className="flex space-x-2">
              <Input
                id="search"
                type="text"
                placeholder="Enter admission number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAdmissionNumberSearch}
              >
                Find
              </Button>
            </div>
            {selectedUserId && (
              <p className="text-sm text-green-600 mt-1">
                User with admission number {searchTerm} selected
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="relationshipType" className="app-text-light">
              Relationship Type:
            </Label>
            <Select value={relationshipType} onValueChange={setRelationshipType}>
              <SelectTrigger>
                <SelectValue placeholder="Select relationship type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="best_friend">Best Friend</SelectItem>
                <SelectItem value="friend">Friend</SelectItem>
                <SelectItem value="acquaintance">Acquaintance</SelectItem>
                <SelectItem value="crush">Crush 💕</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button
            type="submit"
            disabled={addRelationshipMutation.isPending}
            className="discord-purple-bg hover:bg-purple-700 text-white"
          >
            {addRelationshipMutation.isPending ? "Adding..." : "Add Relationship"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
