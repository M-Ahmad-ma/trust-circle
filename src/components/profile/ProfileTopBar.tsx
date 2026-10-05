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
      <View className="h-12 flex-row items-center justify-between px-3">
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={backLabel}
          hitSlop={10}
          className="h-10 w-10 items-center justify-center active:opacity-60">
          <MaterialCommunityIcons name="chevron-left" size={26} color="#292426" />
        </Pressable>

        <Text className="font-body-bold text-[15px] text-ink-900">@{handle}</Text>

        <Pressable
          onPress={onSettings}
          accessibilityRole="button"
          accessibilityLabel={settingsLabel}
          hitSlop={10}
          className="h-10 w-10 items-center justify-center active:opacity-60">
          <MaterialCommunityIcons name="cog-outline" size={21} color="#292426" />
        </Pressable>
      </View>
    </View>
  );
}
