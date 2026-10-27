import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Camera, Map, Marker } from '@maplibre/maplibre-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { isApiError } from '@/api/errors';
import { distanceM, geocodePlaces, type GeocodeResult } from '@/api/endpoints/geocoding';
import { extractPhotoLocation } from '@/lib/photoExif';
import type { Coords, UserLocation } from '@/lib/useUserLocation';
import { mapStyle, PLACE_FOCUS_PADDING, PLACE_FOCUS_ZOOM } from '@/theme/mapStyle';

type Props = {
  /** The chosen point, or null while nothing has been picked yet. */
  value: Coords | null;
  onChange: (coords: Coords) => void;
  /** Where the map opens — the user's fix, or the app's fallback city. */
  center: Coords;
  userLocation: UserLocation;
  /** Fires when a search result is picked, so the form can prefill name/city/category. */
  onPickResult?: (result: GeocodeResult) => void;
  /**
   * `inline` pins a 224 px map above a form. `sheet` fills its parent, for the
   * full-height location picker where the map is the whole task.
   */
  variant?: 'inline' | 'sheet';
};

const SEARCH_DEBOUNCE_MS = 400;
const MIN_QUERY = 3;
const MAP_HEIGHT = 224;

/**
 * EXIF is precise to a few metres; the app's own fix is deliberately coarse
 * (`Balanced`). If they disagree by more than this, the photo was almost
 * certainly taken somewhere else — an old shot is the common way this goes
 * wrong, and it would otherwise place a venue silently at the wrong pin.
 */
const CROSS_CHECK_TOLERANCE_M = 500;

type PhotoVerdict = 'matched' | 'moved' | 'unknown';

/**
 * The map *is* the coordinate input for a new place. In `inline` mode it sits
 * outside any vertical ScrollView — nested inside one, the parent wins the
 * vertical gesture and the map only pans horizontally. In `sheet` mode the
 * caller gives it the whole screen, so the map and its controls have room and
 * the form underneath stays short.
 *
 * Four ways to set a point, because each fails differently:
 *   • take a photo      — exact, but needs GPS metadata the photo may not carry
 *   • "Use my location" — one tap, needs permission
 *   • tap the map       — always works, no permission, no network
 *   • search            — finds a place by name
 */
