import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import type { Experience, ExperienceSignals } from '@/types';

const ORDER: (keyof ExperienceSignals)[] = ['photo', 'visitDetails', 'confirmed'];

type ExperienceSignalsProps = {
  experiences: Experience[];
  labels: Record<keyof ExperienceSignals, string>;
  note: string;
  title: string;
};

/**
 * A signal is only ticked when every visible experience carries it; otherwise the
 * count is shown instead. Claiming "Place confirmed" for a place where one
 * review could not be verified would be the exact lie this section exists to
 * prevent.
 */
export function ExperienceSignalsSection({
  experiences,
  labels,
  note,
  title,
}: ExperienceSignalsProps) {
  const total = experiences.length;

  const tally = ORDER.map((key) => {
    const held = experiences.filter((experience) => experience.signals[key]).length;
    return { key, held, universal: total > 0 && held === total };
  });

  return (
    <View className="mt-8 px-4">
      <Text className="font-display-semibold text-[16px] text-ink-800">{title}</Text>

      <View className="mt-3.5 gap-3">
        {tally.map(({ key, held, universal }) => (
          <View key={key} className="flex-row items-center gap-3">
            {universal ? (
              <View className="h-[18px] w-[18px] items-center justify-center rounded-pill bg-primary-500">
                <MaterialCommunityIcons name="check" size={11} color="#fdfaf4" />
              </View>
            ) : (
              <View className="h-[18px] w-[18px] items-center justify-center rounded-pill border border-sand-500">
                <MaterialCommunityIcons name="minus" size={11} color="#b8a37c" />
              </View>
            )}

            <Text className="flex-1 font-body text-[13px] text-ink-600">{labels[key]}</Text>

            {!universal && (
              <Text className="font-body-medium text-[11px] text-ink-400">
                {held} of {total}
              </Text>
            )}
          </View>
        ))}
      </View>

      <Text className="mt-4 font-display-italic text-[11px] text-ink-400">{note}</Text>
    </View>
  );
}
