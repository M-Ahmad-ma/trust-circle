import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function toKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function sameDay(a: string, b: string) {
  return a === b;
}

type VisitCalendarProps = {
  /** ISO `YYYY-MM-DD`. */
  value: string | null;
  onChange: (iso: string) => void;
  /** Today, injected so the component stays testable. */
  today?: Date;
};

/**
 * A month grid drawn in the app's own language — hairline rules, letterspaced
 * caps — rather than the platform picker, which would break the editorial tone
 * and cannot show why a date matters.
 */
export function VisitCalendar({ value, onChange, today = new Date() }: VisitCalendarProps) {
  const [cursor, setCursor] = useState(() => {
    const base = value ? new Date(`${value}T00:00:00`) : today;
    return { year: base.getFullYear(), month: base.getMonth() };
  });

  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());

  const grid = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    // Monday-first: getDay() is Sunday=0, so shift it.
    const leading = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();

    const cells: (number | null)[] = [
      ...Array.from({ length: leading }, () => null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    // Pad the final row so the grid keeps a rectangle shape.
    while (cells.length % 7 !== 0) cells.push(null);

    return cells;
  }, [cursor]);

  const shift = (delta: number) => {
    setCursor((current) => {
      const next = new Date(current.year, current.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  const atCurrentMonth = cursor.year === today.getFullYear() && cursor.month === today.getMonth();

  return (
    <View>
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={() => shift(-1)}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          disabled={atCurrentMonth}
          hitSlop={10}
          className={`h-9 w-9 items-center justify-center rounded-pill ${
            atCurrentMonth ? 'opacity-25' : 'active:opacity-60'
          }`}>
          <Text className="font-display text-[20px] text-ink-700">‹</Text>
        </Pressable>

        <Text className="font-display-semibold text-[16px] text-ink-900">
          {MONTHS[cursor.month]} {cursor.year}
        </Text>

        <Pressable
          onPress={() => shift(1)}
          accessibilityRole="button"
          accessibilityLabel="Next month"
          hitSlop={10}
          className="h-9 w-9 items-center justify-center rounded-pill active:opacity-60">
          <Text className="font-display text-[20px] text-ink-700">›</Text>
        </Pressable>
      </View>

      <View className="mt-4 flex-row">
        {WEEKDAYS.map((day, i) => (
          <Text
            key={`${day}-${i}`}
            className="flex-1 text-center font-body-semibold text-3xs uppercase text-ink-300">
            {day}
          </Text>
        ))}
      </View>

      <View className="mt-2 flex-row flex-wrap">
        {grid.map((day, index) => {
          if (day === null)
            return <View key={`pad-${index}`} style={{ width: `${100 / 7}%`, height: 44 }} />;

          const key = toKey(cursor.year, cursor.month, day);
          const selected = value !== null && sameDay(key, value);
          const isToday = sameDay(key, todayKey);
          const future = key > todayKey;

          return (
            <Pressable
              key={key}
              onPress={() => !future && onChange(key)}
              disabled={future}
              accessibilityRole="button"
              accessibilityLabel={`${day} ${MONTHS[cursor.month]} ${cursor.year}`}
              accessibilityState={{ selected, disabled: future }}
              style={{ width: `${100 / 7}%`, height: 44 }}
              className="items-center justify-center">
              <View
                className="h-9 w-9 items-center justify-center rounded-pill"
                style={{
                  backgroundColor: selected ? '#a03246' : 'transparent',
                  borderWidth: isToday && !selected ? 1 : 0,
                  borderColor: '#a03246',
                }}>
                <Text
                  className="font-body-medium text-[13px]"
                  style={{
                    color: selected ? '#fdfaf4' : future ? '#c9bda2' : '#342d27',
                  }}>
                  {day}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function formatVisitDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** "3 days ago" / "in September 2026", used in the preview. */
export function relativeVisit(iso: string, today = new Date()): string {
  const then = new Date(`${iso}T00:00:00`);
  const days = Math.round((today.getTime() - then.getTime()) / 86_400_000);

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 31) return `${Math.floor(days / 7)} week${days < 14 ? '' : 's'} ago`;

  return MONTHS[then.getMonth()].slice(0, 3);
}
