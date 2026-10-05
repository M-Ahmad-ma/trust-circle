import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
  ImageSourcePropType,
} from 'react-native';

type HeroCarouselProps = {
  photos: ImageSourcePropType[];
  height: number;
  /** Status-bar / notch height, so the floating controls clear it. */
  topInset: number;
  saved: boolean;
  onToggleSave: () => void;
  onShare: () => void;
  onBack: () => void;
  style?: StyleProp<ViewStyle>;
};

const CONTROL = {
  backgroundColor: 'rgba(253, 250, 244, 0.94)',
  shadowColor: '#1c1815',
  shadowOpacity: 0.22,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 4,
} as const;

function CircleControl({
  icon,
  label,
  onPress,
  tone = 'dark',
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  onPress: () => void;
  tone?: 'dark' | 'berry';
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="h-10 w-10 items-center justify-center rounded-pill active:opacity-70"
      style={CONTROL}>
      <MaterialCommunityIcons
        name={icon}
        size={19}
        color={tone === 'berry' ? '#a03246' : '#342d27'}
      />
    </Pressable>
  );
}

export function HeroCarousel({
  photos,
  height,
  topInset,
  saved,
  onToggleSave,
  onShare,
  onBack,
  style,
}: HeroCarouselProps) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(next);
  };

  return (
    <View style={[{ height }, style]}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        // Keeps offscreen photos mounted so paging never flashes an empty frame.
        style={{ height }}
        className="grow-0">
        {photos.map((source, i) => (
          <Image
            key={`hero-${i}`}
            source={source}
            style={{ width, height }}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        ))}
      </ScrollView>

      {/* Scrim so the dots stay legible over a bright frame. */}
      <LinearGradient
        colors={['rgba(28,24,21,0)', 'rgba(28,24,21,0.10)', 'rgba(28,24,21,0.52)']}
        locations={[0, 0.55, 1]}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 96 }}
        pointerEvents="none"
      />

      <View className="absolute left-4" style={{ top: topInset + 10 }}>
        <CircleControl icon="arrow-left" label="Go back" onPress={onBack} />
      </View>

      <View className="absolute right-4 flex-row gap-2.5" style={{ top: topInset + 10 }}>
        <CircleControl
          icon={saved ? 'bookmark' : 'bookmark-outline'}
          label={saved ? 'Remove from saved' : 'Save place'}
          onPress={onToggleSave}
          tone="berry"
        />
        <CircleControl icon="share-variant" label="Share place" onPress={onShare} />
      </View>

      <View
        className="absolute bottom-4 left-0 right-0 flex-row items-center justify-center gap-1.5"
        pointerEvents="none">
        {photos.map((_, i) => (
          <View
            key={`dot-${i}`}
            className="h-1.5 rounded-pill"
            style={{
              width: i === index ? 18 : 6,
              backgroundColor: i === index ? '#fdfaf4' : 'rgba(253, 250, 244, 0.5)',
            }}
          />
        ))}
      </View>
    </View>
  );
}
