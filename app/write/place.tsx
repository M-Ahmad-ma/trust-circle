import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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

import { FlowHeader } from '@/components/write/FlowHeader';
import { writeCopy, places } from '@/data';
import { photo } from '@/theme/photoMap';
import { STEP_ROUTES, useExperienceDraft } from '@/lib/experienceDraft';

export default function PlaceStep() {
  const insets = useSafeAreaInsets();
  const { draft, dispatch } = useExperienceDraft();
  const { placeId } = useLocalSearchParams<{ placeId: string }>();
  const [query, setQuery] = useState('');

  // Arriving from a place page means the place is already decided.
  useEffect(() => {
    if (placeId && places.some((place) => place.id === placeId)) {
      dispatch({ type: 'setPlace', placeId });
    }
  }, [placeId, dispatch]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return places;
    return places.filter(
      (place) =>
        place.name.toLowerCase().includes(needle) ||
        place.neighbourhood.toLowerCase().includes(needle) ||
        place.categoryLabel.toLowerCase().includes(needle)
    );
  }, [query]);

  const selected = places.find((place) => place.id === draft.placeId);

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
            </View>
          </View>

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
                  <Image
                    source={photo(place.photos[0])}
                    style={{ width: 48, height: 48, borderRadius: 10 }}
                    resizeMode="cover"
                    accessibilityIgnoresInvertColors
                  />

                  <View className="flex-1">
                    <Text className="font-body-semibold text-[13.5px] text-ink-900">
                      {place.name}
                    </Text>
                    <Text className="mt-0.5 font-body text-[11px] text-ink-400">
                      {place.categoryLabel} · {place.neighbourhood}
                    </Text>
                  </View>

                  {active && (
                    <MaterialCommunityIcons name="check-circle" size={19} color="#a03246" />
                  )}
                </Pressable>
              );
            })}

            {results.length === 0 && (
              <View className="items-center gap-2 py-10">
                <Text className="font-display-semibold text-[15px] text-ink-700">
                  Nothing matches “{query.trim()}”
                </Text>
                <Text className="text-center font-body text-[12px] text-ink-400">
                  {writeCopy.cantFindPlace}
                </Text>
              </View>
            )}

            {/* README §13 — the escape hatch when a place is missing. */}
            <Pressable
              onPress={() => {}}
              accessibilityRole="button"
              className="mt-1 flex-row items-center justify-center gap-2 rounded-card border border-dashed border-sand-400 py-3.5 active:opacity-70">
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
          disabled={!selected}
          accessibilityRole="button"
          accessibilityState={{ disabled: !selected }}
          className="items-center justify-center rounded-card active:opacity-90"
          style={{
            height: 52,
            backgroundColor: selected ? '#a03246' : '#d9cbb2',
          }}>
          <Text
            className="font-body-semibold text-[15px]"
            style={{ color: selected ? '#fdfaf4' : '#f3ecdd' }}>
            {selected ? writeCopy.continueFrom(selected.name) : writeCopy.choosePlaceFirst}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
