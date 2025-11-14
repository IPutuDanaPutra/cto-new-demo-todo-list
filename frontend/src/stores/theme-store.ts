import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const resolveTheme = (theme: Theme): 'light' | 'dark' => {
  return theme === 'system' ? getSystemTheme() : theme;
};

const applyTheme = (theme: 'light' | 'dark') => {
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => {
      if (typeof window !== 'undefined') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', () => {
          const currentTheme = get().theme;
          if (currentTheme === 'system') {
            const newResolvedTheme = getSystemTheme();
            set({ resolvedTheme: newResolvedTheme });
            applyTheme(newResolvedTheme);
          }
        });
      }

      return {
        theme: 'system',
        resolvedTheme: getSystemTheme(),
        setTheme: (theme: Theme) => {
          const resolved = resolveTheme(theme);
          set({ theme, resolvedTheme: resolved });
          applyTheme(resolved);
        },
      };
    },
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.resolvedTheme);
        }
      },
    }
  )
);

if (typeof window !== 'undefined') {
  applyTheme(useThemeStore.getState().resolvedTheme);
}
