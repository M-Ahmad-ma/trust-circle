import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { Monogram } from '@/components/Monogram';
import type { Profile, ProfileStats } from '@/types';

const AVATAR = 112;

type ProfileHeaderProps = {
  profile: Profile;
  editLabel: string;
  onEdit: () => void;
};

function Stat({
  label,
  value,
  showDivider,
}: {
  label: string;
  value: number;
  showDivider: boolean;
}) {
  return (
    <View className="flex-1 flex-row items-center justify-center">
      <View className="items-center">
        <Text className="font-body text-[11px] text-ink-400">{label}</Text>
        <Text className="mt-1 font-body-bold text-[20px] text-ink-900">{value}</Text>
      </View>
      {showDivider && <View className="absolute left-0 h-[52px] w-px bg-hairline" />}
    </View>
  );
}

export function ProfileHeader({ profile, editLabel, onEdit }: ProfileHeaderProps) {
  const stats: [keyof ProfileStats, string][] = [
    ['reviews', 'Reviews'],
    ['places', 'Places'],
    ['photos', 'Photos'],
  ];

  return (
    <View className="bg-paper-50">
      <View className="items-center px-7 pt-5">
        <Monogram
          initials={profile.initials}
          tint={profile.tint}
          size={AVATAR}
          ringColor="#fdfaf4"
          ringWidth={3}
        />

        <Text className="mt-4 font-display text-[26px] leading-8 text-ink-900">{profile.name}</Text>

        <View className="mt-2 flex-row items-center">
          <MaterialCommunityIcons name="map-marker" size={13} color="#a03246" />
          <Text className="ml-1 font-body text-[13px] text-ink-400">{profile.city}</Text>
        </View>

        <Text className="mt-4 text-center font-body text-[13.5px] leading-[23px] text-ink-500">
          {profile.bio}
        </Text>
      </View>

      <View className="mt-6 h-px bg-hairline" />

      <View className="flex-row px-7 py-5">
        {stats.map(([key, label], index) => (
          <Stat key={key} label={label} value={profile.stats[key]} showDivider={index > 0} />
        ))}
      </View>

      {profile.isSelf && (
        <View className="px-7 pb-5">
          <Pressable
            onPress={onEdit}
            accessibilityRole="button"
            className="h-11 items-center justify-center rounded-[12px] border border-primary-600 active:bg-rose-100"
            style={{ backgroundColor: 'transparent' }}>
            <Text className="font-body-semibold text-[14px] text-primary-600">{editLabel}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
