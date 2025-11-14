import { BellIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './Button';

export function Topbar() {
  return (
    <header className="fixed left-64 right-0 top-0 z-40 h-16 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative w-96">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search todos..."
              className="input pl-10"
            />
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
