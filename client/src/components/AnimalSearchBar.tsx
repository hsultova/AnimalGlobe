import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void | Promise<void>;
  placeholder?: string;
}

export default function AnimalSearchBar({
  onSearch,
  placeholder = "Search for an animal...",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce: wait 300ms after typing stops before searching
  useEffect(() => {
    if (query.trim() === "") {
      setIsLoading(false);
      onSearch("");
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      await onSearch(query);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  const clear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div className={`search-bar ${isFocused ? "search-bar--focused" : ""}`}>
      <Search size={18} className="search-bar__icon" />

      <input
        ref={inputRef}
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={(e) => e.key === "Escape" && clear()}
        className="search-bar__input"
      />

      {isLoading && <Loader2 size={16} className="search-bar__spinner" />}

      {!isLoading && query && (
        <button
          onClick={clear}
          aria-label="Clear search"
          className="search-bar__clear"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}