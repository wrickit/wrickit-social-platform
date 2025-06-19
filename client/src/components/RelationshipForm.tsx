import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";


export default function RelationshipForm() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [relationshipType, setRelationshipType] = useState("");
  
  const queryClient = useQueryClient();

  // Get current user's relationships to check for existing ones
  const { data: relationships = [] } = useQuery({
    queryKey: ["/api/relationships"],
  });

  const addRelationshipMutation = useMutation({
    mutationFn: async (data: { toUserId: number; type: string }) => {
      await apiRequest("POST", "/api/relationships", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/relationships"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      setSearchTerm("");
      setSelectedUserId(null);
      setRelationshipType("");
    },
    onError: (error: any) => {
      console.error("Failed to add relationship:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId || !relationshipType) {
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
      return;
    }

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchTerm.trim())}`);
      if (response.ok) {
        const users = await response.json();
        if (users && users.length > 0) {
          const user = users[0]; // Take the first match
          setSelectedUserId(user.id);
        } else {
          setSelectedUserId(null);
        }
      } else {
        setSelectedUserId(null);
      }
    } catch (error) {
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
