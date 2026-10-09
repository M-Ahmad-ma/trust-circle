import { Pressable, ScrollView, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import type { AvatarUser } from '@/types';

const AVATAR = 62;
const RAIL_PADDING = 16;

type PeopleRailProps = {
  people: AvatarUser[];
  total: number;
  inCircleLabel: string;
  seeAllLabel: string;
  onSeeAll: () => void;
  onOpenPerson: (id: string) => void;
};

/**
 * Evenly spaced monogram discs with the given name beneath, rather than the
 * overlapping stack used elsewhere — a roster reads better than a pile.
 */
export function PeopleRail({
  people,
  total,
  inCircleLabel,
  seeAllLabel,
  onSeeAll,
  onOpenPerson,
}: PeopleRailProps) {
  return (
    <View className="mt-6">
      <View className="flex-row items-baseline justify-between px-4">
        <Text className="font-body text-[13px] text-ink-600">
          <Text className="font-body-bold text-[13px] text-ink-800">{total}</Text> {inCircleLabel}
        </Text>
        <Pressable onPress={onSeeAll} accessibilityRole="button" className="active:opacity-60">
          <Text className="font-body-semibold text-[12px] text-primary-600">{seeAllLabel}</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        // Without this the horizontal rail flex-grows and steals vertical space.
        className="mt-4 grow-0"
        contentContainerStyle={{ paddingHorizontal: RAIL_PADDING, gap: 12 }}>
        {people.map((person) => (
          <Pressable
            key={person.id}
            onPress={() => onOpenPerson(person.id)}
            accessibilityRole="button"
            accessibilityLabel={person.name}
            className="items-center active:opacity-70"
            style={{ width: AVATAR }}>
            <Avatar user={person} size={AVATAR} />
            <Text numberOfLines={1} className="mt-2 font-body text-[10px] text-ink-500">
              {person.name.split(' ')[0]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
