import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

type ExploreHeaderProps = {
  eyebrow: string;
  title: string;
  onOpenAlerts: () => void;
  unreadAlerts: number;
};

export function ExploreHeader({ eyebrow, title, onOpenAlerts, unreadAlerts }: ExploreHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-4 pt-1">
      <View className="flex-1 pr-3">
        <Text className="font-body-semibold text-2xs uppercase text-ink-400">{eyebrow}</Text>

        <View className="mt-1.5 flex-row items-center gap-2">
          <MaterialCommunityIcons name="map-marker-radius" size={23} color="#8e2c39" />
          <Text numberOfLines={1} className="font-display text-[26px] leading-8 text-ink-800">
            {title}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onOpenAlerts}
        accessibilityRole="button"
        accessibilityLabel={`Alerts, ${unreadAlerts} unread`}
        className="h-10 w-10 items-center justify-center rounded-pill active:opacity-60">
        <MaterialCommunityIcons name="bell-outline" size={22} color="#4a423b" />
        {unreadAlerts > 0 && (
          <View
            className="absolute right-2 top-2 h-2 w-2 rounded-pill bg-primary-600"
            style={{ borderWidth: 1.5, borderColor: '#faf5ec' }}
          />
        )}
      </Pressable>
    </View>
  );
}
