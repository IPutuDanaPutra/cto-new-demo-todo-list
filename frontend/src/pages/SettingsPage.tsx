import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/Card';
import { Button } from '@/components/Button';
import { useThemeStore } from '@/stores/theme-store';
import { useUserPreferences, useUserPreferencesMutations } from '@/features/todos/hooks';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  Cog6ToothIcon,
  EyeIcon,
  BellIcon,
  ClockIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

export function SettingsPage() {
  const { theme, setTheme } = useThemeStore();
  const { data: preferences, isLoading } = useUserPreferences();
  const { updatePreferences } = useUserPreferencesMutations();
  const [isSaving, setIsSaving] = useState(false);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    // Also update in backend
    if (preferences) {
      handleSavePreferences({ theme: newTheme });
    }
  };

  const handleSavePreferences = async (updates: any) => {
    setIsSaving(true);
    try {
      await updatePreferences(updates);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const prefs = preferences?.preferences || {};

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

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <EyeIcon className="h-5 w-5" />
              Appearance
            </CardTitle>
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
                  onClick={() => handleThemeChange('light')}
                  disabled={isSaving}
                >
                  Light
                </Button>
                <Button
                  variant={theme === 'dark' ? 'primary' : 'secondary'}
                  onClick={() => handleThemeChange('dark')}
                  disabled={isSaving}
                >
                  Dark
                </Button>
                <Button
                  variant={theme === 'system' ? 'primary' : 'secondary'}
                  onClick={() => handleThemeChange('system')}
                  disabled={isSaving}
                >
                  System
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Default View
              </label>
              <select
                value={prefs.defaultView || 'LIST'}
                onChange={(e) => handleSavePreferences({ defaultView: e.target.value })}
                className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                disabled={isSaving}
              >
                <option value="LIST">List View</option>
                <option value="BOARD">Board View</option>
                <option value="CALENDAR">Calendar View</option>
                <option value="TIMELINE">Timeline View</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Timezone
              </label>
              <select
                value={prefs.timezone || 'UTC'}
                onChange={(e) => handleSavePreferences({ timezone: e.target.value })}
                className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                disabled={isSaving}
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Work Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5" />
              Work Hours
            </CardTitle>
            <CardDescription>
              Set your typical working hours for scheduling
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Work Hours Start
                </label>
                <input
                  type="time"
                  value={prefs.workHoursStart || '09:00'}
                  onChange={(e) => handleSavePreferences({ workHoursStart: e.target.value })}
                  className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Work Hours End
                </label>
                <input
                  type="time"
                  value={prefs.workHoursEnd || '17:00'}
                  onChange={(e) => handleSavePreferences({ workHoursEnd: e.target.value })}
                  className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  disabled={isSaving}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reminders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellIcon className="h-5 w-5" />
              Reminders
            </CardTitle>
            <CardDescription>
              Configure default reminder settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Default Reminder Lead Time
              </label>
              <select
                value={prefs.defaultReminderLeadTime || 15}
                onChange={(e) => handleSavePreferences({ defaultReminderLeadTime: parseInt(e.target.value) })}
                className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                disabled={isSaving}
              >
                <option value={0}>At due time</option>
                <option value={5}>5 minutes before</option>
                <option value={10}>10 minutes before</option>
                <option value={15}>15 minutes before</option>
                <option value={30}>30 minutes before</option>
                <option value={60}>1 hour before</option>
                <option value={120}>2 hours before</option>
                <option value={1440}>1 day before</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDaysIcon className="h-5 w-5" />
              Calendar
            </CardTitle>
            <CardDescription>
              Calendar display preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Week Starts On
              </label>
              <select
                value={prefs.weekStartsOn || '1'}
                onChange={(e) => handleSavePreferences({ weekStartsOn: e.target.value })}
                className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                disabled={isSaving}
              >
                <option value="0">Sunday</option>
                <option value="1">Monday</option>
                <option value="2">Tuesday</option>
                <option value="3">Wednesday</option>
                <option value="4">Thursday</option>
                <option value="5">Friday</option>
                <option value="6">Saturday</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cog6ToothIcon className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>Manage your profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Display Name
                </label>
                <input
                  type="text"
                  value={preferences?.displayName || ''}
                  onChange={(e) => handleSavePreferences({ displayName: e.target.value })}
                  className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Email
                </label>
                <input
                  type="email"
                  value={preferences?.email || ''}
                  className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  disabled
                />
                <p className="mt-1 text-sm text-gray-500">
                  Email cannot be changed here
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions that affect your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    Clear All Data
                  </h4>
                  <p className="text-sm text-gray-500">
                    Permanently delete all todos, categories, and tags
                  </p>
                </div>
                <Button variant="danger" disabled>
                  Clear All Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
