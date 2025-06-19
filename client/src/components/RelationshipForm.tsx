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

  // Search for user by name and get their actual user ID
  const handleNameSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Search Error",
        description: "Please enter a name to search",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchTerm.trim())}`);
      if (response.ok) {
        const users = await response.json();
        if (users && users.length > 0) {
          const user = users[0]; // Take the first match
          setSelectedUserId(user.id);
          toast({
            title: "User Found",
            description: `Found ${user.name} from Class ${user.class}`,
          });
        } else {
          toast({
            title: "User Not Found",
            description: "No user found with that name",
            variant: "destructive",
          });
          setSelectedUserId(null);
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Search Error",
          description: errorData.message || "Failed to search for user",
          variant: "destructive",
        });
        setSelectedUserId(null);
      }
    } catch (error) {
      toast({
        title: "Search Error",
        description: "Failed to search for user",
        variant: "destructive",
      });
      setSelectedUserId(null);
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
              Student Name:
            </Label>
            <div className="flex space-x-2">
              <Input
                id="search"
                type="text"
                placeholder="Enter student name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleNameSearch}
              >
                Find
              </Button>
            </div>
            {selectedUserId && (
              <p className="text-sm text-green-600 mt-1">
                Student {searchTerm} selected
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
