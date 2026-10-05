import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FlowHeader } from '@/components/write/FlowHeader';
import { writeCopy } from '@/data';
import { STEP_ROUTES, useExperienceDraft } from '@/lib/experienceDraft';
import { VISIBILITY_ORDER, relationshipFor } from '@/theme/relationship';

export default function VisibilityStep() {
  const insets = useSafeAreaInsets();
  const { draft, dispatch } = useExperienceDraft();

  return (
    <View className="flex-1 bg-paper-100">
      <View style={{ paddingTop: insets.top + 8 }}>
        <FlowHeader
          current="visibility"
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
            Who should see <Text className="font-display-italic text-primary-600">this</Text>?
          </Text>
          <Text className="mt-3 max-w-[320px] font-body text-[13px] leading-[19px] text-ink-500">
            {writeCopy.visibilityHint}
          </Text>
        </View>

        <View className="mt-7 gap-2.5 px-5">
          {VISIBILITY_ORDER.map((id) => {
            const level = relationshipFor(id);
            const active = draft.visibility === id;

            return (
              <Pressable
                key={id}
                onPress={() => dispatch({ type: 'setVisibility', visibility: id })}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityHint={level.description}
                className="rounded-card border p-4 active:opacity-70"
                style={{
                  borderColor: active ? level.color : '#e0d2b4',
                  backgroundColor: active ? level.wash : '#fdfaf4',
                }}>
                <View className="flex-row items-center gap-2.5">
                  <View
                    style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: level.color }}
                  />
                  <Text
                    className="flex-1 font-body-semibold text-[14px]"
                    style={{ color: active ? level.color : '#342d27' }}>
                    {level.label}
                  </Text>
                  {active ? (
                    <MaterialCommunityIcons name="check-circle" size={19} color={level.color} />
                  ) : (
                    <View className="h-[19px] w-[19px] rounded-pill border border-sand-400" />
                  )}
                </View>

                <Text className="mt-2 font-body text-[12px] leading-[18px] text-ink-500">
                  {level.description}
                </Text>

                <Text
                  className="mt-2.5 font-body-semibold text-3xs uppercase"
                  style={{ color: level.color }}>
                  {level.audience}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* README §16 — the server enforces this; the client is not the gate. */}
        <View className="mt-6 px-5">
          <View className="flex-row gap-2.5 rounded-card bg-surface p-4">
            <MaterialCommunityIcons name="shield-lock-outline" size={15} color="#6b6058" />
            <Text className="flex-1 font-body text-[11px] leading-[17px] text-ink-500">
              {writeCopy.visibilityEnforced}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 border-t border-hairline bg-paper-50 px-5"
        style={{ paddingBottom: Math.max(insets.bottom, 14), paddingTop: 12 }}>
        <Pressable
          onPress={() => router.push(STEP_ROUTES.preview)}
          disabled={!draft.visibility}
          accessibilityRole="button"
          accessibilityState={{ disabled: !draft.visibility }}
          className="items-center justify-center rounded-card active:opacity-90"
          style={{ height: 52, backgroundColor: draft.visibility ? '#a03246' : '#d9cbb2' }}>
          <Text
            className="font-body-semibold text-[15px]"
            style={{ color: draft.visibility ? '#fdfaf4' : '#f3ecdd' }}>
            {writeCopy.reviewBeforeSharing}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
