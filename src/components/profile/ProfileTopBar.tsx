import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

type ProfileTopBarProps = {
  handle: string;
  backLabel: string;
  settingsLabel: string;
  onBack: () => void;
  onSettings: () => void;
  topInset: number;
};

export function ProfileTopBar({
  handle,
  backLabel,
  settingsLabel,
  onBack,
  onSettings,
  topInset,
}: ProfileTopBarProps) {
  return (
    <View className="border-b border-hairline bg-paper-50" style={{ paddingTop: topInset }}>
      <View className="relative  h-12 px-3 ">
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={backLabel}
          hitSlop={10}
          className="h-10 w-10  active:opacity-60">
          <MaterialCommunityIcons name="chevron-left" size={26} color="#292426" />
        </Pressable>

        <Text className=" absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-body-bold text-[15px] text-ink-900">
          @{handle}
        </Text>
      </View>
    </View>
  );
}
