import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useThemeStore } from '@/stores/theme-store';
import { Button } from './Button';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useThemeStore();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="h-9 w-9 p-0"
    >
      {resolvedTheme === 'light' ? (
        <MoonIcon className="h-5 w-5" />
      ) : (
        <SunIcon className="h-5 w-5" />
      )}
    </Button>
  );
}
