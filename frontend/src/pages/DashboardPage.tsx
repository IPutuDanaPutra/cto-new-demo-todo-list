import { Helmet } from 'react-helmet-async';
import { useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/Card';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  CheckCircleIcon,
  ClockIcon,
  ListBulletIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  FireIcon,
  CalendarDaysIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { useAnalyticsSummary, useTodoList } from '@/features/todos/hooks';
import { format, subDays, startOfDay } from 'date-fns';
import { cn } from '@/utils/cn';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];

export function DashboardPage() {
  const { data: analytics, isLoading: analyticsLoading } = useAnalyticsSummary();
  const { data: recentTodos, isLoading: todosLoading } = useTodoList({ 
    limit: 5, 
    sortBy: 'createdAt', 
    sortOrder: 'desc' 
  });

  const isLoading = analyticsLoading || todosLoading;

  const completionRateData = useMemo(() => {
    if (!analytics?.overview) return [];
    
    const rate = analytics.overview.completionRate;
    return [
      { name: 'Completed', value: rate, fill: '#10b981' },
      { name: 'Remaining', value: 100 - rate, fill: '#e5e7eb' },
    ];
  }, [analytics]);

  const priorityData = useMemo(() => {
    if (!analytics?.distribution?.byPriority) return [];
    
    return analytics.distribution.byPriority.map(item => ({
      name: item.priority || 'Unknown',
      value: item.count,
      fill: item.priority === 'URGENT' ? '#dc2626' :
            item.priority === 'HIGH' ? '#f59e0b' :
            item.priority === 'MEDIUM' ? '#3b82f6' :
            item.priority === 'LOW' ? '#6b7280' : '#9ca3af',
    }));
  }, [analytics]);

  const statusData = useMemo(() => {
    if (!analytics?.distribution?.byStatus) return [];
    
    return analytics.distribution.byStatus.map(item => ({
      name: item.status || 'Unknown',
      value: item.count,
      fill: item.status === 'DONE' ? '#10b981' :
            item.status === 'IN_PROGRESS' ? '#8b5cf6' :
            item.status === 'TODO' ? '#3b82f6' :
            item.status === 'CANCELLED' ? '#ef4444' : '#9ca3af',
    }));
  }, [analytics]);

  const completionTrend = useMemo(() => {
    if (!analytics?.trends?.completion) return [];
    
    return analytics.trends.completion.map(item => ({
      date: format(new Date(item.date), 'MMM dd'),
      completed: item.completed,
    }));
  }, [analytics]);

  const upcomingDeadlines = useMemo(() => {
    if (!recentTodos?.data) return [];
    
    const now = startOfDay(new Date());
    const weekFromNow = startOfDay(new Date());
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    
    return recentTodos.data
      .filter(todo => todo.dueDate && todo.status !== 'DONE')
      .map(todo => ({
        ...todo,
        daysUntilDue: Math.ceil((new Date(todo.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      }))
      .filter(todo => todo.daysUntilDue >= 0 && todo.daysUntilDue <= 7)
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
      .slice(0, 5);
  }, [recentTodos]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const overview = analytics?.overview;

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
              Welcome back! Here's an overview of your productivity.
            </p>
          </div>
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            New Todo
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Tasks
                  </p>
                  <p className="mt-2 text-3xl font-bold">{overview?.totalTodos || 0}</p>
                </div>
                <ListBulletIcon className="h-12 w-12 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    In Progress
                  </p>
                  <p className="mt-2 text-3xl font-bold">{overview?.totalTodos ? 
                    statusData.find(s => s.name === 'IN_PROGRESS')?.value || 0 : 0}</p>
                </div>
                <ClockIcon className="h-12 w-12 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Completed
                  </p>
                  <p className="mt-2 text-3xl font-bold">{overview?.completedTodos || 0}</p>
                  <p className="text-sm text-gray-500">
                    {overview?.completionRate.toFixed(1)}% rate
                  </p>
                </div>
                <CheckCircleIcon className="h-12 w-12 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Overdue
                  </p>
                  <p className="mt-2 text-3xl font-bold">{overview?.overdueTodos || 0}</p>
                </div>
                <ExclamationTriangleIcon className="h-12 w-12 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Completion Rate</CardTitle>
              <CardDescription>
                Overall task completion percentage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={completionRateData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {completionRateData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Percentage']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center -mt-16 mb-4">
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {overview?.completionRate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500">Completion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tasks by Priority</CardTitle>
              <CardDescription>
                Distribution of tasks across priority levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8">
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Completion Trend (30 Days)</CardTitle>
              <CardDescription>
                Daily task completion over the last month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={completionTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="completed" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tasks by Status</CardTitle>
              <CardDescription>
                Current status distribution of all tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({name, value}) => `${name}: ${value}`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
              <CardDescription>
                Your most recently created tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTodos?.data && recentTodos.data.length > 0 ? (
                  recentTodos.data.map((todo) => (
                    <div key={todo.id} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {todo.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(todo.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className={cn(
                        'px-2 py-1 text-xs rounded-full',
                        todo.status === 'DONE' ? 'bg-green-100 text-green-800' :
                        todo.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        todo.status === 'TODO' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      )}>
                        {todo.status}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No recent tasks
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>Tasks due in the next 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingDeadlines.length > 0 ? (
                  upcomingDeadlines.map((todo) => (
                    <div key={todo.id} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {todo.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {todo.dueDate && format(new Date(todo.dueDate), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className={cn(
                        'px-2 py-1 text-xs rounded-full',
                        todo.daysUntilDue === 0 ? 'bg-red-100 text-red-800' :
                        todo.daysUntilDue === 1 ? 'bg-orange-100 text-orange-800' :
                        todo.daysUntilDue <= 3 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      )}>
                        {todo.daysUntilDue === 0 ? 'Due Today' :
                         todo.daysUntilDue === 1 ? 'Due Tomorrow' :
                         `${todo.daysUntilDue} days`}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No upcoming deadlines
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Productivity Stats */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDaysIcon className="h-5 w-5" />
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="font-medium">{overview?.todosThisWeek || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="font-medium text-green-600">
                    {completionTrend.slice(-7).reduce((sum, day) => sum + day.completed, 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="font-medium">{overview?.todosThisMonth || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="font-medium text-green-600">
                    {completionTrend.reduce((sum, day) => sum + day.completed, 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FireIcon className="h-5 w-5" />
                Productivity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Daily</span>
                  <span className="font-medium">
                    {(completionTrend.reduce((sum, day) => sum + day.completed, 0) / Math.max(completionTrend.length, 1)).toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Best Day</span>
                  <span className="font-medium">
                    {Math.max(...completionTrend.map(d => d.completed), 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
