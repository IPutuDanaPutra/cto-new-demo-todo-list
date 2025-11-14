import { Helmet } from 'react-helmet-async';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/Card';
import { useThemeStore } from '@/stores/theme-store';
import { Button } from '@/components/Button';

export function SettingsPage() {
  const { theme, setTheme } = useThemeStore();

  return (
    <>
      <Helmet>
        <title>Settings - Todo Platform</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your account and application preferences
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize how the application looks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Theme
              </label>
              <div className="mt-2 flex gap-2">
                <Button
                  variant={theme === 'light' ? 'primary' : 'secondary'}
                  onClick={() => setTheme('light')}
                >
                  Light
                </Button>
                <Button
                  variant={theme === 'dark' ? 'primary' : 'secondary'}
                  onClick={() => setTheme('dark')}
                >
                  Dark
                </Button>
                <Button
                  variant={theme === 'system' ? 'primary' : 'secondary'}
                  onClick={() => setTheme('system')}
                >
                  System
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Manage your profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Profile management coming soon
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
