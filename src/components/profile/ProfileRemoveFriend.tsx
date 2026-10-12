import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { usersApi } from '@/api';
import { isApiError } from '@/api/errors';
import { profileCopyApi } from '@/data';

/**
 * Remove-from-Circle control, shown only while the viewer is a direct friend.
 *
 * The server deletes the friendship row outright (`DELETE /api/friends/:userId`),
 * which is one-directional — their experiences do not disappear, but anything they
 * scoped to `circle` or `extended` does, because visibility is resolved per
 * requester. Hence the confirmation copy: the consequence is real but reversible,
 * and the reader deserves to know it is reversible before agreeing.
 *
 * On success the relationship drops back to `none`, so `onRemoved` must refetch —
 * that is what turns this button back into "Add to Circle".
 */
export function ProfileRemoveFriend({
  userId,
  userName,
  onRemoved,
}: {
  userId: string;
  userName: string;
  onRemoved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const remove = async () => {
    setBusy(true);
    setNotice(null);
    try {
      await usersApi.removeFriend(userId);
      setNotice(profileCopyApi.removed);
      onRemoved();
    } catch (error) {
      // A 404 NOT_FRIENDS means the server already considers them gone, which is
      // the outcome we wanted — reconciling beats showing a failure.
      setNotice(isApiError(error) ? error.message : profileCopyApi.removeFailed);
    } finally {
      setBusy(false);
    }
  };

  const confirm = () => {
    Alert.alert(
      profileCopyApi.removeConfirmTitle,
      profileCopyApi.removeConfirmBody,
      [
        { text: profileCopyApi.removeCancel, style: 'cancel' },
        {
          text: profileCopyApi.removeConfirmAction,
          style: 'destructive',
          onPress: () => void remove(),
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
        accessibilityLabel={`${profileCopyApi.removeFromCircle} ${userName}`}
        accessibilityState={{ disabled: busy, busy }}
        className="h-11 items-center justify-center rounded-[12px] border border-danger-500 active:opacity-70"
        style={{ opacity: busy ? 0.5 : 1 }}>
        <Text className="font-body-semibold text-[14px] text-danger-600">
          {profileCopyApi.removeFromCircle}
        </Text>
      </Pressable>

      {notice && (
        <View className="mt-3 rounded-card bg-accent-50 p-3">
          <Text className="font-body text-[12px] leading-[18px] text-accent-700">{notice}</Text>
        </View>
      )}
    </View>
  );
}
