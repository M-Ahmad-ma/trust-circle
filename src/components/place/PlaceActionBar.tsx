import { Pressable, Text, View } from 'react-native';

type PlaceActionBarProps = {
  writeLabel: string;
  /** Home-indicator inset, applied by the caller so the scroll reserve matches. */
  bottomInset: number;
  onWrite: () => void;
};

/** Measured by the screen so the scroll content can reserve exactly this much. */
export const ACTION_BAR_MIN_PADDING = 10;

/** Top padding (12) + the 50pt button + the minimum bottom padding (10). */
export const ACTION_BAR_CONTENT_HEIGHT = 72;

/** Must match what PlaceActionBar actually occupies, or content hides behind it. */
export function actionBarHeight(bottomInset: number) {
  return ACTION_BAR_CONTENT_HEIGHT + Math.max(0, bottomInset - ACTION_BAR_MIN_PADDING);
}

/**
 * Previously carried a "Save Place" heart backed by a local `useState` — it
 * persisted nothing, was not per-place, and had no endpoint behind it. It read
 * as a working feature and was not one, so it is gone rather than stubbed.
 * README §25 lists saving as a later feature; when it ships it will need a real
 * store, and a button is not one.
 */
export function PlaceActionBar({ writeLabel, bottomInset, onWrite }: PlaceActionBarProps) {
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
    </View>
  );
}
