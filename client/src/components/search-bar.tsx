import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ArrowUp, Loader2 } from "lucide-react";
import { useSearch } from "../context/search-context";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const { handleSearch: onSearch, busy } = useSearch();

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query);
      setQuery("");
    }
  };

  return (
    <div className="flex items-center w-full p-2 border rounded-full shadow-sm bg-white">
      <Input
        type="text"
        placeholder="Type your search..."
        className="flex-1 px-4 bg-transparent !shadow-none border-none outline-none ring-0 focus:!ring-0 focus:!outline-none"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <Button
        variant="default"
        size="icon"
        className="ml-2 bg-black text-white hover:bg-gray-900"
        onClick={handleSearch}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ArrowUp className="w-5 h-5" />
        )}
      </Button>
    </div>
  );
}
