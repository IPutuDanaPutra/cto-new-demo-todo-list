import { Helmet } from 'react-helmet-async';
import { useState, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { useTodoList } from '@/features/todos/hooks';
import { TodoListItem, TodoPriority } from '@/types';
import { cn } from '@/utils/cn';
import { format, isPast, isToday, isTomorrow, parseISO } from 'date-fns';

export function CalendarPage() {
  const [view, setView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'>('dayGridMonth');
  const { data: todoList, isLoading } = useTodoList({ limit: 100 });

  const transformTodosToEvents = useCallback((todos: TodoListItem[]) => {
    return todos
      .filter(todo => todo.dueDate)
      .map(todo => {
        const dueDate = parseISO(todo.dueDate!);
        const isOverdue = isPast(dueDate) && todo.status !== 'DONE';
        const isDueToday = isToday(dueDate);
        const isDueTomorrow = isTomorrow(dueDate);

        let backgroundColor = '#3b82f6'; // blue-500 default
        let textColor = '#ffffff';
        let borderColor = backgroundColor;

        // Color by priority
        if (todo.priority === 'URGENT') {
          backgroundColor = '#dc2626'; // red-600
          borderColor = '#991b1b'; // red-800
        } else if (todo.priority === 'HIGH') {
          backgroundColor = '#f59e0b'; // amber-500
          borderColor = '#d97706'; // amber-600
        } else if (todo.priority === 'MEDIUM') {
          backgroundColor = '#3b82f6'; // blue-500
          borderColor = '#2563eb'; // blue-600
        } else {
          backgroundColor = '#6b7280'; // gray-500
          borderColor = '#4b5563'; // gray-600
        }

        // Adjust for status
        if (todo.status === 'DONE') {
          backgroundColor = '#10b981'; // green-500
          borderColor = '#059669'; // green-600
        } else if (todo.status === 'IN_PROGRESS') {
          backgroundColor = '#8b5cf6'; // violet-500
          borderColor = '#7c3aed'; // violet-600
        }

        // Adjust opacity for overdue
        if (isOverdue) {
          backgroundColor = backgroundColor + '99'; // Add transparency
        }

        return {
          id: todo.id,
          title: todo.title,
          start: todo.dueDate,
          allDay: true,
          backgroundColor,
          textColor,
          borderColor,
          extendedProps: {
            todo,
            isOverdue,
            isDueToday,
            isDueTomorrow,
          },
        };
      });
  }, []);

  const handleEventClick = useCallback((clickInfo: any) => {
    const todo = clickInfo.event.extendedProps.todo as TodoListItem;
    // Navigate to todo detail or open modal
    window.location.href = `/todos/${todo.id}`;
  }, []);

  const handleDateSelect = useCallback((selectInfo: any) => {
    const endDate = selectInfo.endStr;
    const startDate = selectInfo.startStr;
    
    // Create new todo with selected date
    const title = prompt('Enter todo title:');
    if (title) {
      // This would integrate with your todo creation logic
      console.log('Creating todo:', { title, dueDate: startDate });
    }
  }, []);

  const events = todoList?.data ? transformTodosToEvents(todoList.data) : [];

  return (
    <>
      <Helmet>
        <title>Calendar - Todo Platform</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Calendar</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              View and manage your todos in calendar format
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={view === 'dayGridMonth' ? 'primary' : 'secondary'}
              onClick={() => setView('dayGridMonth')}
            >
              Month
            </Button>
            <Button
              variant={view === 'timeGridWeek' ? 'primary' : 'secondary'}
              onClick={() => setView('timeGridWeek')}
            >
              Week
            </Button>
            <Button
              variant={view === 'timeGridDay' ? 'primary' : 'secondary'}
              onClick={() => setView('timeGridDay')}
            >
              Day
            </Button>
            <Button
              variant={view === 'listWeek' ? 'primary' : 'secondary'}
              onClick={() => setView('listWeek')}
            >
              List
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                initialView={view}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: '',
                }}
                events={events}
                eventClick={handleEventClick}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                height="auto"
                eventDidMount={(info) => {
                  const todo = info.event.extendedProps.todo as TodoListItem;
                  
                  // Add tooltip with additional info
                  info.el.setAttribute('title', `${todo.title}${todo.description ? '\n' + todo.description : ''}`);
                  
                  // Add custom styling for overdue items
                  if (info.event.extendedProps.isOverdue) {
                    info.el.classList.add('line-through');
                  }
                }}
                select={handleDateSelect}
                eventContent={(info) => {
                  const todo = info.event.extendedProps.todo as TodoListItem;
                  const { isOverdue, isDueToday, isDueTomorrow } = info.event.extendedProps;
                  
                  return (
                    <div className="fc-event-main-content p-1">
                      <div className="fc-event-title">
                        <span className={cn(
                          'text-xs font-medium',
                          isOverdue && 'line-through'
                        )}>
                          {todo.title}
                        </span>
                        {todo.category && (
                          <span 
                            className="ml-1 inline-block w-2 h-2 rounded-full"
                            style={{ backgroundColor: todo.category.color }}
                          />
                        )}
                      </div>
                      {isDueToday && (
                        <div className="text-xs opacity-75">Today</div>
                      )}
                      {isDueTomorrow && (
                        <div className="text-xs opacity-75">Tomorrow</div>
                      )}
                      {isOverdue && (
                        <div className="text-xs opacity-75">Overdue</div>
                      )}
                    </div>
                  );
                }}
              />
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#dc2626' }} />
                <span className="text-sm">Urgent Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }} />
                <span className="text-sm">High Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }} />
                <span className="text-sm">Medium Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#6b7280' }} />
                <span className="text-sm">Low Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }} />
                <span className="text-sm">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#8b5cf6' }} />
                <span className="text-sm">In Progress</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {events
                  .filter(event => {
                    const eventDate = new Date(event.start);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return eventDate >= today && !event.extendedProps.todo.status === 'DONE';
                  })
                  .slice(0, 5)
                  .map(event => (
                    <div key={event.id} className="flex items-center gap-2 text-sm">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: event.backgroundColor }}
                      />
                      <span className="truncate">{event.title}</span>
                    </div>
                  ))}
                {events.filter(event => {
                  const eventDate = new Date(event.start);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return eventDate >= today && !event.extendedProps.todo.status === 'DONE';
                }).length === 0 && (
                  <div className="text-sm text-gray-500">No upcoming todos</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {events
                  .filter(event => event.extendedProps.isOverdue)
                  .slice(0, 5)
                  .map(event => (
                    <div key={event.id} className="flex items-center gap-2 text-sm">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: event.backgroundColor }}
                      />
                      <span className="truncate line-through opacity-75">{event.title}</span>
                    </div>
                  ))}
                {events.filter(event => event.extendedProps.isOverdue).length === 0 && (
                  <div className="text-sm text-gray-500">No overdue todos</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
