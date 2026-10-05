import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

type CircleHeaderProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  inviteLabel: string;
  onInvite: () => void;
};

export function CircleHeader({
  eyebrow,
  title,
  subtitle,
  inviteLabel,
  onInvite,
}: CircleHeaderProps) {
  return (
    <View className="flex-row items-start justify-between px-4 pt-2">
      <View className="flex-1 pr-3">
        <Text className="font-body-semibold text-2xs uppercase text-ink-400">{eyebrow}</Text>
        <Text className="mt-1.5 font-display text-[30px] leading-9 text-ink-800">{title}</Text>
        <Text className="mt-2 font-body text-[12px] leading-[17px] text-ink-500">{subtitle}</Text>
      </View>

      {/* Round add button — a circle, not a pill, so it clears the title block. */}
      <Pressable
        onPress={onInvite}
        accessibilityRole="button"
        accessibilityLabel={inviteLabel}
        className="mt-1 h-11 w-11 items-center justify-center rounded-pill bg-primary-600 active:bg-primary-700"
        style={{
          shadowColor: '#7e2534',
          shadowOpacity: 0.3,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        }}>
        <MaterialCommunityIcons name="plus" size={24} color="#fdfaf4" />
      </Pressable>
    </View>
  );
}
