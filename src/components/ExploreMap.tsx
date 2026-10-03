import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Camera, Map, Marker } from '@maplibre/maplibre-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  attributionNotice,
  mapStyle,
  peshawarOverview,
  PLACE_FOCUS_DURATION,
  PLACE_FOCUS_PADDING,
  PLACE_FOCUS_ZOOM,
} from '@/theme/mapStyle';
import type { Place } from '@/types';
import { PinMarker } from './PinMarker';

type ExploreMapProps = {
  places: Place[];
  selectedId: string;
  onSelect: (id: string) => void;
};

function OverlayButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      className="h-10 w-10 items-center justify-center rounded-pill bg-paper-50"
      style={{
        shadowColor: '#1c1815',
        shadowOpacity: 0.16,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
      }}>
      <MaterialCommunityIcons name={icon} size={19} color="#4a423b" />
    </Pressable>
  );
}

export function ExploreMap({ places, selectedId, onSelect }: ExploreMapProps) {
  const activePlace = places.find((place) => place.id === selectedId);

  return (
    <View className="flex-1 overflow-hidden bg-sand-300">
      <Map
        mapStyle={mapStyle}
        style={StyleSheet.absoluteFill}
        logo={false}
        attribution={false}
        compass={false}
        scaleBar={false}
        touchPitch={false}>
        {/* Re-keying on the selected id re-runs the camera stop, so tapping a
            pin flies the map to that place instead of leaving it at city scale. */}
        <Camera
          key={selectedId}
          center={activePlace?.lngLat ?? [peshawarOverview.longitude, peshawarOverview.latitude]}
          zoom={activePlace ? PLACE_FOCUS_ZOOM : peshawarOverview.zoomLevel}
          padding={PLACE_FOCUS_PADDING}
          duration={PLACE_FOCUS_DURATION}
          easing="fly"
        />

        {places.map((place) => (
          <Marker key={place.id} lngLat={place.lngLat} anchor="center">
            <PinMarker place={place} selected={place.id === selectedId} onPress={onSelect} />
          </Marker>
        ))}
      </Map>

      {/* Map controls */}
      <View className="absolute right-3 top-16 gap-2.5">
        <OverlayButton icon="layers-outline" label="Map layers" />
        <OverlayButton icon="navigation-variant" label="Recenter on me" />
      </View>

      {/* Circle filter chip */}
      <View
        className="absolute bottom-3 left-3 flex-row items-center gap-1.5 rounded-pill bg-paper-50 px-3 py-2"
        style={{
          shadowColor: '#1c1815',
          shadowOpacity: 0.12,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: 3,
        }}>
        <MaterialCommunityIcons name="account-group-outline" size={14} color="#8e2c39" />
        <Text className="font-body-medium text-[11px] text-ink-700">
          Places through your people
        </Text>
      </View>

      {/* Attribution — required wherever these tiles appear, so it stays
          legible rather than hidden behind the map's own control. */}
      <View className="absolute bottom-1 right-2 items-end">
        {attributionNotice.lines.map((line) => (
          <Text key={line} className="font-body text-[8px] leading-3 text-ink-400">
            {line}
          </Text>
        ))}
      </View>
    </View>
  );
}
