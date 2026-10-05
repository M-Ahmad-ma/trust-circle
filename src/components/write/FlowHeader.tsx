import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { STEPS, useExperienceDraft, stepStatus, type StepId } from '@/lib/experienceDraft';

type FlowHeaderProps = {
  current: StepId;
  onClose: () => void;
  closeLabel: string;
};

/**
 * Progress rail rather than a numbered form header: each tick fills as its step
 * becomes valid, so the user can see how much is left without counting.
 */
export function FlowHeader({ current, onClose, closeLabel }: FlowHeaderProps) {
  const { draft } = useExperienceDraft();
  const activeIndex = STEPS.indexOf(current);

  return (
    <View>
      <View className="flex-row items-center justify-between px-5">
        <Text className="font-body-semibold text-3xs uppercase text-ink-400">New experience</Text>

        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
          hitSlop={10}
          className="h-8 w-8 items-center justify-center rounded-pill active:opacity-60">
          <MaterialCommunityIcons name="close" size={19} color="#6b6058" />
        </Pressable>
      </View>

      <View className="mt-3 flex-row gap-1.5 px-5">
        {STEPS.map((step, index) => {
          const done = index < activeIndex;
          const active = step === current;

          return (
            <View
              key={step}
              className="h-1 flex-1 rounded-pill"
              style={{
                backgroundColor:
                  active || done
                    ? '#a03246'
                    : stepStatus(draft, step).complete
                      ? '#d9a09f'
                      : '#e7dcc9',
              }}
            />
          );
        })}
      </View>
    </View>
  );
}
