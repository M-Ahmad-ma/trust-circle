import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { clearLogEntries, getLogEntries, subscribeToLogs, type LogEntry } from '@/api/logger';
import { EmptyState } from '@/components/EmptyState';

const LEVEL_COLOR: Record<string, string> = {
  debug: '#9a8e85',
  info: '#6b6058',
  warn: '#c08a2e',
  error: '#a03246',
};

/**
 * Network log viewer. Reachable by deep link — `trustcircle://dev/logs` — so it
 * adds no chrome to the product itself.
 */
export default function LogsScreen() {
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<LogEntry[]>(() => getLogEntries());
  const [scope, setScope] = useState<string | null>(null);

  useEffect(() => subscribeToLogs(() => setEntries([...getLogEntries()])), []);

  const scopes = Array.from(new Set(entries.map((entry) => entry.scope)));
  const visible = scope ? entries.filter((entry) => entry.scope === scope) : entries;

  return (
    <View className="flex-1 bg-paper-100">
      <View
        className="flex-row items-center justify-between border-b border-hairline bg-paper-50 px-4"
        style={{ paddingTop: insets.top, height: insets.top + 52 }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={10}
          className="h-10 w-10 items-center justify-center active:opacity-60">
          <MaterialCommunityIcons name="chevron-left" size={24} color="#342d27" />
        </Pressable>
        <Text className="font-body-semibold text-3xs uppercase text-ink-400">Network log</Text>
        <Pressable
          onPress={() => {
            clearLogEntries();
            setEntries([]);
          }}
          accessibilityRole="button"
          accessibilityLabel="Clear log"
          hitSlop={10}
          className="h-10 w-10 items-center justify-center active:opacity-60">
          <MaterialCommunityIcons name="broom" size={18} color="#6b6058" />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="grow-0 border-b border-hairline bg-paper-50"
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 6 }}>
        <Chip label="all" active={scope === null} onPress={() => setScope(null)} />
        {scopes.map((name) => (
          <Chip key={name} label={name} active={scope === name} onPress={() => setScope(name)} />
        ))}
      </ScrollView>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 24 }}>
        {visible.length === 0 ? (
          <EmptyState
            icon="console-line"
            tone="sand"
            title="Nothing logged yet"
            body="Requests, token refreshes and errors appear here as they happen."
          />
        ) : (
          <View className="gap-1">
            {[...visible].reverse().map((entry) => (
              <View
                key={entry.id}
                className="rounded-[10px] border border-hairline bg-paper-50 p-2.5">
                <View className="flex-row items-center gap-2">
                  <View
                    className="h-1.5 w-1.5 rounded-pill"
                    style={{ backgroundColor: LEVEL_COLOR[entry.level] }}
                  />
                  <Text className="font-body-semibold text-[10px] uppercase text-ink-400">
                    {entry.scope}
                  </Text>
                  {entry.durationMs !== undefined && (
                    <Text className="font-body text-[10px] text-ink-300">
                      {Math.round(entry.durationMs)}ms
                    </Text>
                  )}
                  <Text className="ml-auto font-body text-[9.5px] text-ink-300">
                    {new Date(entry.at).toLocaleTimeString()}
                  </Text>
                </View>

                <Text className="mt-1 font-mono text-[11px] leading-4 text-ink-800">
                  {entry.message}
                </Text>

                {entry.data && (
                  <Text className="mt-1 font-mono text-[9.5px] leading-[13px] text-ink-400">
                    {JSON.stringify(entry.data)}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className="rounded-pill border px-3 py-1.5 active:opacity-70"
      style={{
        borderColor: active ? '#a03246' : '#e0d2b4',
        backgroundColor: active ? '#a03246' : '#fdfaf4',
      }}>
      <Text
        className={
          active
            ? 'font-body-semibold text-[10.5px] text-primary-fg'
            : 'font-body text-[10.5px] text-ink-600'
        }>
        {label}
      </Text>
    </Pressable>
  );
}
