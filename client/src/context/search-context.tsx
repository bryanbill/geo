import { createContext, useContext, useState } from "react";
import { toast } from "sonner";
import { SkullIcon } from "lucide-react";
interface Result {
  id: string;
  name: string;
  description: string;
  category: string;
  geom: Document | Element | string;
  geojson: string;
}

interface SearchContextType {
  results: Result[];
  handleSearch: (query: string) => Promise<void>;
  busy: boolean;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [results, setResults] = useState<Result[]>([]);
  const [busy, setBusy] = useState(false);

  const handleSearch = async (query: string) => {
    try {
      setBusy(true);

      // NOTE: Update the URL to match your backend
      const response = await fetch("http://localhost:5000/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();
      const { postgres } = data;

      setResults(postgres);
    } catch (error) {
      console.error("Search error:", error);
      toast("Something went wrong. Please try again later.", {
        icon: <SkullIcon />,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <SearchContext.Provider value={{ results, handleSearch, busy }}>
      {children}
    </SearchContext.Provider>
  );
}

// Custom hook for using the search context
export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}
