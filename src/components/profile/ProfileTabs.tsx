import { Pressable, Text, View } from 'react-native';

import type { ProfileTab } from '@/types';

const TABS: { id: ProfileTab; label: string }[] = [
  { id: 'reviews', label: 'Reviews' },
  { id: 'places', label: 'Places' },
  { id: 'photos', label: 'Photos' },
];

const BAR_HEIGHT = 62;
const INDICATOR_WIDTH = 52;

type ProfileTabsProps = {
  active: ProfileTab;
  labels: Record<ProfileTab, string>;
  onChange: (tab: ProfileTab) => void;
};

export function ProfileTabs({ active, labels, onChange }: ProfileTabsProps) {
  return (
    <View className="border-b border-hairline bg-paper-50">
      <View className="flex-row" style={{ height: BAR_HEIGHT }}>
        {TABS.map((tab) => {
          const isActive = tab.id === active;

          return (
            <Pressable
              key={tab.id}
              onPress={() => onChange(tab.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              className="flex-1 items-center justify-center active:opacity-60">
              <Text
                className={
                  isActive
                    ? 'font-body-bold text-[14px] text-primary-600'
                    : 'font-body-medium text-[14px] text-ink-400'
                }>
                {labels[tab.id]}
              </Text>

              {/* Every tab reserves the indicator row so switching never shifts
                  the labels vertically. */}
              <View className="mt-2 h-0.5 justify-center">
                {isActive && (
                  <View
                    className="h-0.5 rounded-pill bg-primary-600"
                    style={{ width: INDICATOR_WIDTH }}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
