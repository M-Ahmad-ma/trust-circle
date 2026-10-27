import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

type ToastProps = {
  visible: boolean;
  title: string;
  message?: string;
  onDismiss: () => void;
  /** How long the toast stays up before dismissing itself. */
  duration?: number;
  /** Distance from the top of the screen, typically below the header/back button. */
  topOffset?: number;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
};

/**
 * A transient notice that floats over the screen rather than sitting in the
 * scroll content. That matters for messages caused by navigation — by the time
 * the destination renders, an inline banner reads as part of the page, and a
 * user who scrolled past it has lost the explanation entirely.
 *
 * It is deliberately not a modal: nothing here needs an answer, so it must not
 * interrupt or require a tap. The close button exists for people who want it
 * gone sooner.
 */
export function Toast({
  visible,
  title,
  message,
  onDismiss,
  duration = 4500,
  topOffset = 0,
  icon = 'information-outline',
}: ToastProps) {
  // Animation values are mutable objects, but they are read during render in
  // the style below. Keeping them in state gives them a stable identity without
  // tripping the "ref read during render" rule; the setter is never used.
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(-10));

  // A caller may pass an inline closure; keeping it in a ref stops the timer
  // from restarting on every parent render.
  const dismissRef = useRef(onDismiss);
  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!visible) return;

    opacity.setValue(0);
    translateY.setValue(-10);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        damping: 18,
        stiffness: 220,
        mass: 0.7,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) dismissRef.current();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [visible, duration, opacity, translateY]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        top: topOffset,
        zIndex: 50,
        opacity,
        transform: [{ translateY }],
      }}>
      <View
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        accessibilityLabel={message ? `${title}. ${message}` : title}
        className="flex-row items-start gap-2.5 rounded-card px-4 py-3"
        style={{
          backgroundColor: '#1c1815',
          shadowColor: '#1c1815',
          shadowOpacity: 0.24,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        }}>
        <MaterialCommunityIcons name={icon} size={17} color="#fdfaf4" />

        <View className="flex-1">
          <Text className="font-body-semibold text-[12.5px] leading-[17px] text-paper-50">
            {title}
          </Text>
          {message ? (
            <Text
              className="mt-0.5 font-body text-[11px] leading-[17px]"
              style={{ color: '#e7dcc9' }}>
              {message}
            </Text>
          ) : null}
        </View>

        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification"
          hitSlop={8}
          className="active:opacity-60">
          <MaterialCommunityIcons name="close" size={15} color="#e7dcc9" />
        </Pressable>
      </View>
    </Animated.View>
  );
}
