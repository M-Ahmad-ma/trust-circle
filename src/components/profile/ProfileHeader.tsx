import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { ProfileAddFriend } from '@/components/profile/ProfileAddFriend';
import { ProfileBlockUser } from '@/components/profile/ProfileBlockUser';
import { ProfileRemoveFriend } from '@/components/profile/ProfileRemoveFriend';
import { RelationshipBadge } from '@/components/write/Relationship';
import type { Relationship } from '@/api/types';

const AVATAR = 112;

type ProfileHeaderProps = {
  userId: string;
  name: string;
  bio: string | null;
  avatarPath: string | null;
  relationship: Relationship | undefined;
  isSelf: boolean;
  stats: { experiences: number; friends: number };
  editLabel: string;
  onEdit: () => void;
  onBecameFriend?: () => void;
  /** Self only — opens the full friends hub from the Circle count. */
  onOpenFriends?: () => void;
  /** Called after a successful block — the profile is about to become a 404. */
  onBlocked?: () => void;
};

export function ProfileHeader({
  userId,
  name,
  bio,
  avatarPath,
  relationship,
  isSelf,
  stats,
  editLabel,
  onEdit,
  onBecameFriend,
  onOpenFriends,
  onBlocked,
}: ProfileHeaderProps) {
  return (
    <View className="bg-paper-50">
      <View className="items-center px-7 pt-5">
        <Avatar
          user={{ id: name, name, avatarPath }}
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
        <Stat label="Circle" value={stats.friends} showDivider onPress={onOpenFriends} />
      </View>

      {isSelf ? (
        <View className="px-7 pb-5">
          <Pressable
            onPress={onEdit}
            accessibilityRole="button"
            accessibilityLabel={editLabel}
            className="h-11 items-center justify-center rounded-[12px] border border-primary-600 active:bg-rose-100">
            <Text className="font-body-semibold text-[14px] text-primary-600">{editLabel}</Text>
          </Pressable>
        </View>
      ) : relationship?.type === 'direct_friend' ? (
        <ProfileRemoveFriend
          userId={userId}
          userName={name}
          onRemoved={onBecameFriend ?? (() => {})}
        />
      ) : (
        <ProfileAddFriend
          userId={userId}
          userName={name}
          relationship={relationship}
          onBecameFriend={onBecameFriend}
        />
      )}

      {/* Everyone but yourself. Block is last and quiet — a safety control, not
          a primary action, and directly under the fold invites accidents. */}
      {!isSelf && (
        <ProfileBlockUser userId={userId} userName={name} onBlocked={onBlocked ?? (() => {})} />
      )}
    </View>
  );
}

function Stat({
  label,
  value,
  showDivider,
  onPress,
}: {
  label: string;
  value: number;
  showDivider: boolean;
  onPress?: () => void;
}) {
  const body = (
    <View className="items-center">
      <Text className="font-body text-[11px] text-ink-400">{label}</Text>
      <View className="mt-1 flex-row items-center gap-0.5">
        <Text className="font-body-bold text-[20px] text-ink-900">{value}</Text>
        {onPress && <MaterialCommunityIcons name="chevron-right" size={13} color="#b8a37c" />}
      </View>
    </View>
  );

  return (
    <View className="flex-1 flex-row items-center justify-center">
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`Open ${label.toLowerCase()}`}
          className="items-center rounded-card px-2 py-1 active:opacity-60">
          {body}
        </Pressable>
      ) : (
        body
      )}
      {showDivider && <View className="absolute left-0 h-[52px] w-px bg-hairline" />}
    </View>
  );
}

export function ProfilePlaceholder({ label }: { label: string }) {
  return (
    <View className="items-center py-6">
      <MaterialCommunityIcons name="account-outline" size={18} color="#b8a37c" />
      <Text className="mt-2 font-body text-[11.5px] text-ink-400">{label}</Text>
    </View>
  );
}
