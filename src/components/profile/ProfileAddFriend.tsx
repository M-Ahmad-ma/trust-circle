import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { usersApi } from '@/api';
import { hasCode, isApiError, requestIdFrom } from '@/api/errors';
import type { Relationship } from '@/api/types';

/**
 * Add-to-Circle control for someone else's profile.
 *
 * `RelationshipType` has no `pending` member, and neither `/api/users/:id` nor
 * `/api/friends/:userId/relationship` reports an open request — a pair with a
 * request in flight reads as `none`, exactly like a stranger. So the button
 * cannot be pre-disabled from data; it is shown optimistically and the server's
 * response decides the outcome. Every code it can return is handled rather than
 * collapsed into one message, because they mean different things to the reader:
 * "they already asked you" is actionable, "you are blocked" is not.
 *
 * A successful request leaves the relationship `none` on refresh, since only
 * acceptance promotes it to `direct_friend` — so the button correctly stays put,
 * now returning `REQUEST_ALREADY_SENT` if tapped again.
 */
export function ProfileAddFriend({
  userId,
  userName,
  relationship,
  onBecameFriend,
}: {
  userId: string;
  userName: string;
  relationship: Relationship | undefined;
  /** Called when the server says they are already a friend, so the caller can refresh. */
  onBecameFriend?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // The header already branches on `direct_friend` (Remove) and `self` (Edit) before
  // reaching this, so in practice only `none` and `friend_of_friend` arrive. The
  // guard stays as a contract: this component must never render an Add button for
  // someone who is already a friend, even if a future caller forgets to branch.
  if (
    relationship === undefined ||
    relationship.type === 'self' ||
    relationship.type === 'direct_friend'
  ) {
    return null;
  }

  const send = async () => {
    setBusy(true);
    setNotice(null);
    try {
      await usersApi.sendFriendRequest(userId);
      setNotice('Request sent. They will see it next time they open the app.');
    } catch (error) {
      if (hasCode(error, 'REQUEST_ALREADY_SENT')) {
        setNotice('Request sent. They will see it next time they open the app.');
      } else if (hasCode(error, 'REQUEST_ALREADY_RECEIVED')) {
        setNotice(
          requestIdFrom(error)
            ? 'They have already sent you a request — accept it from your Circle screen.'
            : 'That request could not be sent.'
        );
      } else if (hasCode(error, 'ALREADY_FRIENDS')) {
        setNotice('You are already in their circle.');
        onBecameFriend?.();
      } else if (hasCode(error, 'BLOCKED') || hasCode(error, 'YOU_BLOCKED_THEM')) {
        setNotice('You cannot connect with this person.');
      } else if (isApiError(error)) {
        setNotice(error.message);
      } else {
        setNotice('That request could not be sent. Try again in a moment.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="px-7 pb-5">
      <Pressable
        onPress={() => void send()}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={`${'Add to Circle'} ${userName}`}
        accessibilityState={{ disabled: busy, busy }}
        className="h-11 items-center justify-center rounded-[12px] border border-primary-600 active:bg-rose-100"
        style={{ opacity: busy ? 0.5 : 1 }}>
        <Text className="font-body-semibold text-[14px] text-primary-600">
          {busy ? '…' : 'Add to Circle'}
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
