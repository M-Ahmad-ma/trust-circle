import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Monogram } from '@/components/Monogram';
import { members, viewer } from '@/data';

export default function CircleScreen() {
  return (
    <Screen className="px-4" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <Text className="font-body-semibold text-2xs uppercase text-ink-400">
          {viewer.circleName}
        </Text>
        <Text className="mt-1.5 font-display text-[26px] leading-8 text-ink-800">Your Circle</Text>

        <View className="mt-5 flex-row items-center gap-3 rounded-card border border-sand-400 bg-paper-50 p-4">
          <View className="h-14 w-14 items-center justify-center rounded-pill bg-primary-600">
            <Text className="font-display text-[20px] text-primary-fg">{viewer.trustScore}</Text>
          </View>
          <View className="flex-1">
            <Text className="font-display-semibold text-[16px] text-ink-800">
              {viewer.trustLabel}
            </Text>
            <Text className="mt-0.5 font-body text-[11px] text-ink-500">
              {viewer.circles} circles · {viewer.streakWeeks} week streak
            </Text>
          </View>
        </View>

        <Text className="mt-7 font-body-semibold text-2xs uppercase text-ink-400">
          {members.length} people
        </Text>

        <View className="mt-3 gap-2">
          {members.map((member, index) => (
            <View
              key={member.id}
              className="flex-row items-center gap-3 rounded-card border border-sand-400 bg-paper-50 p-3">
              <Monogram initials={member.initials} tint={member.tint} size={40} />
              <View className="flex-1">
                <Text className="font-body-semibold text-[13px] text-ink-800">{member.name}</Text>
                <Text className="mt-0.5 font-body text-[11px] text-ink-400">{member.relation}</Text>
              </View>
              {index < 3 && (
                <MaterialCommunityIcons name="check-decagram" size={16} color="#4a6b52" />
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
