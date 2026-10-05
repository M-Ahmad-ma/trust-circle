import { Text, View } from 'react-native';

import { scorePassword } from '@/lib/validation';

/** Segmented meter plus the two most useful notes — not a progress bar of optimism. */
type PasswordStrengthProps = {
  value: string;
};

const SEGMENTS = 4;
const ACTIVE = ['#bc7c80', '#c6821e', '#a03246', '#4a6b52'];

export function PasswordStrength({ value }: PasswordStrengthProps) {
  if (value.length === 0) return null;

  const { score, label, hints } = scorePassword(value);

  return (
    <View className="mt-2.5">
      <View className="flex-row gap-1.5">
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <View
            key={i}
            className="h-1 flex-1 rounded-pill"
            style={{ backgroundColor: i < score ? ACTIVE[score] : '#e7dcc9' }}
          />
        ))}
      </View>

      <View className="mt-2 flex-row items-center justify-between">
        <Text className="font-body-semibold text-3xs uppercase text-ink-400">{label}</Text>
        {score < 3 && (
          <Text
            numberOfLines={1}
            className="flex-1 pl-3 text-right font-body text-[10.5px] text-ink-400">
            {hints[0]}
          </Text>
        )}
      </View>
    </View>
  );
}
