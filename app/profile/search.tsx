import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usersApi } from '@/api';
import { hasCode, isApiError, requestIdFrom } from '@/api/errors';
import type { SlimUser } from '@/api/types';
import { Avatar } from '@/components/Avatar';
import { EmptyState, ErrorState } from '@/components/EmptyState';
import { RelationshipBadge } from '@/components/write/Relationship';
import { peopleCopy } from '@/data';

type Row = {
  user: SlimUser;
  relationship: { type: 'direct_friend' | 'none'; label: string };
};

/**
 * People search. Excluding yourself and anyone blocked is already handled
 * server-side, and `relationship` is only ever direct_friend or none here.
 */
export default function PeopleSearchScreen() {
  const insets = useSafeAreaInsets();
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const run = useCallback(async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) {
      setRows(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setRows(await usersApi.searchUsers(trimmed));
    } catch {
      setError(peopleCopy.searchFailed);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced — every keystroke would otherwise be a round trip.
  useEffect(() => {
    const timer = setTimeout(() => void run(query), 300);
    return () => clearTimeout(timer);
  }, [query, run]);

  const sendRequest = async (user: Row) => {
    setActing(user.user.id);
    setNotice(null);

    try {
      await usersApi.sendFriendRequest(user.user.id);
      setRows(
        (current) =>
          current?.map((row) =>
            row.user.id === user.user.id
              ? {
                  ...row,
                  relationship: {
                    type: 'direct_friend',
                    label: peopleCopy.requestSent,
                  },
                }
              : row
          ) ?? null
      );
    } catch (caught) {
      if (hasCode(caught, 'REQUEST_ALREADY_SENT')) {
        setNotice(peopleCopy.requestSent);
      } else if (hasCode(caught, 'ALREADY_FRIENDS')) {
        setNotice(peopleCopy.alreadyFriends);
      } else if (hasCode(caught, 'REQUEST_ALREADY_RECEIVED')) {
        // API.md §4: details.requestId unlocks Accept/Decline instead.
        setNotice(requestIdFrom(caught) ? peopleCopy.theySentYouRequest : peopleCopy.cannotRequest);
      } else if (hasCode(caught, 'BLOCKED') || hasCode(caught, 'YOU_BLOCKED_THEM')) {
        setNotice(peopleCopy.blocked);
      } else if (isApiError(caught)) {
        setNotice(caught.message);
      } else {
        setNotice(peopleCopy.requestFailed);
      }
    } finally {
      setActing(null);
    }
  };

  return (
    <View className="flex-1 bg-paper-100">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 56}>
        <View
          className="flex-row items-center justify-between border-b border-hairline bg-paper-50 px-4"
          style={{ paddingTop: insets.top, height: insets.top + 52 }}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={peopleCopy.back}
            hitSlop={10}
            className="h-10 w-10 items-center justify-center active:opacity-60">
            <MaterialCommunityIcons name="chevron-left" size={24} color="#342d27" />
          </Pressable>
          <Text className="font-body-semibold text-3xs uppercase text-ink-400">
            {peopleCopy.title}
          </Text>
          <View className="h-10 w-10" />
        </View>

        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
          <View className="px-5 pt-6">
            <View className="flex-row items-center gap-2.5 rounded-pill border border-border bg-paper-50 px-4">
              <MaterialCommunityIcons name="magnify" size={17} color="#9a8e85" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={peopleCopy.placeholder}
                placeholderTextColor="#b8a37c"
                autoCorrect={false}
                autoFocus={focus === '1'}
                returnKeyType="search"
                className="flex-1 py-3 font-body text-[13px] text-ink-900"
              />
            </View>
          </View>

          {notice && (
            <View className="mt-4 px-5">
              <View className="rounded-card bg-accent-50 p-3.5">
                <Text className="font-body text-[12px] leading-[18px] text-accent-700">
                  {notice}
                </Text>
              </View>
            </View>
          )}

          {error && <ErrorState label={error} />}

          {!error && rows === null && (
            <EmptyState
              icon="account-search-outline"
              tone="sand"
              title={peopleCopy.startTitle}
              body={peopleCopy.startBody}
            />
          )}

          {!error && rows !== null && rows.length === 0 && !loading && (
            <EmptyState
              icon="account-search-outline"
              tone="sand"
              title={`Nobody matches “${query.trim()}”`}
              body={peopleCopy.noResultsBody}
            />
          )}

          {!error && rows !== null && rows.length > 0 && (
            <View className="mt-4 gap-2 px-5">
              {rows.map((row) => {
                const connected = row.relationship.type === 'direct_friend';

                return (
                  <View
                    key={row.user.id}
                    className="flex-row items-center gap-3 rounded-card border border-hairline bg-paper-50 p-3">
                    <Avatar user={row.user} size={40} />

                    <Pressable
                      onPress={() => router.push(`/profile/${row.user.id}`)}
                      accessibilityRole="button"
                      className="flex-1 active:opacity-60">
                      <Text
                        numberOfLines={1}
                        className="font-body-semibold text-[13px] text-ink-800">
                        {row.user.name}
                      </Text>
                      {row.user.bio ? (
                        <Text
                          numberOfLines={1}
                          className="mt-0.5 font-body text-[11px] text-ink-400">
                          {row.user.bio}
                        </Text>
                      ) : null}
                    </Pressable>

                    {connected ? (
                      <RelationshipBadge
                        relationship="direct_friend"
                        label={row.relationship.label}
                        size="sm"
                      />
                    ) : (
                      <Pressable
                        onPress={() => void sendRequest(row)}
                        disabled={acting === row.user.id}
                        accessibilityRole="button"
                        accessibilityLabel={`Add ${row.user.name} to your circle`}
                        className="rounded-pill border border-primary-600 px-3 py-1.5 active:bg-rose-100">
                        <Text className="font-body-semibold text-[11px] text-primary-600">
                          {acting === row.user.id ? '…' : peopleCopy.add}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
