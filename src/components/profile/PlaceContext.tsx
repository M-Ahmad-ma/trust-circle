import { Pressable, Text, View } from 'react-native';

type PlaceContextProps = {
  placeName: string;
  neighbourhood: string;
  time: string;
  onPress: () => void;
};

/** Grey pill + timestamp that heads each review, tying it back to a place. */
export function PlaceContext({ placeName, neighbourhood, time, onPress }: PlaceContextProps) {
  return (
    <View className="flex-row items-center justify-between px-6 pb-2.5 pt-4">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${placeName}, ${neighbourhood}`}
        className="flex-row items-center gap-2 rounded-pill bg-chip px-3 py-1.5 active:opacity-70">
        <View className="h-2 w-2 rounded-pill bg-primary-600" />
        <Text numberOfLines={1} className="font-body-medium text-[12.5px] text-ink-800">
          {placeName}
        </Text>
      </Pressable>

      <Text className="font-body text-[12.5px] text-ink-400">{time}</Text>
    </View>
  );
}
