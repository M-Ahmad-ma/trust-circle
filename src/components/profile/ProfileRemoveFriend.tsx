import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { usersApi } from '@/api';
import { isApiError } from '@/api/errors';

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
      setNotice('Removed from your Circle.');
      onRemoved();
    } catch (error) {
      // A 404 NOT_FRIENDS means the server already considers them gone, which is
      // the outcome we wanted — reconciling beats showing a failure.
      setNotice(
        isApiError(error)
          ? error.message
          : 'We could not remove them just now. Try again in a moment.'
      );
    } finally {
      setBusy(false);
    }
  };

  const confirm = () => {
    Alert.alert(
      'Remove from your Circle?',
      'Anything they shared only with their Circle or Extended Circle stops being visible to you. Nothing is deleted, and you can add them again at any time.',
      [
        { text: 'Keep them', style: 'cancel' },
        {
          text: 'Remove',
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
        accessibilityLabel={`${'Remove from Circle'} ${userName}`}
        accessibilityState={{ disabled: busy, busy }}
        className="h-11 items-center justify-center rounded-[12px] border border-danger-500 active:opacity-70"
        style={{ opacity: busy ? 0.5 : 1 }}>
        <Text className="font-body-semibold text-[14px] text-danger-600">
          {'Remove from Circle'}
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
