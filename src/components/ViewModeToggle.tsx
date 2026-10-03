import { Pressable, Text, View } from 'react-native';

import type { ViewMode } from '@/types';

const MODES: ViewMode[] = ['map', 'list'];

const LABELS: Record<ViewMode, string> = {
  map: 'Map',
  list: 'List',
};

type ViewModeToggleProps = {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
};

/**
 * Segmented map/list switch. Rendered by the screen rather than by ExploreMap so
 * it survives switching to list mode — otherwise the only control that leaves
 * map view is the control mounted inside map view.
 */
export function ViewModeToggle({ mode, onModeChange }: ViewModeToggleProps) {
  return (
    <View className="absolute inset-x-0 top-3 items-center">
      <View
        className="flex-row rounded-pill bg-paper-50 p-1"
        style={{
          shadowColor: '#1c1815',
          shadowOpacity: 0.12,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 3 },
          elevation: 3,
        }}>
        {MODES.map((value) => {
          const active = mode === value;

          return (
            <Pressable
              key={value}
              onPress={() => onModeChange(value)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              className="rounded-pill px-4 py-2"
              style={{ backgroundColor: active ? '#1c1815' : 'transparent' }}>
              <Text
                className={
                  active
                    ? 'font-body-semibold text-[12px] text-paper-50'
                    : 'font-body-medium text-[12px] text-ink-500'
                }>
                {LABELS[value]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
