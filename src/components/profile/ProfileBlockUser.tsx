import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { usersApi } from '@/api';
import { hasCode, isApiError } from '@/api/errors';
import { peopleCopy, profileCopyApi } from '@/data';

type ProfileBlockUserProps = {
  userId: string;
  userName: string;
  /**
   * Blocking hides the profile (GET /users/:id 404s), so the caller must leave
   * this screen afterwards — refetching it would land on the empty profile state
   * and read like the block had failed.
   */
  onBlocked: () => void;
};

/**
 * README §8 — blocking, which the API already supported and nothing exposed.
 *
 * Blocking is directed and destructive to the relationship: the server replaces
 * any friendship or pending request in *either* direction with a single block
 * row, so it silently unfriends the person too. That is worth stating plainly in
 * the confirmation rather than leaving the user to discover it.
 *
 * There is no "unblock" here on purpose. Once blocked, the profile 404s, so this
 * control cannot be rendered again for that pair — unblocking lives in Settings →
 * Blocked people, which is the only place the state is observable.
 */
export function ProfileBlockUser({ userId, userName, onBlocked }: ProfileBlockUserProps) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setNotice(null);
    try {
      await usersApi.blockUser(userId);
      onBlocked();
    } catch (error) {
      if (hasCode(error, 'SELF_BLOCK')) setNotice(profileCopyApi.blockSelf);
      else setNotice(isApiError(error) ? error.message : peopleCopy.blockFailed);
      setBusy(false);
    }
  };

  const confirm = () => {
    Alert.alert(
      profileCopyApi.blockConfirmTitle,
      profileCopyApi.blockConfirmBody.replace('{name}', userName),
      [
        { text: profileCopyApi.blockCancel, style: 'cancel' },
        {
          text: profileCopyApi.blockConfirmAction,
          style: 'destructive',
          onPress: () => void run(),
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View className="px-7 pb-5">
      <Pressable
        onPress={confirm}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={`${profileCopyApi.blockUser} ${userName}`}
        accessibilityState={{ disabled: busy, busy }}
        className="h-10 items-center justify-center rounded-[12px] active:opacity-70"
        style={{ opacity: busy ? 0.5 : 1 }}>
        <Text className="font-body-medium text-[12.5px] text-ink-400">
          {busy ? '…' : profileCopyApi.blockUser}
        </Text>
      </Pressable>

      {notice && (
        <View className="mt-2 rounded-card bg-accent-50 p-3">
          <Text className="font-body text-[12px] leading-[18px] text-accent-700">{notice}</Text>
        </View>
      )}
    </View>
  );
}
