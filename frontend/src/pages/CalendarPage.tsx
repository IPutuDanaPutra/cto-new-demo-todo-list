import { Helmet } from 'react-helmet-async';
import { Card, CardContent } from '@/components/Card';
import { CalendarIcon } from '@heroicons/react/24/outline';

export function CalendarPage() {
  return (
    <>
      <Helmet>
        <title>Calendar - Todo Platform</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            View your todos in a calendar format
          </p>
        </div>

        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <CalendarIcon className="h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Calendar View
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Calendar integration coming soon
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
