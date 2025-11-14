import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './Button';
import { useSearchTodos } from '@/features/todos/hooks';
import { SearchResult } from '@/types';
import { cn } from '@/utils/cn';

export function Topbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  
  const navigate = useNavigate();
  const searchTodos = useSearchTodos();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/' && document.activeElement !== inputRef.current) {
        event.preventDefault();
        inputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (event.key === 'Escape') {
        setIsSearchOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
      } else if (isSearchOpen) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setSelectedIndex(prev => 
            prev < searchResults.length - 1 ? prev + 1 : prev
          );
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        } else if (event.key === 'Enter' && selectedIndex >= 0) {
          event.preventDefault();
          const selectedResult = searchResults[selectedIndex];
          if (selectedResult) {
            navigate(`/todos/${selectedResult.id}`);
            setIsSearchOpen(false);
            setSearchQuery('');
            setSelectedIndex(-1);
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, searchResults, selectedIndex, navigate]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setSelectedIndex(-1);

    if (query.trim().length < 2) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    setIsSearching(true);
    try {
      const result = await searchTodos(query);
      setSearchResults(result.data || []);
      setIsSearchOpen(true);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-600 bg-red-100';
      case 'HIGH': return 'text-orange-600 bg-orange-100';
      case 'MEDIUM': return 'text-blue-600 bg-blue-100';
      case 'LOW': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE': return 'text-green-600 bg-green-100';
      case 'IN_PROGRESS': return 'text-purple-600 bg-purple-100';
      case 'TODO': return 'text-blue-600 bg-blue-100';
      case 'CANCELLED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <header className="fixed left-64 right-0 top-0 z-40 h-16 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex flex-1 items-center gap-4">
          <div ref={searchRef} className="relative w-96">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="search"
              placeholder="Search todos... (press /)"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim().length >= 2 && searchResults.length > 0) {
                  setIsSearchOpen(true);
                }
              }}
              className={cn(
                'input pl-10 pr-10',
                isSearchOpen && 'ring-2 ring-blue-500 ring-opacity-50'
              )}
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon />
              </button>
            )}

            {/* Search Results Dropdown */}
            {isSearchOpen && (searchResults.length > 0 || isSearching) && (
              <div className="absolute top-full left-0 right-0 mt-1 max-h-96 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {isSearching ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((result, index) => (
                      <button
                        key={result.id}
                        onClick={() => {
                          navigate(`/todos/${result.id}`);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                          setSelectedIndex(-1);
                        }}
                        className={cn(
                          'w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                          selectedIndex === index && 'bg-gray-50 dark:bg-gray-700'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="truncate font-medium text-gray-900 dark:text-gray-100">
                              {result.title}
                            </p>
                            {result.description && (
                              <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                                {result.description}
                              </p>
                            )}
                            <div className="mt-2 flex items-center gap-2">
                              {result.status && (
                                <span className={cn(
                                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                                  getStatusColor(result.status)
                                )}>
                                  {result.status}
                                </span>
                              )}
                              {result.priority && (
                                <span className={cn(
                                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                                  getPriorityColor(result.priority)
                                )}>
                                  {result.priority}
                                </span>
                              )}
                              {result.category && (
                                <span 
                                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                                  style={{ 
                                    backgroundColor: result.category.color + '20',
                                    color: result.category.color 
                                  }}
                                >
                                  <div 
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: result.category.color }}
                                  />
                                  {result.category.name}
                                </span>
                              )}
                              {result.dueDate && (
                                <span className="text-xs text-gray-500">
                                  Due: {new Date(result.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          {result._relevanceScore && (
                            <div className="text-xs text-gray-400">
                              {Math.round(result._relevanceScore)}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No results found for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
            <BellIcon className="h-5 w-5" />
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
