import { Helmet } from 'react-helmet-async';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/Card';
import { Button } from '@/components/Button';
import {
  CheckCircleIcon,
  ClockIcon,
  ListBulletIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

export function DashboardPage() {
  const stats = [
    {
      name: 'Total Todos',
      value: '0',
      icon: ListBulletIcon,
      color: 'text-blue-600',
    },
    {
      name: 'In Progress',
      value: '0',
      icon: ClockIcon,
      color: 'text-yellow-600',
    },
    {
      name: 'Completed',
      value: '0',
      icon: CheckCircleIcon,
      color: 'text-green-600',
    },
  ];

  return (
    <>
      <Helmet>
        <title>Dashboard - Todo Platform</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Welcome back! Here's an overview of your todos.
            </p>
          </div>
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            New Todo
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.name}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.name}
                    </p>
                    <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-12 w-12 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Todos</CardTitle>
              <CardDescription>
                Your most recently created todos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12 text-gray-500">
                No todos yet. Create your first todo to get started!
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>Todos due in the next 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12 text-gray-500">
                No upcoming deadlines
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
