import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { placesApi } from '@/api';
import type { WirePlace } from '@/api/types';
import { FlowHeader } from '@/components/write/FlowHeader';
import { STEP_ROUTES, useExperienceDraft } from '@/lib/experienceDraft';
import { writeCopy } from '@/data';
import { photo } from '@/theme/photoMap';

/** Peshawar — the centre used when the user has not granted location. */
const DEFAULT_CENTER = { lat: 34.015, lng: 71.58 };

export default function PlaceStep() {
  const insets = useSafeAreaInsets();
  const { draft, dispatch } = useExperienceDraft();
  const { placeId } = useLocalSearchParams<{ placeId: string }>();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WirePlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Arriving from a place page means the place is already decided.
  useEffect(() => {
    if (placeId) dispatch({ type: 'setPlace', placeId });
  }, [placeId, dispatch]);

  // Debounced server search. Debouncing matters here — each keystroke would
  // otherwise be a round trip, and the server fuzzy-matches on every call.
  const requestRef = useRef(0);

  const runSearch = useCallback(async (term: string) => {
    const ticket = ++requestRef.current;
    setLoading(true);
    setError(null);

    try {
      const result = await placesApi.searchPlaces({
        q: term.trim() || undefined,
        lat: DEFAULT_CENTER.lat,
        lng: DEFAULT_CENTER.lng,
        radius: 20000,
        limit: 25,
      });

      // Drop responses that a newer keystroke has already superseded.
      if (ticket === requestRef.current) setResults(result.places);
    } catch {
      if (ticket === requestRef.current) setError(writeCopy.placeSearchFailed);
    } finally {
      if (ticket === requestRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void runSearch(query);
    }, 280);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  const selected = results.find((place) => place.id === draft.placeId);

  return (
    <View className="flex-1 bg-paper-100">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 56}>
        <View style={{ paddingTop: insets.top + 8 }}>
          <FlowHeader
            current="place"
            closeLabel={writeCopy.closeFlow}
            onClose={() => router.dismissAll()}
          />
        </View>

        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
          <View className="px-5 pt-9">
            <Text className="font-body-semibold text-2xs uppercase text-primary-600">
              {writeCopy.stepEyebrow}
            </Text>
            <Text className="mt-3 font-display text-[30px] leading-[35px] text-ink-900">
              Where did you <Text className="font-display-italic text-primary-600">go</Text>?
            </Text>
          </View>

          <View className="mt-6 px-5">
            <View className="flex-row items-center gap-2.5 rounded-pill border border-border bg-paper-50 px-4">
              <MaterialCommunityIcons name="magnify" size={17} color="#9a8e85" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={writeCopy.searchPlaces}
                placeholderTextColor="#b8a37c"
                autoCorrect={false}
                returnKeyType="search"
                className="flex-1 py-3 font-body text-[13px] text-ink-900"
              />
              {query.length > 0 && (
                <Pressable
                  onPress={() => setQuery('')}
                  accessibilityRole="button"
                  accessibilityLabel={writeCopy.clearSearch}
                  hitSlop={8}
                  className="active:opacity-60">
                  <MaterialCommunityIcons name="close-circle" size={15} color="#b8a37c" />
                </Pressable>
              )}
            </View>
          </View>

          {error ? (
            <View className="mt-6 px-5">
              <View className="rounded-card bg-rose-100 p-4">
                <Text className="font-body text-[12px] leading-[18px] text-primary-700">
                  {error}
                </Text>
              </View>
              <Pressable
                onPress={() => void runSearch(query)}
                accessibilityRole="button"
                className="mt-3 self-center active:opacity-60">
                <Text className="font-body-semibold text-[12px] text-primary-600">
                  {writeCopy.tryAgain}
                </Text>
              </Pressable>
            </View>
          ) : loading && results.length === 0 ? (
            <View className="gap-2 px-5 pt-5">
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  className="h-[73px] rounded-card bg-surface"
                  style={{ opacity: 1 - i * 0.22 }}
                />
              ))}
            </View>
          ) : (
            <View className="mt-5 gap-2 px-5">
              {results.map((place) => {
                const active = place.id === draft.placeId;

                return (
                  <Pressable
                    key={place.id}
                    onPress={() => dispatch({ type: 'setPlace', placeId: place.id })}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    className="flex-row items-center gap-3 rounded-card border p-2.5 active:opacity-70"
                    style={{
                      borderColor: active ? '#a03246' : '#e0d2b4',
                      backgroundColor: active ? '#f7e3e5' : '#fdfaf4',
                    }}>
                    <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-[10px] bg-surface">
                      <Image
                        source={photo(placeThumbKey(place.category))}
                        style={{ width: 48, height: 48 }}
                        resizeMode="cover"
                        accessibilityIgnoresInvertColors
                      />
                    </View>

                    <View className="flex-1">
                      <Text className="font-body-semibold text-[13.5px] text-ink-900">
                        {place.name}
                      </Text>
                      <Text className="mt-0.5 font-body text-[11px] text-ink-400">
                        {place.category ?? writeCopy.placeUncategorised}
                        {place.city ? ` · ${place.city}` : ''}
                        {typeof place.distanceM === 'number'
                          ? ` · ${formatDistance(place.distanceM)}`
                          : ''}
                      </Text>
                    </View>

                    {active && (
                      <MaterialCommunityIcons name="check-circle" size={19} color="#a03246" />
                    )}
                  </Pressable>
                );
              })}

              {results.length === 0 && !loading && (
                <View className="items-center gap-2 py-10">
                  <Text className="font-display-semibold text-[15px] text-ink-700">
                    Nothing matches “{query.trim()}”
                  </Text>
                  <Text className="text-center font-body text-[12px] text-ink-400">
                    {writeCopy.cantFindPlace}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* README §13 — the escape hatch when a place is missing. */}
          <View className="mt-2 px-5">
            <Pressable
              onPress={() => router.push('/write/new-place')}
              accessibilityRole="button"
              className="flex-row items-center justify-center gap-2 rounded-card border border-dashed border-sand-400 py-3.5 active:opacity-70">
              <MaterialCommunityIcons name="plus" size={16} color="#a03246" />
              <Text className="font-body-semibold text-[12.5px] text-primary-600">
                {writeCopy.addNewPlace}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View
        className="absolute bottom-0 left-0 right-0 border-t border-hairline bg-paper-50 px-5"
        style={{ paddingBottom: Math.max(insets.bottom, 14), paddingTop: 12 }}>
        <Pressable
          onPress={() => router.push(STEP_ROUTES.photo)}
          disabled={!draft.placeId}
          accessibilityRole="button"
          accessibilityState={{ disabled: !draft.placeId }}
          className="items-center justify-center rounded-card active:opacity-90"
          style={{
            height: 52,
            backgroundColor: draft.placeId ? '#a03246' : '#d9cbb2',
          }}>
          <Text
            className="font-body-semibold text-[15px]"
            style={{ color: draft.placeId ? '#fdfaf4' : '#f3ecdd' }}>
            {selected ? writeCopy.continueFrom(selected.name) : writeCopy.choosePlaceFirst}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function formatDistance(metres: number): string {
  return metres < 1000 ? `${Math.round(metres)} m` : `${(metres / 1000).toFixed(1)} km`;
}

/**
 * The API's Place has no cover image, so the list falls back to a generated
 * thumbnail chosen by category. Deterministic, and it never claims to be a
 * photo of the place.
 */
function placeThumbKey(category: string | null): string {
  switch (category) {
    case 'cafe':
    case 'coffee':
      return 'beanstalk-coffee-hero-1';
    case 'hotel':
      return 'hotel-shahi-hero-1';
    case 'museum':
      return 'peshawar-museum-hero-1';
    case 'landmark':
      return 'bala-bagh-fort-hero-1';
    case 'park':
      return 'bala-bagh-fort-hero-2';
    case 'shop':
    case 'shopping':
      return 'qissa-khwani-bazaar-hero-1';
    default:
      return 'khyber-restaurant-hero-1';
  }
}
