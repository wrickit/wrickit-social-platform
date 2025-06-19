import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus } from "lucide-react";

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

interface CreateChatGroupDialogProps {
  trigger: React.ReactNode;
}

export default function CreateChatGroupDialog({ trigger }: CreateChatGroupDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: searchResults = [], isLoading: isSearching } = useQuery<User[]>({
    queryKey: ["/api/users/search-all", searchQuery],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: searchQuery.length > 0,
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; memberIds: number[] }) => {
      const response = await apiRequest("POST", "/api/friend-groups", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Chat group created!",
        description: "Your new chat group has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friend-groups"] });
      setIsOpen(false);
      setGroupName("");
      setSelectedUsers([]);
      setSearchQuery("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create chat group",
        variant: "destructive",
      });
    },
  });

  const handleUserToggle = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a group name",
        variant: "destructive",
      });
      return;
    }
    if (selectedUsers.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one member",
        variant: "destructive",
      });
      return;
    }

    createGroupMutation.mutate({
      name: groupName.trim(),
      memberIds: selectedUsers,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Chat Group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              placeholder="Enter group name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="search">Search Members</Label>
            <Input
              id="search"
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="max-h-48 overflow-y-auto">
            {isSearching ? (
              <div className="text-center py-4 text-gray-500">Searching...</div>
            ) : searchResults.length === 0 && searchQuery ? (
              <div className="text-center py-4 text-gray-500">No users found</div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => handleUserToggle(user.id)}
                    />
                    <label
                      htmlFor={`user-${user.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
                          {user.firstName?.charAt(0) || user.username?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{user.name || `${user.firstName} ${user.lastName}`}</div>
                          <div className="text-xs text-gray-500">@{user.username} • {user.class}</div>
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedUsers.length > 0 && (
            <div className="text-sm text-gray-600">
              {selectedUsers.length} member{selectedUsers.length > 1 ? 's' : ''} selected
            </div>
          )}

          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createGroupMutation.isPending}
              className="flex-1"
            >
              {createGroupMutation.isPending ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}