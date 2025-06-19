import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, UserPlus } from "lucide-react";

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  name: string;
  class: string;
  division: string;
  profileImageUrl?: string;
}

interface UserSearchDialogProps {
  trigger: React.ReactNode;
}

export default function UserSearchDialog({ trigger }: UserSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [relationshipType, setRelationshipType] = useState("friend");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: searchResults = [], isLoading: isSearching } = useQuery<User[]>({
    queryKey: ["/api/users/search-username", searchQuery],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: searchQuery.length > 0,
  });

  const createRelationshipMutation = useMutation({
    mutationFn: async ({ userId, type }: { userId: number; type: string }) => {
      const response = await apiRequest("POST", "/api/relationships", {
        toUserId: userId,
        type,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Relationship added!",
        description: "Successfully added user to your connections.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/relationships"] });
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add relationship",
        variant: "destructive",
      });
    },
  });

  const handleAddRelationship = (userId: number) => {
    createRelationshipMutation.mutate({ userId, type: relationshipType });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Find Classmates</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Search className="h-4 w-4 mt-3 text-gray-400" />
          </div>

          <div>
            <Select value={relationshipType} onValueChange={setRelationshipType}>
              <SelectTrigger>
                <SelectValue placeholder="Select relationship type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="best_friend">Best Friend</SelectItem>
                <SelectItem value="friend">Friend</SelectItem>
                <SelectItem value="acquaintance">Acquaintance</SelectItem>
                <SelectItem value="crush">Crush</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isSearching && (
            <div className="text-center py-4">
              <p className="text-gray-500">Searching...</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((user: User) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">
                        {user.firstName[0]}{user.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">@{user.username} • {user.class}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddRelationship(user.id)}
                    disabled={createRelationshipMutation.isPending}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}

          {searchQuery.length > 0 && !isSearching && searchResults.length === 0 && (
            <div className="text-center py-4">
              <p className="text-gray-500">No users found with that username.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}