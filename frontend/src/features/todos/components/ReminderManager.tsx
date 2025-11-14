import { useMemo, useState } from 'react';
import { format, isBefore, parseISO, subMinutes } from 'date-fns';
import { Reminder, ReminderChannel } from '@/types';
import { Button } from '@/components/Button';
import { cn } from '@/utils/cn';

const presetOptions: Array<{ label: string; minutes: number }> = [
  { label: '10 minutes before', minutes: 10 },
  { label: '1 hour before', minutes: 60 },
  { label: '1 day before', minutes: 60 * 24 },
];

export interface ReminderManagerProps {
  reminders?: Reminder[];
  dueDate?: string | null;
  onCreate: (payload: { scheduledAt: string; channel: ReminderChannel }) => void;
  onUpdate: (
    reminderId: string,
    payload: Partial<{ scheduledAt: string; channel: ReminderChannel }>
  ) => void;
  onDelete: (reminderId: string) => void;
  defaultChannel?: ReminderChannel;
  disabled?: boolean;
}

export function ReminderManager({
  reminders,
  dueDate,
  onCreate,
  onUpdate,
  onDelete,
  defaultChannel = 'IN_APP',
  disabled,
}: ReminderManagerProps) {
  const [customDate, setCustomDate] = useState('');
  const [channel, setChannel] = useState<ReminderChannel>(defaultChannel);

  const sortedReminders = useMemo(() => {
    return [...(reminders ?? [])].sort((a, b) =>
      a.scheduledAt.localeCompare(b.scheduledAt)
    );
  }, [reminders]);

  const handlePresetClick = (minutes: number) => {
    if (!dueDate) return;
    const scheduled = subMinutes(parseISO(dueDate), minutes).toISOString();
    onCreate({ scheduledAt: scheduled, channel });
  };

  const handleCustomAdd = () => {
    if (!customDate) return;
    onCreate({ scheduledAt: new Date(customDate).toISOString(), channel });
    setCustomDate('');
  };

  const channelOptions: ReminderChannel[] = ['IN_APP', 'EMAIL', 'PUSH'];

  return (
    <div className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          {presetOptions.map((preset) => (
            <Button
              key={preset.minutes}
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => handlePresetClick(preset.minutes)}
              disabled={!dueDate || disabled}
            >
              {preset.label}
            </Button>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Quick presets relative to the todo due date
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          type="datetime-local"
          className="input"
          value={customDate}
          onChange={(event) => setCustomDate(event.target.value)}
          disabled={disabled}
        />
        <Button
          type="button"
          onClick={handleCustomAdd}
          disabled={!customDate || disabled}
        >
          Add custom reminder
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {channelOptions.map((option) => (
          <button
            key={option}
            type="button"
            className={cn(
              'rounded-md border px-3 py-1 text-sm capitalize transition-colors',
              channel === option
                ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-100'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
            onClick={() => setChannel(option)}
            disabled={disabled}
          >
            {option.toLowerCase()}
          </button>
        ))}
      </div>

      <div className="divide-y divide-gray-200 rounded-md border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
        {sortedReminders.length === 0 ? (
          <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
            No reminders scheduled
          </div>
        ) : (
          sortedReminders.map((reminder) => {
            const isPast = isBefore(parseISO(reminder.scheduledAt), new Date());
            const scheduledLocal = format(parseISO(reminder.scheduledAt), "yyyy-MM-dd'T'HH:mm");
            return (
              <div
                key={reminder.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-2">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium">Scheduled for</span>
                    <input
                      type="datetime-local"
                      className="input"
                      value={scheduledLocal}
                      onChange={(event) => {
                        if (!event.target.value) return;
                        onUpdate(reminder.id, {
                          scheduledAt: new Date(event.target.value).toISOString(),
                        });
                      }}
                      disabled={disabled}
                    />
                  </label>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {reminder.sent || isPast ? 'Sent' : 'Upcoming'} •{' '}
                    {isPast
                      ? 'Occurred '
                      : 'Will occur '}
                    {format(parseISO(reminder.scheduledAt), 'PPpp')}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <select
                    className="input h-10 capitalize"
                    value={reminder.channel}
                    onChange={(event) =>
                      onUpdate(reminder.id, {
                        channel: event.target.value as ReminderChannel,
                      })
                    }
                    disabled={disabled}
                  >
                    {channelOptions.map((option) => (
                      <option key={option} value={option}>
                        {option.toLowerCase()}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(reminder.id)}
                    disabled={disabled}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
