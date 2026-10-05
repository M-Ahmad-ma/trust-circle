import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FlowHeader } from '@/components/write/FlowHeader';
import { StarRatingInput } from '@/components/write/Relationship';
import { writeCopy } from '@/data';
import { STEP_ROUTES, useExperienceDraft } from '@/lib/experienceDraft';

const WORDS = ['Not for me', 'It was fine', 'Good', 'Really good', 'Exceptional'];

export default function RatingStep() {
  const insets = useSafeAreaInsets();
  const { draft, dispatch } = useExperienceDraft();

  const rating = draft.rating ?? 0;

  return (
    <View className="flex-1 bg-paper-100">
      <View style={{ paddingTop: insets.top + 8 }}>
        <FlowHeader
          current="rating"
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
            How was it, <Text className="font-display-italic text-primary-600">overall</Text>?
          </Text>
          <Text className="mt-3 max-w-[310px] font-body text-[13px] leading-[19px] text-ink-500">
            {writeCopy.ratingHint}
          </Text>
        </View>

        <View className="mt-10 px-5">
          <StarRatingInput
            value={rating}
            onChange={(next) => dispatch({ type: 'setRating', rating: next })}
          />

          <View className="mt-4 h-6">
            {rating > 0 ? (
              <Text className="font-display-italic text-[15px] text-primary-600">
                {WORDS[rating - 1]}
              </Text>
            ) : (
              <Text className="font-body text-[12px] text-ink-300">{writeCopy.tapToRate}</Text>
            )}
          </View>
        </View>

        {/* README §5 — explicitly no category-specific sub-scores. */}
        <View className="mt-8 px-5">
          <View className="rounded-card bg-surface p-4">
            <Text className="font-body-semibold text-3xs uppercase text-ink-400">
              {writeCopy.oneNumberOnly}
            </Text>
            <Text className="mt-2 font-body text-[12px] leading-[18px] text-ink-500">
              {writeCopy.oneNumberWhy}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 border-t border-hairline bg-paper-50 px-5"
        style={{ paddingBottom: Math.max(insets.bottom, 14), paddingTop: 12 }}>
        <Pressable
          onPress={() => router.push(STEP_ROUTES.story)}
          disabled={rating === 0}
          accessibilityRole="button"
          accessibilityState={{ disabled: rating === 0 }}
          className="items-center justify-center rounded-card active:opacity-90"
          style={{ height: 52, backgroundColor: rating > 0 ? '#a03246' : '#d9cbb2' }}>
          <Text
            className="font-body-semibold text-[15px]"
            style={{ color: rating > 0 ? '#fdfaf4' : '#f3ecdd' }}>
            {writeCopy.continueLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
