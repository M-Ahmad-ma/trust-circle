import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { MonogramStack } from '@/components/MonogramStack';
import type { Member } from '@/types';

type CircleVisitedCardProps = {
  people: Member[];
  eyebrow: string;
  visitedRecently: string;
  ctaLabel: string;
  onPress: () => void;
};

/** "Bilal, Sana and Daniyal" — two names then "and X" for longer circles. */
function nameList(people: Member[]) {
  const first = people.map((person) => person.name.split(' ')[0]);
  if (first.length <= 1) return first.join('');
  if (first.length === 2) return `${first[0]} and ${first[1]}`;
  return `${first.slice(0, -1).join(', ')} and ${first[first.length - 1]}`;
}

export function CircleVisitedCard({
  people,
  eyebrow,
  visitedRecently,
  ctaLabel,
  onPress,
}: CircleVisitedCardProps) {
  const count = people.length;
  const noun = count === 1 ? 'friend' : 'friends';

  return (
    <View className="mx-4 mt-6 rounded-card bg-rose-200 p-4">
      <Text className="font-body-semibold text-2xs uppercase text-primary-500">{eyebrow}</Text>

      <Text className="mt-2 font-display-semibold text-[18px] text-ink-800">
        {count} {noun} visited
      </Text>

      <View className="mt-3.5 flex-row items-center gap-3">
        <MonogramStack people={people} size={30} max={4} ringColor="#f7e3e5" />
        <View className="flex-1">
          <Text numberOfLines={1} className="font-body-semibold text-[12px] text-ink-800">
            {nameList(people)}
          </Text>
          <Text className="mt-0.5 font-body text-[12px] text-ink-500">{visitedRecently}</Text>
        </View>
      </View>

      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        className="mt-4 flex-row items-center gap-1 self-start active:opacity-60">
        <Text className="font-body-semibold text-[12px] text-primary-600">{ctaLabel}</Text>
        <MaterialCommunityIcons name="chevron-right" size={15} color="#a03246" />
      </Pressable>
    </View>
  );
}
