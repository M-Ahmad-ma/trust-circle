import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

type ExploreHeaderProps = {
  eyebrow: string;
  title: string;
};

/**
 * No notification bell: there is no notifications endpoint, so the control was
 * removed rather than shipped as an affordance that could never load.
 */
export function ExploreHeader({ eyebrow, title }: ExploreHeaderProps) {
  return (
    <View className="px-4 pt-1">
      <Text className="font-body-semibold text-2xs uppercase text-ink-400">{eyebrow}</Text>

      <View className="mt-1.5 flex-row items-center gap-2">
        <MaterialCommunityIcons name="map-marker-radius" size={23} color="#a03246" />
        <Text numberOfLines={1} className="font-display text-[26px] leading-8 text-ink-800">
          {title}
        </Text>
      </View>
    </View>
  );
}
