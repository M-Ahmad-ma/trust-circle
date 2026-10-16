import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Camera, Map, Marker } from '@maplibre/maplibre-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ExperienceCard, WirePlace } from '@/api/types';
import { ExperiencePinMarker } from '@/components/ExperiencePinMarker';
import { PinMarker } from '@/components/PinMarker';
import {
  attributionNotice,
  mapStyle,
  peshawarOverview,
  PLACE_FOCUS_DURATION,
  PLACE_FOCUS_PADDING,
  PLACE_FOCUS_ZOOM,
} from '@/theme/mapStyle';
import type { Coords } from '@/lib/useUserLocation';

/** What the pins on the map represent. README §9 — the map is about experiences. */
export type ExploreLayer = 'places' | 'experiences';

type ExploreMapProps = {
  places: WirePlace[];
  experiences: ExperienceCard[];
  layer: ExploreLayer;
  selectedPlaceId: string | null;
  selectedExperienceId: string | null;
  /** Fallback centre when nothing is selected. */
  center: Coords;
  onSelectPlace: (id: string) => void;
  onSelectExperience: (id: string) => void;
  /** Bumped to force a camera return to `center`; the map cannot do it itself. */
  recenterToken: number;
  onRecenter: () => void;
  /** Drives the recentre button's pressed state while a fix is in flight. */
  locating: boolean;
  /** False when the OS will not prompt, so the button opens Settings instead. */
  canAskAgain: boolean;
};

function OverlayButton({
  icon,
  label,
  onPress,
  tint,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  onPress?: () => void;
  tint?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      className="h-10 w-10 items-center justify-center rounded-pill bg-paper-50 active:opacity-70"
      style={{
        shadowColor: '#1c1815',
        shadowOpacity: 0.16,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
      }}>
      <MaterialCommunityIcons name={icon} size={19} color={tint ?? '#4a423b'} />
    </Pressable>
  );
}

export function ExploreMap({
  places,
  experiences,
  layer,
  selectedPlaceId,
  selectedExperienceId,
  center,
  onSelectPlace,
  onSelectExperience,
  recenterToken,
  onRecenter,
  locating,
  canAskAgain,
}: ExploreMapProps) {
  const activePlace = places.find((place) => place.id === selectedPlaceId);
  const activeExperience = experiences.find((item) => item.id === selectedExperienceId);

  // Exactly one of these is focused at a time, so the camera has a single truth.
  const focus =
    layer === 'places' && activePlace
      ? { lng: activePlace.lng, lat: activePlace.lat, zoom: PLACE_FOCUS_ZOOM }
      : layer === 'experiences' && activeExperience
        ? {
            lng: activeExperience.place.lng,
            lat: activeExperience.place.lat,
            zoom: PLACE_FOCUS_ZOOM,
          }
        : { lng: center.lng, lat: center.lat, zoom: peshawarOverview.zoomLevel };

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
        {/* Re-keying on the selection re-runs the camera stop, so tapping a pin
            flies the map to it instead of leaving it at city scale. The recentre
            token is folded into the key so an explicit "centre on me" re-runs the
            same stop — MapLibre holds its own camera and will not move on its own. */}
        <Camera
          key={`${layer}:${selectedPlaceId ?? ''}:${selectedExperienceId ?? ''}:${recenterToken}`}
          center={[focus.lng, focus.lat]}
          zoom={focus.zoom}
          padding={PLACE_FOCUS_PADDING}
          duration={PLACE_FOCUS_DURATION}
          easing="fly"
        />

        {layer === 'places'
          ? places.map((place) => (
              <Marker key={place.id} lngLat={[place.lng, place.lat]} anchor="center">
                <PinMarker
                  place={place}
                  selected={place.id === selectedPlaceId}
                  onPress={onSelectPlace}
                />
              </Marker>
            ))
          : experiences.map((experience) => (
              <Marker
                key={experience.id}
                lngLat={[experience.place.lng, experience.place.lat]}
                anchor="center">
                <ExperiencePinMarker
                  experience={experience}
                  selected={experience.id === selectedExperienceId}
                  onPress={onSelectExperience}
                />
              </Marker>
            ))}
      </Map>

      {/* The old "Map layers" button is gone rather than left inert: places and
          experiences are now a real toggle (ExploreLayerToggle), and a second
          control that looks like it does something but cannot is worse than no
          control at all. */}
      <View className="absolute right-3 top-16">
        <OverlayButton
          icon={locating ? 'loading' : 'navigation-variant'}
          label={canAskAgain ? 'Recenter on me' : 'Open location settings'}
          onPress={onRecenter}
          tint={locating ? '#a03246' : undefined}
        />
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
