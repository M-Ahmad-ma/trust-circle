import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-paper-100">
      <View
        className="flex-row items-center justify-between border-b border-hairline bg-paper-50 px-5"
        style={{ paddingTop: insets.top, height: insets.top + 52 }}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.navigate('/'))}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={10}
          className="h-10 w-10 items-center justify-center active:opacity-60">
          <MaterialCommunityIcons name="chevron-left" size={24} color="#342d27" />
        </Pressable>
        <Text className="font-body-semibold text-3xs uppercase text-ink-400">Settings</Text>
        <View className="h-10 w-10" />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}>
        <View className="px-5 pt-8">
          <Text className="font-display text-[24px] leading-[30px] text-ink-900">Settings</Text>
        </View>

        <View className="mt-6 px-5">
          {/* Unblock lives here because blocking removes the profile you would
              otherwise unblock from — this list is the only place that state is
              visible. */}
          <Row
            icon="account-cancel-outline"
            label="Blocked people"
            hint="People you blocked. Unblocking restores their profile to you."
            onPress={() => router.push('/settings/blocked')}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function Row({
  icon,
  label,
  hint,
  onPress,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  hint: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="flex-row items-center gap-3 rounded-card border border-hairline bg-paper-50 px-4 py-4 active:opacity-70">
      <MaterialCommunityIcons name={icon} size={20} color="#a03246" />
      <View className="flex-1">
        <Text className="font-body-semibold text-[14px] text-ink-900">{label}</Text>
        <Text className="mt-1 font-body text-[11.5px] leading-[17px] text-ink-400">{hint}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={18} color="#b8a37c" />
    </Pressable>
  );
}
