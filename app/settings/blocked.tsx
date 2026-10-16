import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usersApi } from '@/api';
import type { BlockedEntry } from '@/api/endpoints/users';
import { Avatar } from '@/components/Avatar';
import { EmptyState, ErrorState, LoadingState } from '@/components/EmptyState';
import { settingsCopy } from '@/data';
import { useApiQuery } from '@/lib/useApiQuery';

export default function BlockedPeopleScreen() {
  const insets = useSafeAreaInsets();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const blocked = useApiQuery<BlockedEntry[]>(() => usersApi.listBlockedUsers(), {
    key: 'blocked-users',
    errorMessage: settingsCopy.blockedFailed,
  });

  const unblock = async (entry: BlockedEntry) => {
    setBusyId(entry.user.id);
    setNotice(null);
    try {
      await usersApi.unblockUser(entry.user.id);
      // The row is gone server-side, and `refetch` is the only honest signal —
      // patching local state would hide a failure behind a disappearing row.
      blocked.refetch();
    } catch {
      setNotice(settingsCopy.unblockFailed);
    } finally {
      setBusyId(null);
    }
  };

  const confirmUnblock = (entry: BlockedEntry) => {
    Alert.alert(
      settingsCopy.unblockTitle,
      settingsCopy.unblockBody.replace('{name}', entry.user.name),
      [
        { text: settingsCopy.cancel, style: 'cancel' },
        {
          text: settingsCopy.unblock,
          onPress: () => void unblock(entry),
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View className="flex-1 bg-paper-100">
      <View
        className="flex-row items-center justify-between border-b border-hairline bg-paper-50 px-5"
        style={{ paddingTop: insets.top, height: insets.top + 52 }}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.navigate('/'))}
          accessibilityRole="button"
          accessibilityLabel={settingsCopy.back}
          hitSlop={10}
          className="h-10 w-10 items-center justify-center active:opacity-60">
          <MaterialCommunityIcons name="chevron-left" size={24} color="#342d27" />
        </Pressable>
        <Text className="font-body-semibold text-3xs uppercase text-ink-400">
          {settingsCopy.blockedPeople}
        </Text>
        <View className="h-10 w-10" />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}>
        {blocked.status === 'loading' && <LoadingState label={settingsCopy.loading} />}

        {blocked.status === 'error' && !blocked.data && (
          <ErrorState label={blocked.message} onRetry={blocked.refetch} />
        )}

        {blocked.status === 'empty' && (
          <EmptyState
            icon="account-check-outline"
            tone="sand"
            title={settingsCopy.noBlockedTitle}
            body={settingsCopy.noBlockedBody}
          />
        )}

        {blocked.status === 'ready' && (
          <View className="gap-2.5 px-5 pt-6">
            {notice && (
              <View className="rounded-card bg-accent-50 p-3">
                <Text className="font-body text-[12px] leading-[18px] text-accent-700">
                  {notice}
                </Text>
              </View>
            )}

            {(blocked.data ?? []).map((entry) => (
              <View
                key={entry.user.id}
                className="flex-row items-center gap-3 rounded-card border border-hairline bg-paper-50 px-4 py-3">
                <Avatar user={entry.user} size={38} />

                <View className="flex-1">
                  <Text className="font-body-semibold text-[13.5px] text-ink-900">
                    {entry.user.name}
                  </Text>
                  <Text className="mt-0.5 font-body text-[11px] text-ink-400">
                    {settingsCopy.blockedOn}{' '}
                    {new Date(entry.blockedAt).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>

                <Pressable
                  onPress={() => confirmUnblock(entry)}
                  disabled={busyId === entry.user.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${settingsCopy.unblock} ${entry.user.name}`}
                  accessibilityState={{ disabled: busyId === entry.user.id }}
                  className="rounded-pill border border-primary-600 px-3.5 py-2 active:opacity-70"
                  style={{ opacity: busyId === entry.user.id ? 0.5 : 1 }}>
                  <Text className="font-body-semibold text-[11.5px] text-primary-600">
                    {busyId === entry.user.id ? '…' : settingsCopy.unblock}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
