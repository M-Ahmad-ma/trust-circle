import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FlowHeader } from '@/components/write/FlowHeader';
import { formatVisitDate, VisitCalendar } from '@/components/write/VisitCalendar';
import { writeCopy } from '@/data';
import { STEP_ROUTES, useExperienceDraft } from '@/lib/experienceDraft';

export default function DateStep() {
  const insets = useSafeAreaInsets();
  const { draft, dispatch } = useExperienceDraft();

  return (
    <View className="flex-1 bg-paper-100">
      <View style={{ paddingTop: insets.top + 8 }}>
        <FlowHeader
          current="date"
          closeLabel={writeCopy.closeFlow}
          onClose={() => router.dismissAll()}
        />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        <View className="px-5 pt-9">
          <Text className="font-body-semibold text-2xs uppercase text-primary-600">
            {writeCopy.stepEyebrow}
          </Text>
          <Text className="mt-3 font-display text-[30px] leading-[35px] text-ink-900">
            When did you <Text className="font-display-italic text-primary-600">go</Text>?
          </Text>
          <Text className="mt-3 max-w-[310px] font-body text-[13px] leading-[19px] text-ink-500">
            {writeCopy.dateHint}
          </Text>
        </View>

        <View className="mt-8 px-5">
          <View className="rounded-card border border-hairline bg-paper-50 p-4">
            <VisitCalendar
              value={draft.visitedAt}
              onChange={(visitedAt) => dispatch({ type: 'setVisitedAt', visitedAt })}
            />
          </View>
        </View>

        {draft.visitedAt && (
          <View className="mt-5 px-5">
            <View className="flex-row items-center gap-2 rounded-card bg-surface px-4 py-3">
              <View className="h-1.5 w-1.5 rounded-pill bg-primary-600" />
              <Text className="font-body text-[12px] text-ink-700">
                {writeCopy.selectedDate} {formatVisitDate(draft.visitedAt)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 border-t border-hairline bg-paper-50 px-5"
        style={{ paddingBottom: Math.max(insets.bottom, 14), paddingTop: 12 }}>
        <Pressable
          onPress={() => router.push(STEP_ROUTES.visibility)}
          disabled={!draft.visitedAt}
          accessibilityRole="button"
          accessibilityState={{ disabled: !draft.visitedAt }}
          className="items-center justify-center rounded-card active:opacity-90"
          style={{ height: 52, backgroundColor: draft.visitedAt ? '#a03246' : '#d9cbb2' }}>
          <Text
            className="font-body-semibold text-[15px]"
            style={{ color: draft.visitedAt ? '#fdfaf4' : '#f3ecdd' }}>
            {writeCopy.continueLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
