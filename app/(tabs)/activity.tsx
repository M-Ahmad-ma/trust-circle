import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { members } from '@/data';

const FEED = [
  {
    id: 'a1',
    who: 'Bilal Ahmad',
    initials: 'BA',
    tint: '#8e2c39',
    verb: 'visited',
    what: 'Khyber Restaurant',
    when: '2 hours ago',
    icon: 'silverware-fork-knife',
  },
  {
    id: 'a2',
    who: 'Sana Khalid',
    initials: 'SK',
    tint: '#4a6b52',
    verb: 'saved',
    what: 'Beanstalk Coffee',
    when: 'Yesterday',
    icon: 'bookmark-plus-outline',
  },
  {
    id: 'a3',
    who: 'Hamza Tariq',
    initials: 'HT',
    tint: '#c08a2e',
    verb: 'verified',
    what: 'Qissa Khwani Bazaar',
    when: '3 days ago',
    icon: 'check-decagram-outline',
  },
  {
    id: 'a4',
    who: 'Areeba Nawaz',
    initials: 'AN',
    tint: '#6e5a86',
    verb: 'reviewed',
    what: 'Bala Bagh Fort',
    when: 'Last week',
    icon: 'star-outline',
  },
];

export default function ActivityScreen() {
  return (
    <Screen className="px-4" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <Text className="font-body-semibold text-2xs uppercase text-ink-400">Your Circle</Text>
        <Text className="mt-1.5 font-display text-[26px] leading-8 text-ink-800">Activity</Text>

        <View className="mt-6">
          {FEED.map((item, index) => (
            <View key={item.id} className="flex-row gap-3">
              {/* Timeline rail */}
              <View className="items-center">
                <View className="h-9 w-9 items-center justify-center rounded-pill bg-primary-50">
                  <MaterialCommunityIcons name={item.icon as never} size={16} color="#8e2c39" />
                </View>
                {index < FEED.length - 1 && <View className="w-px flex-1 bg-sand-400" />}
              </View>

              <View className="flex-1 pb-6">
                <Text className="font-body text-[12px] leading-5 text-ink-700">
                  <Text className="font-body-semibold text-ink-800">{item.who}</Text>
                  <Text className="text-ink-400"> {item.verb} </Text>
                  <Text className="font-body-semibold text-ink-800">{item.what}</Text>
                </Text>
                <Text className="mt-1 font-body text-[10px] uppercase tracking-widest text-ink-300">
                  {item.when}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Text className="mt-1 font-body text-[11px] text-ink-400">
          Tracking {members.length} people across {FEED.length} circles.
        </Text>
      </ScrollView>
    </Screen>
  );
}
