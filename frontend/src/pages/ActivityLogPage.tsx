import { Helmet } from 'react-helmet-async';
import { useState, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/Card';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useActivityLog } from '@/features/todos/hooks';
import { ActivityLog, ActivityType } from '@/types';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import {
  CheckCircleIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  UserIcon,
  DocumentTextIcon,
  FlagIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const activityTypeConfig = {
  CREATED: {
    icon: DocumentTextIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Created',
  },
  UPDATED: {
    icon: PencilIcon,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    label: 'Updated',
  },
  DELETED: {
    icon: TrashIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Deleted',
  },
  COMPLETED: {
    icon: CheckCircleIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Completed',
  },
  COMMENTED: {
    icon: DocumentTextIcon,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    label: 'Commented',
  },
  ASSIGNED: {
    icon: UserIcon,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    label: 'Assigned',
  },
  TAGGED: {
    icon: TagIcon,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    label: 'Tagged',
  },
  STATUS_CHANGED: {
    icon: FlagIcon,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    label: 'Status Changed',
  },
};

export function ActivityLogPage() {
  const [typeFilter, setTypeFilter] = useState<ActivityType | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const { data: activityData, isLoading } = useActivityLog({
    type: typeFilter,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const filteredActivities = useMemo(() => {
    if (!activityData?.data) return [];
    
    let filtered = activityData.data;

    // Apply client-side filtering if needed
    if (typeFilter) {
      filtered = filtered.filter(activity => activity.type === typeFilter);
    }

    if (dateFrom) {
      filtered = filtered.filter(activity => 
        new Date(activity.createdAt) >= new Date(dateFrom)
      );
    }

    if (dateTo) {
      filtered = filtered.filter(activity => 
        new Date(activity.createdAt) <= new Date(dateTo)
      );
    }

    return filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [activityData, typeFilter, dateFrom, dateTo]);

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, yyyy at h:mm a');
    }
  };

  const getActivityDescription = (activity: ActivityLog) => {
    const config = activityTypeConfig[activity.type];
    const todo = activity.todo;

    switch (activity.type) {
      case 'CREATED':
        return `Created todo "${todo?.title || 'Unknown'}"`;
      case 'UPDATED':
        return `Updated todo "${todo?.title || 'Unknown'}"`;
      case 'DELETED':
        return `Deleted todo "${todo?.title || 'Unknown'}"`;
      case 'COMPLETED':
        return `Completed todo "${todo?.title || 'Unknown'}"`;
      case 'COMMENTED':
        return `Added comment to "${todo?.title || 'Unknown'}"`;
      case 'ASSIGNED':
        return `Assigned "${todo?.title || 'Unknown'}"`;
      case 'TAGGED':
        return `Added tags to "${todo?.title || 'Unknown'}"`;
      case 'STATUS_CHANGED':
        const changes = activity.changes as any;
        const fromStatus = changes?.before?.status;
        const toStatus = changes?.after?.status;
        return `Changed status of "${todo?.title || 'Unknown'}" from ${fromStatus} to ${toStatus}`;
      default:
        return `${config.label} "${todo?.title || 'Unknown'}"`;
    }
  };

  const clearFilters = () => {
    setTypeFilter(undefined);
    setDateFrom('');
    setDateTo('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Activity Log - Todo Platform</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Activity Log</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Track all changes and activities on your todos
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Filter activities by type and date range
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Activity Type
                </label>
                <select
                  value={typeFilter || ''}
                  onChange={(e) => setTypeFilter(e.target.value ? e.target.value as ActivityType : undefined)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">All Types</option>
                  {Object.entries(activityTypeConfig).map(([type, config]) => (
                    <option key={type} value={type}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={clearFilters}
                  variant="secondary"
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Showing {filteredActivities.length} activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredActivities.length > 0 ? (
              <div className="space-y-4">
                {filteredActivities.map((activity) => {
                  const config = activityTypeConfig[activity.type];
                  const Icon = config.icon;

                  return (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className={`p-2 rounded-full ${config.bgColor}`}>
                        <Icon className={`h-5 w-5 ${config.color}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {getActivityDescription(activity)}
                        </p>
                        
                        <div className="flex items-center mt-1 space-x-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(activity.createdAt)}
                          </span>
                          
                          {activity.todo?.status && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              activity.todo.status === 'DONE' ? 'bg-green-100 text-green-800' :
                              activity.todo.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                              activity.todo.status === 'TODO' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {activity.todo.status}
                            </span>
                          )}
                          
                          {activity.todo?.priority && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              activity.todo.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                              activity.todo.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                              activity.todo.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {activity.todo.priority}
                            </span>
                          )}
                        </div>

                        {activity.changes && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                              View changes
                            </summary>
                            <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                              {JSON.stringify(activity.changes, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>

                      <div className="flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (activity.todoId) {
                              window.location.href = `/todos/${activity.todoId}`;
                            }
                          }}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  No activities found
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Try adjusting your filters or check back later for new activities.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}