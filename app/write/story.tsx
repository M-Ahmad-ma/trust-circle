import { router } from 'expo-router';
import { useState } from 'react';
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

import { FlowHeader } from '@/components/write/FlowHeader';
import { writeCopy } from '@/data';
import { STEP_ROUTES, useExperienceDraft } from '@/lib/experienceDraft';

const MIN_LENGTH = 10;

/** README §6 — the writing prompt, verbatim from the product philosophy. */
export default function StoryStep() {
  const insets = useSafeAreaInsets();
  const { draft, dispatch } = useExperienceDraft();
  const [touched, setTouched] = useState(false);

  const length = draft.reviewText.trim().length;
  const tooShort = length < MIN_LENGTH;
  const valid = !tooShort;

  return (
    <View className="flex-1 bg-paper-100">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 56}>
        <View style={{ paddingTop: insets.top + 8 }}>
          <FlowHeader
            current="story"
            closeLabel={writeCopy.closeFlow}
            onClose={() => router.dismissAll()}
          />
        </View>

        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
          <View className="px-5 pt-9">
            <Text className="font-body-semibold text-2xs uppercase text-primary-600">
              {writeCopy.stepEyebrow}
            </Text>
            <Text className="mt-3 font-display text-[30px] leading-[35px] text-ink-900">
              What would you tell a{' '}
              <Text className="font-display-italic text-primary-600">friend</Text>?
            </Text>
          </View>

          <View className="mt-7 px-5">
            <TextInput
              value={draft.reviewText}
              onChangeText={(reviewText) => dispatch({ type: 'setReviewText', reviewText })}
              onBlur={() => setTouched(true)}
              placeholder={writeCopy.storyPlaceholder}
              placeholderTextColor="#b8a37c"
              multiline
              textAlignVertical="top"
              autoCapitalize="sentences"
              maxLength={600}
              accessibilityLabel={writeCopy.storyPrompt}
              className="min-h-[190px] rounded-card border border-border bg-paper-50 p-4 font-body text-[14px] leading-[22px] text-ink-900"
              style={{ borderColor: touched && tooShort ? '#a03246' : '#e0d2b4' }}
            />

            <View className="mt-2 flex-row items-center justify-between">
              <Text className="font-body text-[11px] text-ink-400">
                {touched && tooShort ? writeCopy.storyTooShort : writeCopy.storyNudge}
              </Text>
              <Text className="font-body text-[11px] text-ink-300">{length}/600</Text>
            </View>
          </View>

          {/* Not a form of prompts — a single nudge, then space to write. */}
          <View className="mt-6 px-5">
            <View className="rounded-card bg-rose-100 p-4">
              <Text className="font-display-italic text-[13px] leading-[20px] text-primary-700">
                {writeCopy.storyAside}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View
        className="absolute bottom-0 left-0 right-0 border-t border-hairline bg-paper-50 px-5"
        style={{ paddingBottom: Math.max(insets.bottom, 14), paddingTop: 12 }}>
        <Pressable
          onPress={() => {
            setTouched(true);
            if (valid) router.push(STEP_ROUTES.date);
          }}
          disabled={!valid}
          accessibilityRole="button"
          accessibilityState={{ disabled: !valid }}
          className="items-center justify-center rounded-card active:opacity-90"
          style={{ height: 52, backgroundColor: valid ? '#a03246' : '#d9cbb2' }}>
          <Text
            className="font-body-semibold text-[15px]"
            style={{ color: valid ? '#fdfaf4' : '#f3ecdd' }}>
            {writeCopy.continueLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
