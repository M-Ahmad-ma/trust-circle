import { Pressable, ScrollView, Text, View } from 'react-native';

import { Monogram } from '@/components/Monogram';
import { initialsFrom } from '@/lib/validation';

/** The palette offered at sign-up — sampled from the Circle roster so a new
 *  member's disc looks native beside everyone else's. */
export const TINT_CHOICES = [
  '#a03246',
  '#4a6b52',
  '#c08a2e',
  '#6e5a86',
  '#a0695a',
  '#d6a59f',
  '#799b91',
  '#be883a',
];

const SWATCH = 34;

type IdentityPickerProps = {
  name: string;
  tint: string;
  onTintChange: (tint: string) => void;
};

export function IdentityPicker({ name, tint, onTintChange }: IdentityPickerProps) {
  const initials = initialsFrom(name);

  return (
    <View>
      <Text className="font-body-semibold text-3xs uppercase text-ink-400">
        Your mark in the Circle
      </Text>

      <View className="mt-3 flex-row items-center gap-4">
        <Monogram initials={initials} tint={tint} size={56} />

        <View className="flex-1">
          <Text className="font-body text-[11px] leading-4 text-ink-400">
            Everyone here recognises people by a two-letter mark. Yours is derived from your name —{' '}
            <Text className="font-body-semibold text-ink-700">{initials}</Text>.
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-2.5 grow-0"
            contentContainerStyle={{ gap: 8 }}>
            {TINT_CHOICES.map((choice) => {
              const selected = choice === tint;

              return (
                <Pressable
                  key={choice}
                  onPress={() => onTintChange(choice)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Choose colour ${choice}`}
                  className="items-center justify-center rounded-pill"
                  style={{
                    width: SWATCH,
                    height: SWATCH,
                    backgroundColor: choice,
                    borderWidth: selected ? 2 : 0,
                    borderColor: '#1c1815',
                    transform: [{ scale: selected ? 1.12 : 1 }],
                  }}
                />
              );
            })}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}
