import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { ActivityTone } from '@/types';

type EmptyStateProps = {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  body?: string;
  /** Optional single action, e.g. "Find a place". */
  actionLabel?: string;
  onAction?: () => void;
  /** Quieter treatment for a screen that is simply not populated yet. */
  tone?: ActivityTone;
  compact?: boolean;
};

const TONES: Record<string, string> = {
  berry: '#a03246',
  gold: '#c08a2e',
  rose: '#bc7c80',
  sand: '#b8a37c',
};

/**
 * The honest answer to "there is nothing here". Replaces fabricated content —
 * a screen with no data should say so and offer the next step, never invent
 * rows to fill the gap.
 */
export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  onAction,
  tone = 'berry',
  compact,
}: EmptyStateProps) {
  const color = TONES[tone] ?? TONES.berry;

  return (
    <View className={`items-center justify-center px-8 ${compact ? 'py-8' : 'py-16'}`}>
      <View
        className="h-14 w-14 items-center justify-center rounded-pill"
        style={{ backgroundColor: `${color}1a` }}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>

      <Text className="mt-4 text-center font-display-semibold text-[17px] text-ink-800">
        {title}
      </Text>

      {body && (
        <Text className="mt-2 max-w-[300px] text-center font-body text-[12.5px] leading-[19px] text-ink-500">
          {body}
        </Text>
      )}

      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          className="mt-5 flex-row items-center gap-1.5 rounded-pill border border-primary-600 px-4 py-2.5 active:bg-rose-100">
          <Text className="font-body-semibold text-[12.5px] text-primary-600">{actionLabel}</Text>
          <MaterialCommunityIcons name="arrow-right" size={15} color="#a03246" />
        </Pressable>
      )}
    </View>
  );
}

/** Inline spinner-free "loading" placeholder, so no screen flashes fake content. */
export function LoadingState({ label }: { label: string }) {
  return (
    <View className="items-center justify-center gap-2 px-8 py-16">
      <Text className="font-body text-[12px] text-ink-400">{label}</Text>
    </View>
  );
}

/** Error state that always offers a retry — never a blank screen. */
export function ErrorState({ label, onRetry }: { label: string; onRetry?: () => void }) {
  return (
    <View className="items-center justify-center px-8 py-16">
      <MaterialCommunityIcons name="cloud-off-outline" size={24} color="#b8a37c" />
      <Text className="mt-3 text-center font-body text-[12.5px] leading-[19px] text-ink-500">
        {label}
      </Text>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          className="mt-4 rounded-pill border border-sand-400 px-4 py-2 active:opacity-60">
          <Text className="font-body-semibold text-[12px] text-primary-600">Try again</Text>
        </Pressable>
      )}
    </View>
  );
}
