import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  ListBulletIcon,
  CalendarIcon,
  Cog6ToothIcon,
  FolderIcon,
  TagIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';

interface NavItem {
  name: string;
  href: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Todos', href: '/todos', icon: ListBulletIcon },
  { name: 'Categories', href: '/categories', icon: FolderIcon },
  { name: 'Tags', href: '/tags', icon: TagIcon },
  { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
  { name: 'Activity', href: '/activity', icon: ClockIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center border-b border-gray-200 px-6 dark:border-gray-800">
          <h1 className="text-xl font-bold text-primary-600">Todo Platform</h1>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                )}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 flex-shrink-0',
                    isActive
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-400'
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 p-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-sm font-semibold text-white">
              U
            </div>
            <div className="flex-1 text-sm">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                User
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                user@example.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
