import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GROUP_LABEL_KEYS, GROUPS, type AnimalGroup } from '../types';

interface SearchBarProps {
  onSearch: (query: string) => void | Promise<void>;
  placeholder?: string;
}

export default function AnimalSearchBar({ onSearch, placeholder }: SearchBarProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<AnimalGroup | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce: wait 300ms after typing stops before searching
  useEffect(() => {
    if (query.trim() === '') {
      setIsLoading(false);
      onSearch('');
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
    setQuery('');
    inputRef.current?.focus();
  };

  const filterByGroup = (group: AnimalGroup) => {
    const isDeselecting = selectedGroup === group;

    if (isDeselecting) {
      setSelectedGroup(null);
      onSearch('');
    } else {
      setSelectedGroup(group);
      setQuery(''); // clear text search, since group filter takes over
      onSearch(group);
    }

    inputRef.current?.focus();
  };

  return (
    <div>
      <div className={`search-bar ${isFocused ? "search-bar--focused" : ""}`}>
        <Search size={18} className="search-icon"  />

        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={placeholder ?? t('search.placeholder')}
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
            aria-label={t('search.clear')}
            className="search-bar__clear"
          >
            <X size={16} />
          </button>
        )}

      </div>

      <div className="group-chips" role="group" aria-label={t('search.filterByGroup')}>
      {GROUPS.map((group) => (
        <button
          key={group}
          type="button"
          aria-pressed={selectedGroup === group}
          onClick={() => filterByGroup(group)}
          className={selectedGroup === group ? 'chip chip-active' : 'chip'}
        >
          {t(GROUP_LABEL_KEYS[group])}
        </button>
      ))}
    </div>
    </div>
  );
}