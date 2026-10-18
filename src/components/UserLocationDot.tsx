import { View } from 'react-native';

/**
 * "You are here" puck for the Explore map.
 *
 * Deliberately not MapLibre's built-in `UserLocation`: that widget takes its own
 * reading from the OS, which would disagree with the fix the rest of the app is
 * using — the map's results, distances and recentre button would silently be
 * centred somewhere other than the dot. One source of truth for position.
 *
 * Blue and untextured on purpose. Every other pin on this map is coloured by
 * relationship proximity, so "where am I" must not borrow that vocabulary — a
 * red dot here would read as "someone in your Circle is here".
 */
export function UserLocationDot({ size = 22 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Soft halo gives the dot depth against the warm basemap. */}
      <View
        style={{
          position: 'absolute',
          width: size * 2,
          height: size * 2,
          borderRadius: size,
          backgroundColor: 'rgba(52,152,219,0.18)',
        }}
      />
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#3498db',
          borderWidth: 3,
          borderColor: '#fdfaf4',
          shadowColor: '#1c1815',
          shadowOpacity: 0.3,
          shadowRadius: 5,
          shadowOffset: { width: 0, height: 2 },
          elevation: 4,
        }}
      />
    </View>
  );
}
