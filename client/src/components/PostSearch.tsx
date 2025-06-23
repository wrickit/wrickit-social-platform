import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";

interface PostSearchProps {
  onSearch: (query: string, type: string) => void;
  isLoading?: boolean;
}

export default function PostSearch({ onSearch, isLoading = false }: PostSearchProps) {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState("content");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), searchType);
    }
  };

  return (
    <form onSubmit={handleSearch} className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search posts... (use # for hashtags, @ for mentions)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-full sm:w-40">
          <Select value={searchType} onValueChange={setSearchType}>
            <SelectTrigger>
              <SelectValue placeholder="Search type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="content">Content</SelectItem>
              <SelectItem value="hashtag">Hashtags</SelectItem>
              <SelectItem value="mention">Mentions</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={isLoading || !query.trim()}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </div>
      
      <div className="text-sm text-gray-600 dark:text-gray-400">
        <p><strong>Search tips:</strong></p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Type <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">#hashtag</code> to search for hashtags</li>
          <li>Type <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">@username</code> to search for mentions</li>
          <li>Use the dropdown to filter search type</li>
        </ul>
      </div>
    </form>
  );
}