import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { viewer } from '@/data';

const ROWS = [
  { label: 'Trusted places', value: '24', icon: 'bookmark-outline' },
  { label: 'Circles', value: `${viewer.circles}`, icon: 'account-group-outline' },
  { label: 'Weeks verified', value: `${viewer.streakWeeks}`, icon: 'calendar-check-outline' },
  { label: 'Trust score', value: `${viewer.trustScore}`, icon: 'shield-check-outline' },
];

export default function ProfileScreen() {
  return (
    <Screen className="px-4" edges={['top']}>
      <View className="flex-1">
        <Text className="font-body-semibold text-2xs uppercase text-ink-400">Account</Text>
        <Text className="mt-1.5 font-display text-[26px] leading-8 text-ink-800">Profile</Text>

        <View className="mt-6 items-center">
          <View className="h-24 w-24 items-center justify-center rounded-pill border-2 border-primary-600 bg-primary-600">
            <Text className="font-display text-[34px] text-primary-fg">
              {viewer.firstName.slice(0, 1)}
            </Text>
          </View>
          <Text className="mt-3 font-display text-[21px] text-ink-800">{viewer.firstName}</Text>
          <Text className="mt-1 font-body text-[12px] text-ink-500">{viewer.circleName}</Text>

          <View className="mt-3 flex-row items-center gap-1.5 rounded-pill bg-moss-500 px-3 py-1.5">
            <MaterialCommunityIcons name="shield-check" size={13} color="#fdfaf4" />
            <Text className="font-body-semibold text-[10px] uppercase tracking-widest text-paper-50">
              {viewer.trustLabel}
            </Text>
          </View>
        </View>

        <View className="mt-8 overflow-hidden rounded-card border border-sand-400 bg-paper-50">
          {ROWS.map((row, index) => (
            <View
              key={row.label}
              className={`flex-row items-center gap-3 px-4 py-3.5 ${
                index < ROWS.length - 1 ? 'border-b border-sand-300' : ''
              }`}>
              <MaterialCommunityIcons name={row.icon as never} size={17} color="#6b6058" />
              <Text className="flex-1 font-body text-[12px] text-ink-700">{row.label}</Text>
              <Text className="font-display-semibold text-[14px] text-ink-800">{row.value}</Text>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}
