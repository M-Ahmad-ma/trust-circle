import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { RelationshipBadge } from '@/components/write/Relationship';
import type { Relationship } from '@/api/types';

const AVATAR = 112;

type ProfileHeaderProps = {
  name: string;
  bio: string | null;
  avatarPath: string | null;
  relationship: Relationship | undefined;
  isSelf: boolean;
  stats: { experiences: number; friends: number };
  editLabel: string;
  onEdit: () => void;
};

/**
 * Counts come from the API's viewer-aware `counts`. It exposes only experiences
 * and friends — there is no server-side photo or "places visited" count, so
 * those are not invented here.
 */
export function ProfileHeader({
  name,
  bio,
  avatarPath,
  relationship,
  isSelf,
  stats,
  editLabel,
  onEdit,
}: ProfileHeaderProps) {
  return (
    <View className="bg-paper-50">
      <View className="items-center px-7 pt-5">
        <Avatar
          user={{ id: name, name, coverPhoto: avatarPath }}
          size={AVATAR}
          ringColor="#fdfaf4"
          ringWidth={3}
        />

        <Text className="mt-4 font-display text-[26px] leading-8 text-ink-900">{name}</Text>

        {relationship && (
          <View className="mt-2.5">
            <RelationshipBadge relationship={relationship.type} label={relationship.label} />
          </View>
        )}

        {bio ? (
          <Text className="mt-4 text-center font-body text-[13.5px] leading-[23px] text-ink-500">
            {bio}
          </Text>
        ) : null}
      </View>

      <View className="mt-6 h-px bg-hairline" />

      <View className="flex-row px-7 py-5">
        <Stat label="Experiences" value={stats.experiences} showDivider={false} />
        <Stat label="Circle" value={stats.friends} showDivider />
      </View>

      {isSelf && (
        <View className="px-7 pb-5">
          <Pressable
            onPress={onEdit}
            accessibilityRole="button"
            accessibilityLabel={editLabel}
            className="h-11 items-center justify-center rounded-[12px] border border-primary-600 active:bg-rose-100">
            <Text className="font-body-semibold text-[14px] text-primary-600">{editLabel}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

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

/** Kept for screens that still need an icon-only affordance. */
export function ProfilePlaceholder({ label }: { label: string }) {
  return (
    <View className="items-center py-6">
      <MaterialCommunityIcons name="account-outline" size={18} color="#b8a37c" />
      <Text className="mt-2 font-body text-[11.5px] text-ink-400">{label}</Text>
    </View>
  );
}
