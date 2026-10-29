import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';

type CircleHeaderProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
  actionIcon?: ComponentProps<typeof MaterialCommunityIcons>['name'];
};

export function CircleHeader({
  eyebrow,
  title,
  subtitle,
  actionLabel,
  onAction,
  actionIcon = 'account-multiple-outline',
}: CircleHeaderProps) {
  return (
    <View className="flex-row items-start justify-between px-4 pt-2">
      <View className="flex-1 pr-3">
        <Text className="font-body-semibold text-2xs uppercase text-ink-400">{eyebrow}</Text>
        <Text className="mt-1.5 font-display text-[30px] leading-9 text-ink-800">{title}</Text>
        <Text className="mt-2 font-body text-[12px] leading-[17px] text-ink-500">{subtitle}</Text>
      </View>

      {/* The full friends hub — requests, suggestions and the people already in
          your Circle — is one tap away rather than folded into this summary. */}
      <Pressable
        onPress={onAction}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        className="mt-1 flex-row items-center gap-1.5 rounded-pill bg-primary-600 px-3 py-2 active:opacity-90"
        style={{
          shadowColor: '#7e2534',
          shadowOpacity: 0.28,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 3,
        }}>
        <MaterialCommunityIcons name={actionIcon} size={15} color="#fdfaf4" />
        <Text className="font-body-semibold text-[11px] text-primary-fg">{actionLabel}</Text>
      </Pressable>
    </View>
  );
}
