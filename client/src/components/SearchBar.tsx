import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface FilterOption<T extends string> {
  value: T;
  label: string;
}

interface SearchBarProps<T extends string> {
  onSearch: (query: string) => void | Promise<void>;
  placeholder?: string;
  debounceMs?: number;
  filters?: FilterOption<T>[];
  selectedFilter?: T | null;
  onFilterChange?: (value: T | null) => void;
  clearQueryOnFilter?: boolean;
  filterLabel?: string;
}

export default function SearchBar<T extends string>({
  onSearch,
  placeholder,
  debounceMs = 300,
  filters,
  selectedFilter = null,
  onFilterChange,
  clearQueryOnFilter = false,
  filterLabel,
}: SearchBarProps<T>) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Always call the latest onSearch without re-running the debounce effect
  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  });

  // Track the latest search so stale ones don't turn off the spinner
  const latestSearchId = useRef(0);

  useEffect(() => {
    const searchId = ++latestSearchId.current;

    if (query.trim() === '') {
      setIsLoading(false);
      onSearchRef.current('');
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        await onSearchRef.current(query);
      } finally {
        if (searchId === latestSearchId.current) setIsLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  const clear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const toggleFilter = (value: T) => {
    const next = selectedFilter === value ? null : value;
    onFilterChange?.(next);
    if (next !== null && clearQueryOnFilter) setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div>
      <div className={`search-bar ${isFocused ? 'search-bar-focused' : ''}`}>
        <Search size={18} className="search-icon" />

        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={placeholder ?? t('search.placeholder')}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => e.key === 'Escape' && clear()}
          className="search-bar__input"
        />

        {isLoading && <Loader2 size={16} className="spinner" />}

        {!isLoading && query && (
          <button
            type="button"
            onClick={clear}
            aria-label={t('search.clear')}
            className="search-bar__clear"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {filters && filters.length > 0 && (
        <div className="group-chips" role="group" aria-label={filterLabel}>
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={selectedFilter === f.value}
              onClick={() => toggleFilter(f.value)}
              className={
                selectedFilter === f.value ? 'chip chip-active' : 'chip'
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
