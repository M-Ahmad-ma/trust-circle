import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

type PlaceActionBarProps = {
  writeLabel: string;
  saveLabel: string;
  savedLabel: string;
  saved: boolean;
  /** Home-indicator inset, applied by the caller so the scroll reserve matches. */
  bottomInset: number;
  onWrite: () => void;
  onToggleSave: () => void;
};

/** Measured by the screen so the scroll content can reserve exactly this much. */
export const ACTION_BAR_MIN_PADDING = 10;
export const ACTION_BAR_CONTENT_HEIGHT = 104;

/** Must match what PlaceActionBar actually occupies, or content hides behind it. */
export function actionBarHeight(bottomInset: number) {
  return ACTION_BAR_CONTENT_HEIGHT + Math.max(0, bottomInset - ACTION_BAR_MIN_PADDING);
}

export function PlaceActionBar({
  writeLabel,
  saveLabel,
  savedLabel,
  saved,
  bottomInset,
  onWrite,
  onToggleSave,
}: PlaceActionBarProps) {
  return (
    <View
      className="border-t border-sand-300 bg-paper-50 px-4 pt-3"
      style={{ paddingBottom: Math.max(bottomInset, ACTION_BAR_MIN_PADDING) }}>
      <Pressable
        onPress={onWrite}
        accessibilityRole="button"
        className="items-center justify-center rounded-[14px] bg-primary-600 active:bg-primary-700"
        style={{
          height: 50,
          shadowColor: '#7e2534',
          shadowOpacity: 0.26,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 5 },
          elevation: 4,
        }}>
        <Text className="font-body-semibold text-[15px] text-primary-fg">{writeLabel}</Text>
      </Pressable>

      <Pressable
        onPress={onToggleSave}
        accessibilityRole="button"
        accessibilityState={{ selected: saved }}
        accessibilityLabel={saved ? savedLabel : saveLabel}
        className="mt-2.5 flex-row items-center justify-center gap-1.5 active:opacity-60"
        style={{ height: 22 }}>
        <MaterialCommunityIcons
          name={saved ? 'heart' : 'heart-outline'}
          size={16}
          color="#a03246"
        />
        <Text className="font-body-medium text-[13px] text-primary-600">
          {saved ? savedLabel : saveLabel}
        </Text>
      </Pressable>
    </View>
  );
}