export function PlaceLocationPicker({
  value,
  onChange,
  center,
  userLocation,
  onPickResult,
  variant = 'inline',
}: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchedTerm, setSearchedTerm] = useState('');
  const [camera, setCamera] = useState<{ coords: Coords; zoom: number }>({
    coords: center,
    zoom: PLACE_FOCUS_ZOOM,
  });
  const [readingPhoto, setReadingPhoto] = useState(false);
  const [photoNote, setPhotoNote] = useState<string | null>(null);
  const [photoVerdict, setPhotoVerdict] = useState<PhotoVerdict | null>(null);

  // Guards against a slow earlier search overwriting a newer one.
  const requestRef = useRef(0);

  useEffect(() => {
    const term = query.trim();

    // Bump the ticket even on the early return, so a request already in flight
    // for a longer term is discarded rather than repopulating a cleared box.
    const ticket = ++requestRef.current;
    if (term.length < MIN_QUERY) return;

    const timer = setTimeout(() => {
      // Only now is there something to report: the spinner appears when the
      // request actually starts, not for the duration of the debounce.
      setSearching(true);

      void (async () => {
        try {
          const found = await geocodePlaces({
            q: term,
            lat: camera.coords.lat,
            lng: camera.coords.lng,
          });
          if (ticket !== requestRef.current) return;
          setResults(found);
          setSearchedTerm(term);
          setSearchError(null);
        } catch (error) {
          if (ticket !== requestRef.current) return;
          setResults([]);
          setSearchedTerm(term);
          // The shared Nominatim instance is rate-limited and can be down.
          // Saying so beats an empty list, which reads as "no such place".
          setSearchError(
            isApiError(error) && error.code === 'GEOCODER_UNAVAILABLE'
              ? 'Search is unavailable right now. Tap the map instead.'
              : 'Search failed. Tap the map instead.'
          );
        } finally {
          if (ticket === requestRef.current) setSearching(false);
        }
      })();
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, camera.coords.lat, camera.coords.lng]);

  // Below the minimum, nothing from a previous longer query may keep showing.
  const tooShort = query.trim().length < MIN_QUERY;
  const visibleResults = tooShort ? [] : results;
  const searchingNow = tooShort ? false : searching;

  const moveTo = (coords: Coords, zoom = PLACE_FOCUS_ZOOM) => {
    setCamera({ coords, zoom });
    onChange(coords);
  };

  const useMyLocation = () => {
    if (userLocation.isFallback) {
      if (userLocation.canAskAgain) userLocation.request();
      else userLocation.openSettings();
      return;
    }
    // A step back from the tightest zoom: this is "roughly here", and the fix
    // is coarse, so maximum zoom would imply a precision it does not have.
    moveTo(userLocation.coords, PLACE_FOCUS_ZOOM - 2);
  };

  /**
   * Takes a photo purely to read where it was taken. `quality: 1` is the point
   * — a re-encode is what strips GPS metadata in the first place. The photo is
   * never uploaded, so its size costs nothing, which is why this can be
   * full-quality while experience photos stay compressed.
   */
  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera access is off', 'Enable it in Settings to find the location this way.');
      return;
    }

    setReadingPhoto(true);
    setPhotoNote(null);
    setPhotoVerdict(null);

    try {
      const shot = await ImagePicker.launchCameraAsync({ quality: 1 });
      if (shot.canceled) return;

      const asset = shot.assets[0];
      const found = await extractPhotoLocation(asset.uri);

      if (!found) {
        setPhotoVerdict('unknown');
        setPhotoNote('No location saved in that photo. Use your location, search, or tap the map.');
        return;
      }

      const coords = { lat: found.lat, lng: found.lng };

      // Cross-check against a live fix. This is the guard that stops an old
      // photo from silently placing a venue at wherever the user used to be.
      if (!userLocation.isFallback) {
        const gap = distanceM(userLocation.coords, coords);
        if (gap > CROSS_CHECK_TOLERANCE_M) {
          const km = (gap / 1000).toFixed(1);
          const when = found.takenAt ? ` It was taken ${found.takenAt.toLocaleDateString()}.` : '';
          Alert.alert(
            'That photo was taken elsewhere',
            `It was shot ${km} km from where you are now.${when} Place it here anyway?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Use it anyway', onPress: () => applyPhoto(coords, 'moved') },
            ]
          );
          return;
        }
      }

      applyPhoto(coords, 'matched');
    } catch {
      setPhotoVerdict('unknown');
      setPhotoNote('That photo could not be read. Use your location, search, or tap the map.');
    } finally {
      setReadingPhoto(false);
    }
  };

  const applyPhoto = (coords: Coords, verdict: PhotoVerdict) => {
    moveTo(coords);
    setPhotoVerdict(verdict);
    setPhotoNote(
      verdict === 'matched'
        ? 'Placed from your photo, and it matches where you are.'
        : 'Placed from your photo. Check the pin.'
    );
  };

  const pick = (result: GeocodeResult) => {
    moveTo({ lat: result.lat, lng: result.lng }, PLACE_FOCUS_ZOOM);
    setQuery('');
    setResults([]);
    setPhotoNote(null);
    setPhotoVerdict(null);
    onPickResult?.(result);
  };

  const markerAt = value ?? center;
  const isSheet = variant === 'sheet';

  return (
    <View
      className={
        isSheet ? 'flex-1 bg-paper-100' : 'flex-shrink-0 border-b border-hairline bg-paper-100'
      }>
      <View style={isSheet ? { flex: 1 } : { height: MAP_HEIGHT }}>
        <Map
          mapStyle={mapStyle}
          style={StyleSheet.absoluteFill}
          logo={false}
          attribution={false}
          compass={false}
          scaleBar={false}
          onPress={(event) => {
            // LngLat is a tuple: [longitude, latitude] — the reverse of the
            // {lat, lng} shape used everywhere else in the app.
            const [lng, lat] = event.nativeEvent.lngLat;
            moveTo({ lat, lng });
            setPhotoNote(null);
            setPhotoVerdict(null);
          }}>
          <Camera
            // Re-keyed so picking a result or using the location button flies
            // the map instead of leaving it behind the pin.
            key={`${camera.coords.lat},${camera.coords.lng},${camera.zoom}`}
            center={[camera.coords.lng, camera.coords.lat]}
            zoom={camera.zoom}
            padding={PLACE_FOCUS_PADDING}
            duration={600}
          />

          {/* `@maplibre/maplibre-react-native`'s Marker has no draggable
              support, so the pin is moved by tapping the map instead. */}
          <Marker lngLat={[markerAt.lng, markerAt.lat]} anchor="center">
            <PinCrosshair placed={value !== null} />
          </Marker>
        </Map>

        <View className="absolute bottom-2 left-2 rounded-pill bg-ink-800/85 px-2.5 py-1">
          <Text className="font-body-medium text-[9.5px] text-paper-50">
            {value
              ? `Tap to move · ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`
              : 'Tap the map to place the pin'}
          </Text>
        </View>

        {/* Results overlay the map rather than pushing the layout down, so
            opening a search never squeezes the form off screen. */}
        {visibleResults.length > 0 && (
          <View className="absolute inset-x-0 bottom-0 border-t border-hairline bg-paper-50">
            <ScrollView className="grow-0" style={{ maxHeight: 148 }}>
              {visibleResults.map((result) => (
                <Pressable
                  key={result.id}
                  onPress={() => pick(result)}
                  accessibilityRole="button"
                  accessibilityLabel={result.name}
                  className="flex-row items-center gap-2 border-b border-hairline px-3 py-2.5 active:opacity-70">
                  <MaterialCommunityIcons name="map-marker-outline" size={15} color="#a03246" />
                  <View className="flex-1">
                    <Text
                      numberOfLines={1}
                      className="font-body-semibold text-[12.5px] text-ink-900">
                      {result.name}
                    </Text>
                    <Text numberOfLines={1} className="mt-0.5 font-body text-[10.5px] text-ink-400">
                      {result.displayName}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <View className={isSheet ? 'gap-2 px-4 pb-4 pt-3' : 'gap-2 px-4 pt-3'}>
        <View className="flex-row gap-2">
          <Pressable
            onPress={takePhoto}
            disabled={readingPhoto}
            accessibilityRole="button"
            accessibilityLabel="Take a photo to find the location"
            className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-card border border-dashed border-sand-400 active:opacity-70"
            style={{ opacity: readingPhoto ? 0.6 : 1 }}>
            {readingPhoto ? (
              <ActivityIndicator size="small" color="#a03246" />
            ) : (
              <MaterialCommunityIcons name="camera-outline" size={15} color="#a03246" />
            )}
            <Text className="font-body-semibold text-[12px] text-primary-600">
              {readingPhoto ? 'Reading photo…' : 'Use a photo'}
            </Text>
          </Pressable>

          <Pressable
            onPress={useMyLocation}
            accessibilityRole="button"
            accessibilityLabel="Use my location"
            className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-card border border-dashed border-sand-400 active:opacity-70">
            <MaterialCommunityIcons name="crosshairs-gps" size={15} color="#a03246" />
            <Text numberOfLines={1} className="font-body-semibold text-[12px] text-primary-600">
              {userLocation.isFallback && !userLocation.canAskAgain
                ? 'Open settings'
                : 'My location'}
            </Text>
          </Pressable>
        </View>

        <View className="flex-row items-center gap-2.5 rounded-card border border-border bg-paper-50 px-3">
          <MaterialCommunityIcons name="magnify" size={16} color="#9a8e85" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Or search for a place"
            placeholderTextColor="#b8a37c"
            autoCorrect={false}
            autoCapitalize="words"
            returnKeyType="search"
            accessibilityLabel="Search for a place"
            className="flex-1 py-2.5 font-body text-[12.5px] text-ink-900"
          />
          {searchingNow && <ActivityIndicator size="small" color="#a03246" />}
          {query.length > 0 && !searchingNow && (
            <Pressable
              onPress={() => setQuery('')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Clear search">
              <MaterialCommunityIcons name="close-circle" size={15} color="#b8a37c" />
            </Pressable>
          )}
        </View>

        {photoNote && (
          <View
            className="flex-row items-center gap-2 rounded-card px-3 py-2"
            style={{
              backgroundColor:
                photoVerdict === 'moved'
                  ? '#fbeada'
                  : photoVerdict === 'unknown'
                    ? '#efe7d6'
                    : '#eef4ee',
            }}>
            <MaterialCommunityIcons
              name={
                photoVerdict === 'moved'
                  ? 'alert-outline'
                  : photoVerdict === 'unknown'
                    ? 'information-outline'
                    : 'check-circle-outline'
              }
              size={14}
              color={
                photoVerdict === 'moved'
                  ? '#d97a2b'
                  : photoVerdict === 'unknown'
                    ? '#6b6058'
                    : '#4a6b52'
              }
            />
            <Text className="flex-1 font-body text-[11px] leading-[16px] text-ink-600">
              {photoNote}
            </Text>
          </View>
        )}

        {searchError && (
          <Text className="font-body text-[10.5px] leading-[15px] text-danger-600">
            {searchError}
          </Text>
        )}

        {!searchError && !searchingNow && searchedTerm && visibleResults.length === 0 && (
          <Text className="font-body text-[10.5px] leading-[15px] text-ink-400">
            Nothing found for “{searchedTerm}” near this map. Tap the map to place the pin.
          </Text>
        )}
      </View>
    </View>
  );
}

/** The map pin — a crosshair, deliberately unlike every other marker. */
function PinCrosshair({ placed }: { placed: boolean }) {
  return (
    <View style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          position: 'absolute',
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: 'rgba(160,50,70,0.16)',
        }}
      />
      <View
        style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          borderWidth: placed ? 3 : 2,
          borderColor: placed ? '#a03246' : '#6b6058',
          backgroundColor: '#fdfaf4',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <View
          style={{
            width: placed ? 5 : 4,
            height: placed ? 5 : 4,
            borderRadius: placed ? 2.5 : 2,
            backgroundColor: placed ? '#a03246' : '#6b6058',
          }}
        />
      </View>
    </View>
  );
}
