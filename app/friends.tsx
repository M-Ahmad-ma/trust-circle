import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usersApi } from '@/api';
import { hasCode, isApiError } from '@/api/errors';
import type { DirectoryEntry, FriendEntry, FriendRequest } from '@/api/types';
import { Avatar } from '@/components/Avatar';
import { CircleSearch } from '@/components/circle/CircleSearch';
import { EmptyState, ErrorState, LoadingState } from '@/components/EmptyState';
import { useApiQuery } from '@/lib/useApiQuery';

/**
 * The friends hub Facebook users expect: requests first, then people worth
 * asking, then the people already in your Circle with a way to remove them.
 * The Circle tab stays the summary; this screen is where the full list and the
 * actions live.
 */
export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);

  // Keep the previous rows visible while focus refetches run; returning from a
  // profile after adding or removing someone should not blank the screen.
  const friends = useApiQuery(usersApi.listFriends, {
    key: 'friends',
    errorMessage: 'We could not load your friends.',
    keepPreviousData: true,
  });

  const requests = useApiQuery(usersApi.listFriendRequests, {
    key: 'friend-requests',
    errorMessage: 'We could not load your requests.',
    keepPreviousData: true,
  });

  // The Friends screen is a directory, not a recommendation list. The Circle
  // tab keeps the shared-place ranking; this asks for everyone the viewer may
  // see, so a person with no overlapping visits is still findable here.
  const directory = useApiQuery(() => usersApi.listDirectory(100), {
    key: 'user-directory',
    errorMessage: 'We could not load people.',
    keepPreviousData: true,
  });

  const { refetch: refetchFriends } = friends;
  const { refetch: refetchRequests } = requests;
  const { refetch: refetchDirectory } = directory;

  // A profile pushed from this screen can change the relationship. Refetch on
  // the way back; the first focus is skipped because mount already fetched.
  const hasFocused = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!hasFocused.current) {
        hasFocused.current = true;
        return;
      }
      refetchFriends();
      refetchRequests();
      refetchDirectory();
    }, [refetchFriends, refetchRequests, refetchDirectory])
  );

  const needle = search.trim().toLowerCase();
  const matches = (user: { name: string; bio: string | null }) =>
    !needle ||
    user.name.toLowerCase().includes(needle) ||
    (user.bio ?? '').toLowerCase().includes(needle);

  const friendEntries = (friends.data ?? []).filter((entry) => matches(entry.user));
  const incoming = (requests.data?.incoming ?? []).filter((request) => matches(request.user));

  const friendIds = new Set((friends.data ?? []).map((entry) => entry.user.id));
  const incomingIds = new Set((requests.data?.incoming ?? []).map((request) => request.user.id));
  const outgoingIds = new Set((requests.data?.outgoing ?? []).map((request) => request.user.id));

  // Friends and incoming requests have their own sections above. Everyone else
  // is the full directory minus those two groups; outgoing requests stay here
  // with a disabled "Requested" state so the row does not vanish.
  const peopleReady = friends.data !== null && requests.data !== null;
  const peopleError =
    friends.status === 'error'
      ? friends.message
      : requests.status === 'error'
        ? requests.message
        : null;
  const everyoneElse = peopleReady
    ? (directory.data ?? []).filter(
      (entry) =>
        !friendIds.has(entry.user.id) && !incomingIds.has(entry.user.id) && matches(entry.user)
    )
    : [];

  const sendRequest = async (entry: DirectoryEntry) => {
    const { id, name } = entry.user;
    setRequestingId(id);
    setNotice(null);
    try {
      await usersApi.sendFriendRequest(id);
      setNotice(`Request sent to ${name}.`);
      // The row stays in the directory; refetching the requests turns it into
      // "Requested" without making the person disappear from the list.
      refetchRequests();
    } catch (error) {
      if (hasCode(error, 'REQUEST_ALREADY_SENT')) {
        setNotice(`You already sent ${name} a request.`);
        refetchRequests();
      } else if (hasCode(error, 'ALREADY_FRIENDS')) {
        setNotice(`${name} is already in your Circle.`);
        refetchFriends();
        refetchDirectory();
      } else if (hasCode(error, 'REQUEST_ALREADY_RECEIVED')) {
        setNotice(`${name} already asked to join your Circle — answer the request above.`);
        refetchRequests();
      } else if (hasCode(error, 'BLOCKED') || hasCode(error, 'YOU_BLOCKED_THEM')) {
        setNotice('You cannot connect with this person.');
        refetchDirectory();
      } else if (isApiError(error)) {
        setNotice(error.message);
      } else {
        setNotice('That request could not be sent. Try again in a moment.');
      }
    } finally {
      setRequestingId(null);
    }
  };

  const remove = async (entry: FriendEntry) => {
    setRemovingId(entry.user.id);
    setNotice(null);
    try {
      await usersApi.removeFriend(entry.user.id);
      setNotice(`${entry.user.name} is no longer in your Circle.`);
      refetchFriends();
      // The directory still contains them; refetching updates the relationship
      // label now that the accepted row is gone.
      refetchDirectory();
    } catch (error) {
      if (hasCode(error, 'NOT_FRIENDS')) {
        setNotice(`${entry.user.name} is no longer in your Circle.`);
        refetchFriends();
      } else if (isApiError(error)) {
        setNotice(error.message);
      } else {
        setNotice('We could not remove them just now. Try again in a moment.');
      }
    } finally {
      setRemovingId(null);
    }
  };

  const confirmRemove = (entry: FriendEntry) => {
    Alert.alert(
      'Remove friend?',
      `${entry.user.name} will leave your Circle. Anything they shared only with Circle or Extended Circle stops being visible to you. You can add them again later.`,
      [
        { text: 'Keep them', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => void remove(entry) },
      ],
      { cancelable: true }
    );
  };

  const respond = async (request: FriendRequest, accept: boolean) => {
    setActingOn(request.requestId);
    setNotice(null);
    try {
      if (accept) await usersApi.acceptFriendRequest(request.requestId);
      else await usersApi.rejectFriendRequest(request.requestId);

      setNotice(
        accept
          ? `${request.user.name} is now in your Circle.`
          : `Request from ${request.user.name} declined.`
      );
      refetchRequests();
      if (accept) {
        refetchFriends();
        refetchDirectory();
      }
    } catch (error) {
      if (isApiError(error)) setNotice(error.message);
      else setNotice('That request could not be updated. Try again in a moment.');
      refetchRequests();
    } finally {
      setActingOn(null);
    }
  };

  return (
    <View className="flex-1 bg-paper-100">
      <View
        className="flex-row items-center justify-between border-b border-hairline bg-paper-50 px-5"
        style={{ paddingTop: insets.top, height: insets.top + 52 }}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.navigate('/circles'))}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={10}
          className="h-10 w-10 items-center justify-center active:opacity-60">
          <MaterialCommunityIcons name="chevron-left" size={24} color="#342d27" />
        </Pressable>
        <Text className="font-body-semibold text-3xs uppercase text-ink-400">Friends</Text>
        <Pressable
          onPress={() => router.push('/profile/search')}
          accessibilityRole="button"
          accessibilityLabel="Search people by name"
          hitSlop={10}
          className="h-10 w-10 items-center justify-center active:opacity-60">
          <MaterialCommunityIcons name="account-search-outline" size={21} color="#342d27" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <View className="px-5 pt-6">
          <Text className="font-display text-[28px] leading-9 text-ink-900">Friends</Text>
          <Text className="mt-2 max-w-[320px] font-body text-[12.5px] leading-[19px] text-ink-500">
            Everyone on Trust Circle, and the people already in your Circle.
          </Text>
        </View>

        <CircleSearch
          value={search}
          placeholder="Search friends or people"
          onChange={setSearch}
          className="mx-5 mt-5 flex-row items-center rounded-pill border border-border bg-paper-50 px-4"
        />

        {notice && (
          <View className="mx-5 mt-4 rounded-card bg-accent-50 p-3.5">
            <Text className="font-body text-[12px] leading-[18px] text-accent-700">{notice}</Text>
          </View>
        )}

        {incoming.length > 0 && (
          <Section
            title={`Requests · ${incoming.length}`}
            subtitle="People who want to join your Circle.">
            {incoming.map((request) => {
              const busy = actingOn === request.requestId;

              return (
                <View
                  key={request.requestId}
                  className="flex-row items-center gap-2.5 rounded-card border border-hairline bg-paper-50 p-3">
                  <Pressable
                    onPress={() => router.push(`/profile/${request.user.id}`)}
                    accessibilityRole="button"
                    className="flex-1 flex-row items-center gap-3 active:opacity-60">
                    <Avatar user={request.user} size={44} />
                    <View className="flex-1">
                      <Text
                        numberOfLines={1}
                        className="font-body-semibold text-[13px] text-ink-900">
                        {request.user.name}
                      </Text>
                      <Text className="mt-0.5 font-body text-[10.5px] text-ink-400">
                        wants to join your Circle
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={() => void respond(request, true)}
                    disabled={busy}
                    accessibilityRole="button"
                    accessibilityLabel={`Accept ${request.user.name}`}
                    accessibilityState={{ disabled: busy, busy }}
                    className="rounded-pill bg-primary-600 px-3 py-1.5 active:opacity-70"
                    style={{ opacity: busy ? 0.5 : 1 }}>
                    <Text className="font-body-semibold text-[10.5px] text-primary-fg">Accept</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => void respond(request, false)}
                    disabled={busy}
                    accessibilityRole="button"
                    accessibilityLabel={`Decline ${request.user.name}`}
                    accessibilityState={{ disabled: busy, busy }}
                    className="rounded-pill border border-border px-3 py-1.5 active:opacity-70"
                    style={{ opacity: busy ? 0.5 : 1 }}>
                    <Text className="font-body-medium text-[10.5px] text-ink-600">Decline</Text>
                  </Pressable>
                </View>
              );
            })}
          </Section>
        )}

        <Section title="All people" subtitle="Everyone on Trust Circle you haven't added yet.">
          {!peopleReady &&
            (peopleError ? (
              <ErrorState
                label={peopleError}
                onRetry={() => {
                  refetchFriends();
                  refetchRequests();
                }}
              />
            ) : (
              <LoadingState label="Loading people…" />
            ))}

          {peopleReady && directory.status === 'loading' && directory.data === null && (
            <LoadingState label="Loading people…" />
          )}

          {peopleReady && directory.status === 'error' && directory.data === null && (
            <ErrorState label={directory.message} onRetry={refetchDirectory} />
          )}

          {peopleReady && directory.data !== null && everyoneElse.length === 0 && (
            <EmptyState
              icon="account-multiple-outline"
              tone="sand"
              compact
              title={needle ? `Nobody matches “${search.trim()}”` : 'No other people yet'}
              body={needle ? undefined : 'When someone joins Trust Circle, they will show up here.'}
            />
          )}

          {everyoneElse.map((entry) => {
            const busy = requestingId === entry.user.id;
            const requested = outgoingIds.has(entry.user.id);
            const reason =
              entry.relationship.type === 'friend_of_friend'
                ? 'In your Extended Circle'
                : entry.user.bio || 'On Trust Circle';

            return (
              <View
                key={entry.user.id}
                className="flex-row items-center gap-3 rounded-card border border-hairline bg-paper-50 p-3">
                <Pressable
                  onPress={() => router.push(`/profile/${entry.user.id}`)}
                  accessibilityRole="button"
                  className="flex-1 flex-row items-center gap-3 active:opacity-60">
                  <Avatar user={entry.user} size={44} />
                  <View className="flex-1">
                    <Text numberOfLines={1} className="font-body-semibold text-[13px] text-ink-900">
                      {entry.user.name}
                    </Text>
                    {reason ? (
                      <Text
                        numberOfLines={1}
                        className="mt-0.5 font-body text-[10.5px] text-ink-400">
                        {reason}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>

                {requested ? (
                  <View
                    accessibilityLabel={`Request already sent to ${entry.user.name}`}
                    className="rounded-pill border border-border px-3 py-1.5"
                    style={{ opacity: 0.7 }}>
                    <Text className="font-body-semibold text-[10.5px] text-ink-400">Requested</Text>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => void sendRequest(entry)}
                    disabled={busy}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${entry.user.name} as a friend`}
                    accessibilityState={{ disabled: busy, busy }}
                    className="rounded-pill border border-primary-600 px-3 py-1.5 active:bg-rose-100"
                    style={{ opacity: busy ? 0.5 : 1 }}>
                    <Text className="font-body-semibold text-[10.5px] text-primary-600">
                      {busy ? '…' : 'Add'}
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </Section>

        <Section
          title={`Your friends${friends.data ? ` · ${friends.data.length}` : ''}`}
          subtitle="Remove someone to take them out of your Circle.">
          {friends.status === 'loading' && friends.data === null && (
            <LoadingState label="Loading your friends…" />
          )}

          {friends.status === 'error' && friends.data === null && (
            <ErrorState label={friends.message} onRetry={refetchFriends} />
          )}

          {friends.data !== null && friendEntries.length === 0 && (
            <EmptyState
              icon="account-multiple-outline"
              tone="sand"
              compact
              title={needle ? `Nobody matches “${search.trim()}”` : 'No friends yet'}
              body={needle ? undefined : 'Add someone from All people above, or search by name.'}
              {...(needle
                ? {}
                : {
                  actionLabel: 'Search by name',
                  onAction: () => router.push('/profile/search'),
                })}
            />
          )}

          {friendEntries.map((entry) => {
            const busy = removingId === entry.user.id;
            const since = new Date(entry.friendsSince).toLocaleDateString(undefined, {
              month: 'short',
              year: 'numeric',
            });

            return (
              <View
                key={entry.user.id}
                className="flex-row items-center gap-3 rounded-card border border-hairline bg-paper-50 p-3">
                <Pressable
                  onPress={() => router.push(`/profile/${entry.user.id}`)}
                  accessibilityRole="button"
                  className="flex-1 flex-row items-center gap-3 active:opacity-60">
                  <Avatar user={entry.user} size={44} />
                  <View className="flex-1">
                    <Text numberOfLines={1} className="font-body-semibold text-[13px] text-ink-900">
                      {entry.user.name}
                    </Text>
                    <Text numberOfLines={1} className="mt-0.5 font-body text-[10.5px] text-ink-400">
                      Friends since {since}
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => confirmRemove(entry)}
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${entry.user.name} from your friends`}
                  accessibilityState={{ disabled: busy, busy }}
                  className="rounded-pill border border-danger-500 px-3 py-1.5 active:opacity-70"
                  style={{ opacity: busy ? 0.5 : 1 }}>
                  <Text className="font-body-semibold text-[10.5px] text-danger-600">
                    {busy ? '…' : 'Remove'}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <View className="mt-8">
      <View className="px-5">
        <Text className="font-display-semibold text-[18px] text-ink-900">{title}</Text>
        {subtitle ? (
          <Text className="mt-1 font-body text-[11.5px] leading-[17px] text-ink-400">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View className="mt-3 gap-2.5 px-5">{children}</View>
    </View>
  );
}
