import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { photo } from '@/theme/photoMap';

/**
 * Atmosphere for the auth screens: a warm wash built from the same generated
 * imagery the app already ships, so the entry points feel like the same object
 * as the product rather than a separate marketing skin.
 */
export function AuthBackdrop() {
  return (
    <View className="absolute inset-0" pointerEvents="none">
      <LinearGradient
        colors={['#fdfaf4', '#f7efe2', '#f3ecdd']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Two soft tints bleeding in from the top corners. */}
      <Image
        source={photo('janis-cafe-hero-2')}
        style={{
          position: 'absolute',
          top: -140,
          left: -110,
          width: 420,
          height: 420,
          opacity: 0.14,
        }}
        resizeMode="cover"
        blurRadius={38}
        accessibilityIgnoresInvertColors
      />
      <Image
        source={photo('cheezious-usmanzai-hero-1')}
        style={{
          position: 'absolute',
          top: -60,
          right: -140,
          width: 400,
          height: 400,
          opacity: 0.1,
        }}
        resizeMode="cover"
        blurRadius={44}
        accessibilityIgnoresInvertColors
      />

      {/* Fade the wash out toward the form so type stays crisp. */}
      <LinearGradient
        colors={['rgba(253,250,244,0)', 'rgba(250,245,236,0.86)', 'rgba(250,245,236,1)']}
        locations={[0, 0.5, 0.78]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

/** Hairline rule with a centred diamond — the editorial separator motif. */
export function Rule({ label }: { label?: string }) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-px flex-1 bg-sand-400" />
      {label ? (
        <Text className="font-body-semibold text-3xs uppercase text-ink-400">{label}</Text>
      ) : (
        <View className="h-1.5 w-1.5 rotate-45" style={{ backgroundColor: '#d9cbb2' }} />
      )}
      <View className="h-px flex-1 bg-sand-400" />
    </View>
  );
}
