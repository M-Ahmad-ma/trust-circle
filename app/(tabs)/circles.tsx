import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { usersApi } from '@/api';
import { hasCode, isApiError, requestIdFrom } from '@/api/errors';
import type { FriendEntry, FriendRequest, UserSuggestion } from '@/api/types';
import { Avatar } from '@/components/Avatar';
import { EmptyState, ErrorState, LoadingState } from '@/components/EmptyState';
import { CircleHeader } from '@/components/circle/CircleHeader';
import { CircleSearch } from '@/components/circle/CircleSearch';
import { PeopleRail } from '@/components/circle/PeopleRail';
import { Screen } from '@/components/Screen';
import { sharedPlaceReason } from '@/lib/suggestions';
import { useApiQuery } from '@/lib/useApiQuery';
import type { QueryState } from '@/lib/useApiQuery';

type SuggestionSectionProps = {
  status: QueryState<UserSuggestion[]>['status'];
  items: UserSuggestion[];
  errorMessage: string;
  onRetry: () => void;
  onBecameFriend: () => void;
};

function SuggestionSection({
  status,
  items,
  errorMessage,
  onRetry,
  onBecameFriend,
}: SuggestionSectionProps) {
  const [suggesting, setSuggesting] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const needle = search.trim().toLowerCase();
  const shown = !needle
    ? items
    : items.filter(
        (suggestion) =>
          suggestion.user.name.toLowerCase().includes(needle) ||
          (suggestion.user.bio ?? '').toLowerCase().includes(needle)
      );

  const suggest = async (user: UserSuggestion['user']) => {
    setSuggesting(user.id);
    setNotice(null);
    try {
      await usersApi.sendFriendRequest(user.id);
      onRetry();
      setNotice('Request sent. They will see it next time they open the app.');
    } catch (caught) {
      if (hasCode(caught, 'REQUEST_ALREADY_SENT')) {
        setNotice('Request sent. They will see it next time they open the app.');
      } else if (hasCode(caught, 'ALREADY_FRIENDS')) {
        setNotice('You are already in their circle.');
        onBecameFriend();
      } else if (hasCode(caught, 'REQUEST_ALREADY_RECEIVED')) {
        setNotice(
          requestIdFrom(caught)
            ? 'They have already sent you a request — accept it from your Circle screen.'
            : 'That request could not be sent.'
        );
      } else if (hasCode(caught, 'BLOCKED') || hasCode(caught, 'YOU_BLOCKED_THEM')) {
        setNotice('You cannot connect with this person.');
        // The row should not survive a block the server just confirmed. The
        // refetch is the same one used on focus, so it cannot disagree with the
        // list the user sees after leaving this screen.
        onRetry();
      } else if (isApiError(caught)) {
        setNotice(caught.message);
      } else {
        setNotice('That request could not be sent. Try again in a moment.');
      }
    } finally {
      setSuggesting(null);
    }
  };

  // A focus refetch keeps the old items while `status` is loading. They are
  // still the best thing to show — the list corrects itself when the response
  // lands, without the screen collapsing into a spinner.
  const settled = status !== 'error' && (status !== 'loading' || items.length > 0);

  return (
    <View className="mt-8 px-4">
      <Text className="font-display-semibold text-[18px] text-ink-900">People you might trust</Text>
      <Text className="mt-1.5 font-body text-[12.5px] leading-[19px] text-ink-500">
        People who have been to the same places as you. Their shared visit has to be something you
        were both allowed to see.
      </Text>

      {status === 'loading' && items.length === 0 && (
        <LoadingState label="Looking for shared places…" />
      )}

      {status === 'error' && <ErrorState label={errorMessage} onRetry={onRetry} />}

      {settled && items.length === 0 && (
        <EmptyState
          icon="account-search-outline"
          tone="sand"
          compact
          title="No shared places yet"
          body="Share an experience somewhere and the people who have been there too will show up here."
        />
      )}

      {settled && items.length > 0 && shown.length === 0 && (
        <EmptyState
          icon="account-search-outline"
          tone="sand"
          compact
          title={`Nobody matches “${search.trim()}”`}
        />
      )}

      {notice && (
        <View className="mt-3 rounded-card bg-accent-50 p-3.5">
          <Text className="font-body text-[12px] leading-[18px] text-accent-700">{notice}</Text>
        </View>
      )}

      <View className="mt-4 gap-2">
        {shown.map((suggestion) => {
          const reason = sharedPlaceReason(suggestion);
          return (
            <View
              key={suggestion.user.id}
              className="flex-row items-center gap-3 rounded-card border border-border bg-paper-50 p-3">
              <Pressable
                onPress={() => router.push(`/profile/${suggestion.user.id}`)}
                accessibilityRole="button"
                className="flex-1 flex-row items-center gap-3 active:opacity-60">
                <Avatar user={suggestion.user} size={40} />
                <View className="flex-1">
                  <Text numberOfLines={1} className="font-body-semibold text-[13px] text-ink-800">
                    {suggestion.user.name}
                  </Text>
                  {reason ? (
                    <Text numberOfLines={1} className="mt-0.5 font-body text-[11px] text-ink-400">
                      {reason}
                    </Text>
                  ) : null}
                </View>
              </Pressable>

              <Pressable
                onPress={() => void suggest(suggestion.user)}
                disabled={suggesting === suggestion.user.id}
                accessibilityRole="button"
                accessibilityLabel={`$Add ${suggestion.user.name}`}
                className="rounded-pill border border-primary-600 px-3 py-1.5 active:bg-rose-100">
                <Text className="font-body-semibold text-[11px] text-primary-600">
                  {suggesting === suggestion.user.id ? '…' : 'Add'}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      <Pressable
        onPress={() => router.push('/profile/search')}
        accessibilityRole="button"
        className="mt-4 flex flex-row items-center gap-2 self-start active:opacity-60">
        <Text className="font-body-semibold text-[13px] text-primary-600">
          Search by name instead
        </Text>
        <MaterialCommunityIcons name="arrow-right" size={18} color="#7e2534" />
      </Pressable>
    </View>
  );
}

function RequestsEmptyState() {
  return (
    <View className="mt-3 items-center rounded-card border border-dashed border-sand-400 bg-paper-100 px-6 py-7">
      <MaterialCommunityIcons name="account-check-outline" size={22} color="#b8a37c" />
      <Text className="mt-2.5 font-body-semibold text-[13px] text-ink-600">Nothing waiting</Text>
      <Text className="mt-1 max-w-[260px] text-center font-body text-[12px] leading-[18px] text-ink-400">
        When someone asks to join your Circle, they will show up here for you to accept.
      </Text>
    </View>
  );
}

export default function CircleScreen() {
  const [query, setQuery] = useState('');
  const [actingOn, setActingOn] = useState<string | null>(null);

  const fetchFriends = useCallback(async () => {
    const entries = await usersApi.listFriends();
    return entries.map((entry: FriendEntry) => entry.user);
  }, []);

  // Keep the previous rows visible while the focus refetch runs; otherwise
  // returning to the tab blanks the whole Circle into loading states.
  const friends = useApiQuery(fetchFriends, { key: 'friends', keepPreviousData: true });
  const requests = useApiQuery(usersApi.listFriendRequests, {
    key: 'friend-requests',
    keepPreviousData: true,
  });

  const suggestions = useApiQuery(() => usersApi.fetchSuggestions(12), {
    key: 'friend-suggestions',
    keepPreviousData: true,
  });

  // Destructured so the focus callback depends on stable functions rather than
  // on the query objects, which are rebuilt every render.
  const refetchFriends = friends.refetch;
  const refetchRequests = requests.refetch;
  const refetchSuggestions = suggestions.refetch;

  /**
   * Tabs stay mounted. Blocking happens on a profile pushed from this screen,
   * so on the way back the cached suggestions still contain the person you just
   * blocked — and their Add button can only fail. Refetching on focus makes the
   * server's block exclusion visible; the first focus is skipped because the
   * queries already fetched on mount.
   */
  const hasFocused = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!hasFocused.current) {
        hasFocused.current = true;
        return;
      }
      refetchFriends();
      refetchRequests();
      refetchSuggestions();
    }, [refetchFriends, refetchRequests, refetchSuggestions])
  );

  const needle = query.trim().toLowerCase();
  const people = (friends.data ?? []).filter(
    (person) =>
      !needle ||
      person.name.toLowerCase().includes(needle) ||
      (person.bio ?? '').toLowerCase().includes(needle)
  );

  const incoming = requests.data?.incoming ?? [];

  const respond = async (request: FriendRequest, accept: boolean) => {
    setActingOn(request.requestId);
    try {
      if (accept) await usersApi.acceptFriendRequest(request.requestId);
      else await usersApi.rejectFriendRequest(request.requestId);
      requests.refetch();
      if (accept) friends.refetch();
    } finally {
      setActingOn(null);
    }
  };

  return (
    <Screen className="bg-paper-50" edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}>
        <CircleHeader
          eyebrow="Requests"
          title="Circle"
          subtitle="People whose judgement you actually rely on."
          actionLabel="Friends"
          onAction={() => router.push('/friends')}
        />

        <View className="mx-4 mt-5 h-px bg-border" />

        {friends.status === 'loading' && !friends.data && (
          <LoadingState label="Loading your circle…" />
        )}

        {friends.status === 'error' && !friends.data && (
          <ErrorState label={friends.message} onRetry={friends.refetch} />
        )}

        {/*
          The suggestions section below covers the no-friends case, so there is
          no separate empty state here — a reader with no friends still gets the
          same "who should I know" list rather than a dead end.
        */}

        {friends.data && friends.data.length > 0 && (
          <>
            <PeopleRail
              people={people}
              total={friends.data.length}
              inCircleLabel="in your Circle"
              seeAllLabel="Manage"
              onSeeAll={() => router.push('/friends')}
              onOpenPerson={(id) => router.push(`/profile/${id}`)}
            />

            <CircleSearch value={query} placeholder="Filter your circle" onChange={setQuery} />

            {people.length === 0 ? (
              <EmptyState
                icon="account-search-outline"
                tone="sand"
                compact
                title={`Nobody matches “${query.trim()}”`}
              />
            ) : (
              <View className="mt-5 gap-2 px-4">
                {people.map((person) => (
                  <Pressable
                    key={person.id}
                    onPress={() => router.push(`/profile/${person.id}`)}
                    accessibilityRole="button"
                    className="flex-row items-center gap-3 rounded-card border border-border bg-paper-50 p-3 active:opacity-70">
                    <Avatar user={person} size={40} />
                    <View className="flex-1">
                      <Text
                        numberOfLines={1}
                        className="font-body-semibold text-[13px] text-ink-800">
                        {person.name}
                      </Text>
                      {person.bio ? (
                        <Text
                          numberOfLines={1}
                          className="mt-0.5 font-body text-[11px] text-ink-400">
                          {person.bio}
                        </Text>
                      ) : null}
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={17} color="#b8a37c" />
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}

        <SuggestionSection
          status={suggestions.status}
          items={suggestions.data ?? []}
          errorMessage={
            suggestions.status === 'error'
              ? suggestions.message
              : 'We could not find anyone just now.'
          }
          onRetry={suggestions.refetch}
          onBecameFriend={friends.refetch}
        />

        {/* Incoming requests are real: there is an endpoint and a state machine. */}
        {(requests.data || requests.status !== 'loading') && (
          <View className="mt-8 px-4">
            <Text className="font-body-semibold text-2xs uppercase text-ink-400">Requests</Text>

            {requests.status === 'error' ? (
              <View className="mt-3">
                <ErrorState label={requests.message} onRetry={requests.refetch} />
              </View>
            ) : incoming.length === 0 ? (
              <RequestsEmptyState />
            ) : (
              <View className="mt-3 gap-2">
                {incoming.map((request) => (
                  <View
                    key={request.requestId}
                    className="flex-row items-center gap-3 rounded-card border border-border bg-paper-50 p-3">
                    <Avatar user={request.user} size={38} />
                    <View className="flex-1">
                      <Text className="font-body-semibold text-[13px] text-ink-800">
                        {request.user.name}
                      </Text>
                      <Text className="mt-0.5 font-body text-[10.5px] text-ink-400">
                        wants to join your circle
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => void respond(request, true)}
                      disabled={actingOn === request.requestId}
                      accessibilityRole="button"
                      accessibilityLabel={`$Accept ${request.user.name}`}
                      className="rounded-pill bg-primary-600 px-3 py-1.5 active:opacity-70">
                      <Text className="font-body-semibold text-[11px] text-primary-fg">Accept</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => void respond(request, false)}
                      disabled={actingOn === request.requestId}
                      accessibilityRole="button"
                      accessibilityLabel={`$Decline ${request.user.name}`}
                      className="rounded-pill border border-border px-3 py-1.5 active:opacity-70">
                      <Text className="font-body-medium text-[11px] text-ink-600">Decline</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Blocking removes the profile you would otherwise unblock from, so
            this is the discoverable route to the only screen that can undo it. */}
        <View className="mt-8 px-4">
          <Pressable
            onPress={() => router.push('/settings/blocked')}
            accessibilityRole="button"
            accessibilityLabel="Manage blocked people"
            className="flex-row items-center gap-3 rounded-card border border-hairline bg-paper-50 px-4 py-3.5 active:opacity-70">
            <MaterialCommunityIcons name="account-cancel-outline" size={18} color="#a03246" />
            <View className="flex-1">
              <Text className="font-body-semibold text-[13px] text-ink-900">Blocked people</Text>
              <Text className="mt-0.5 font-body text-[11px] text-ink-400">
                Review or undo a block.
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={17} color="#b8a37c" />
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}
