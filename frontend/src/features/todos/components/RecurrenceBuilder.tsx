import { useCallback } from 'react';
import { RecurrencePayload } from '../api';
import { cn } from '@/utils/cn';

const weekdayOptions: Array<{ value: string; label: string }> = [
  { value: 'MO', label: 'Mon' },
  { value: 'TU', label: 'Tue' },
  { value: 'WE', label: 'Wed' },
  { value: 'TH', label: 'Thu' },
  { value: 'FR', label: 'Fri' },
  { value: 'SA', label: 'Sat' },
  { value: 'SU', label: 'Sun' },
];

const frequencyOptions: Array<{
  value: RecurrencePayload['frequency'];
  label: string;
}> = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
];

export interface RecurrenceBuilderProps {
  value: RecurrencePayload | null;
  onChange: (value: RecurrencePayload | null) => void;
  disabled?: boolean;
}

export function RecurrenceBuilder({
  value,
  onChange,
  disabled,
}: RecurrenceBuilderProps) {
  const handleUpdate = useCallback(
    (partial: Partial<RecurrencePayload>) => {
      onChange({
        frequency: value?.frequency ?? 'DAILY',
        interval: value?.interval ?? 1,
        ...(value?.byWeekday ? { byWeekday: value.byWeekday } : {}),
        ...(value?.byMonthDay ? { byMonthDay: value.byMonthDay } : {}),
        ...(value?.endDate !== undefined ? { endDate: value.endDate } : {}),
        ...partial,
      });
    },
    [onChange, value]
  );

  const handleFrequencyChange = (frequency: RecurrencePayload['frequency']) => {
    const nextBase: RecurrencePayload = {
      frequency,
      interval: value?.interval ?? 1,
      ...(frequency === 'WEEKLY'
        ? { byWeekday: value?.byWeekday ?? ['MO'] }
        : {}),
      ...(frequency === 'MONTHLY'
        ? { byMonthDay: value?.byMonthDay ?? [1] }
        : {}),
      ...(value?.endDate !== undefined ? { endDate: value.endDate } : {}),
    };
    onChange(nextBase);
  };

  const toggleWeekday = (weekday: string) => {
    const current = value?.byWeekday ?? [];
    const next = current.includes(weekday)
      ? current.filter((day) => day !== weekday)
      : [...current, weekday];
    handleUpdate({ byWeekday: next });
  };

  const handleEndDateToggle = (enabled: boolean) => {
    if (!enabled) {
      const { endDate, ...rest } = value ?? {
        frequency: 'DAILY',
        interval: 1,
      };
      onChange({ ...rest });
      return;
    }
    handleUpdate({ endDate: new Date().toISOString().split('T')[0] });
  };

  const handleReset = () => {
    onChange(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold">Recurrence</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Configure how this todo repeats over time
          </p>
        </div>
        <button
          type="button"
          className="text-sm text-primary-600 hover:underline disabled:opacity-50"
          onClick={handleReset}
          disabled={!value || disabled}
        >
          Clear
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Frequency</span>
          <select
            className="input h-10"
            value={value?.frequency ?? 'DAILY'}
            onChange={(event) =>
              handleFrequencyChange(event.target.value as RecurrencePayload['frequency'])
            }
            disabled={disabled}
          >
            {frequencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Interval</span>
          <input
            type="number"
            min={1}
            className="input h-10"
            value={value?.interval ?? 1}
            onChange={(event) =>
              handleUpdate({ interval: Number.parseInt(event.target.value, 10) })
            }
            disabled={disabled}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Every {value?.interval ?? 1}{' '}
            {frequencyOptions.find((option) => option.value === value?.frequency)?.label.toLowerCase() ??
              'day'}
          </span>
        </label>
      </div>

      {value?.frequency === 'WEEKLY' && (
        <div>
          <span className="text-sm font-medium">Repeat on</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {weekdayOptions.map((weekday) => {
              const isActive = value?.byWeekday?.includes(weekday.value);
              return (
                <button
                  key={weekday.value}
                  type="button"
                  className={cn(
                    'rounded-md border px-3 py-1 text-sm transition-colors',
                    isActive
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-100'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                  onClick={() => toggleWeekday(weekday.value)}
                  disabled={disabled}
                >
                  {weekday.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {value?.frequency === 'MONTHLY' && (
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Days of the month</span>
          <input
            type="text"
            className="input"
            placeholder="e.g. 1,15"
            value={(value.byMonthDay ?? []).join(',')}
            onChange={(event) => {
              const next = event.target.value
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean)
                .map((item) => Number.parseInt(item, 10))
                .filter((num) => !Number.isNaN(num));
              handleUpdate({ byMonthDay: next });
            }}
            disabled={disabled}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Provide one or more day numbers separated by commas
          </span>
        </label>
      )}

      <div className="rounded-md border border-dashed border-gray-300 p-4 dark:border-gray-700">
        <label className="flex items-center gap-3 text-sm font-medium">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={Boolean(value?.endDate)}
            onChange={(event) => handleEndDateToggle(event.target.checked)}
            disabled={disabled}
          />
          Set end date
        </label>
        {value?.endDate && (
          <input
            type="date"
            className="mt-3 input h-10"
            value={value.endDate}
            onChange={(event) => handleUpdate({ endDate: event.target.value })}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
}
