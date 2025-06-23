import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User as UserIcon, Check } from "lucide-react";


interface UserType {
  id: number;
  name: string;
  class: string;
  division: string;
  profileImageUrl?: string;
}

export default function RelationshipForm() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState("");
  const [relationshipType, setRelationshipType] = useState("");
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const queryClient = useQueryClient();
  const searchRef = useRef<HTMLDivElement>(null);

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
      setSelectedUserName("");
      setRelationshipType("");
      setSearchResults([]);
      setShowResults(false);
    },
    onError: (error: any) => {
      console.error("Failed to add relationship:", error);
    },
  });

  // Real-time search function
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`);
      if (response.ok) {
        const users = await response.json();
        setSearchResults(users.slice(0, 5)); // Limit to 5 results
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    } catch (error) {
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle clicking outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Select a user from search results
  const selectUser = (user: UserType) => {
    setSelectedUserId(user.id);
    setSelectedUserName(user.name);
    setSearchTerm(user.name);
    setShowResults(false);
  };

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

  // Handle input change and clear selection if text changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Clear selection if user modifies the search term
    if (selectedUserId && value !== selectedUserName) {
      setSelectedUserId(null);
      setSelectedUserName("");
    }
  };

  return (
    <Card className="content-box rounded">
      <CardHeader>
        <CardTitle className="app-text">Add Social Relationship</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative" ref={searchRef}>
            <Label htmlFor="search" className="app-text-light">
              Student Name:
            </Label>
            <div className="relative">
              <Input
                id="search"
                type="text"
                placeholder="Start typing a student's name..."
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => searchTerm && setShowResults(true)}
                className="w-full pr-10"
              />
              {selectedUserId && (
                <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-600" />
              )}
            </div>
            
            {/* Search Results Dropdown */}
            {showResults && (searchResults.length > 0 || isSearching) && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {isSearching ? (
                  <div className="p-3 text-center text-gray-500">
                    <span className="animate-pulse">Searching...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => selectUser(user)}
                      className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0 focus:bg-gray-50 dark:focus:bg-gray-700 focus:outline-none"
                    >
                      <div className="flex items-center space-x-3">
                        {user.profileImageUrl ? (
                          <img
                            src={user.profileImageUrl}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
                            <span className="text-xs font-semibold text-purple-600 dark:text-purple-300">
                              {user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Class {user.class}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-gray-500">
                    No students found
                  </div>
                )}
              </div>
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
            disabled={addRelationshipMutation.isPending || !selectedUserId || !relationshipType}
            className="discord-purple-bg hover:bg-purple-700 text-white disabled:opacity-50"
          >
            {addRelationshipMutation.isPending ? "Adding..." : "Add Relationship"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
