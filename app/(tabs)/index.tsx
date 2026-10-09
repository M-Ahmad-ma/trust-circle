import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { placesApi, usersApi } from '@/api';
import type { WirePlace } from '@/api/types';
import { Avatar } from '@/components/Avatar';
import { EmptyState, ErrorState, LoadingState } from '@/components/EmptyState';
import { ExploreHeader } from '@/components/ExploreHeader';
import { ExploreMap } from '@/components/ExploreMap';
import { Screen } from '@/components/Screen';
import { SearchField } from '@/components/SearchField';
import { ViewModeToggle } from '@/components/ViewModeToggle';
import { exploreCopy } from '@/data';
import { useApiQuery } from '@/lib/useApiQuery';

/** Peshawar — the centre used until device location lands. */
const CENTER = { lat: 34.015, lng: 71.58 };
const RADIUS_M = 20_000;

const noIsEmpty = undefined;

export default function ExploreScreen() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'map' | 'list'>('map');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchPlaces = useCallback(async () => {
    const result = await placesApi.searchPlaces({
      q: query.trim() || undefined,
      lat: CENTER.lat,
      lng: CENTER.lng,
      radius: RADIUS_M,
      limit: 50,
    });
    return result.places;
  }, [query]);

  const places = useApiQuery<WirePlace[]>(fetchPlaces, {
    key: `places:${query}`,
    errorMessage: exploreCopy.placesFailed,
    isEmpty: noIsEmpty,
  });

  const me = useApiQuery(usersApi.me, {
    key: 'me',
    errorMessage: exploreCopy.meFailed,
    isEmpty: () => false,
  });

  const list = places.data ?? [];
  const selected = list.find((place) => place.id === selectedId) ?? list[0] ?? null;

  console.log(list);

  return (
    <Screen className="bg-paper-100" edges={['top']}>
      <ExploreHeader eyebrow={exploreCopy.eyebrow} title={exploreCopy.title} />

      <SearchField value={query} placeholder={exploreCopy.searchPlaceholder} onChange={setQuery} />

      <View className="mt-4 grow-0">
        {me.data ? (
          <View className="flex-row items-center gap-2 px-4">
            <Avatar user={me.data} size={24} />
            <Text numberOfLines={1} className="flex-1 font-body text-[12px] text-ink-500">
              {me.data.bio ?? exploreCopy.noBio}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="relative mt-4 flex-1 overflow-hidden">
        {places.status === 'loading' && !places.data && (
          <LoadingState label={exploreCopy.loadingPlaces} />
        )}

        {places.status === 'error' && !places.data && (
          <ErrorState label={places.message} onRetry={places.refetch} />
        )}

        {places.status === 'empty' && (
          <EmptyState
            icon="map-search-outline"
            tone="sand"
            title={exploreCopy.noPlacesTitle}
            body={exploreCopy.noPlacesBody}
            actionLabel={exploreCopy.addAPlace}
            onAction={() => router.push('/write/new-place')}
          />
        )}

        {places.status === 'ready' && selected && (
          <>
            {mode === 'map' ? (
              <ExploreMap places={list} selectedId={selected.id} onSelect={setSelectedId} />
            ) : (
              <PlaceDirectory places={list} onSelect={setSelectedId} />
            )}

            <ViewModeToggle mode={mode} onModeChange={setMode} />
          </>
        )}
      </View>

      {selected && (
        <PlaceSummary
          place={selected}
          onOpen={() => router.push(`/place/${selected.id}`)}
          onWrite={() => router.push(`/write?placeId=${selected.id}`)}
        />
      )}
    </Screen>
  );
}

/**
 * The API's Place has no cover image, rating or open hours, so this summary
 * shows only fields that genuinely exist rather than inventing the rest.
 */
function PlaceSummary({
  place,
  onOpen,
  onWrite,
}: {
  place: WirePlace;
  onOpen: () => void;
  onWrite: () => void;
}) {
  const distance =
    typeof place.distanceM === 'number'
      ? place.distanceM < 1000
        ? `${Math.round(place.distanceM)} m away`
        : `${(place.distanceM / 1000).toFixed(1)} km away`
      : null;

  return (
    <View className="bg-paper-100 px-4 pb-5 pt-3">
      <View className="h-1 w-10 self-center rounded-pill bg-sand-400" />

      <View className="mt-3 flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="font-display text-[19px] leading-6 text-ink-800">{place.name}</Text>
          <Text className="mt-1 font-body text-[12px] text-ink-500">
            {place.category ?? exploreCopy.place}
            {place.city ? ` · ${place.city}` : ''}
            {distance ? ` · ${distance}` : ''}
          </Text>
        </View>

        <Pressable
          onPress={onWrite}
          accessibilityRole="button"
          accessibilityLabel={exploreCopy.writeExperience}
          className="h-9 w-9 items-center justify-center rounded-pill bg-surface active:opacity-70">
          <MaterialCommunityIcons name="square-edit-outline" size={16} color="#6b6058" />
        </Pressable>
      </View>

      {typeof place.experienceCount === 'number' && place.experienceCount > 0 && (
        <View className="mt-3 flex-row items-center gap-1.5">
          <View className="h-1.5 w-1.5 rounded-pill bg-moss-500" />
          <Text className="font-body text-[11.5px] text-ink-500">
            {place.experienceCount} {exploreCopy.experiencesVisible}
            {typeof place.avgRating === 'number' ? ` · ${place.avgRating.toFixed(1)} average` : ''}
          </Text>
        </View>
      )}

      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        className="mt-4 h-12 items-center justify-center rounded-card bg-primary-600 active:bg-primary-700">
        <Text className="font-body-semibold text-[14px] text-primary-fg">
          {exploreCopy.viewPlace}
        </Text>
      </Pressable>
    </View>
  );
}

/** List mode: the real places the search returned. */
function PlaceDirectory({
  places,
  onSelect,
}: {
  places: WirePlace[];
  onSelect: (id: string) => void;
}) {
  return (
    <ScrollViewWrapper>
      {places.map((place) => (
        <Pressable
          key={place.id}
          onPress={() => {
            onSelect(place.id);
            router.push(`/place/${place.id}`);
          }}
          accessibilityRole="button"
          className="mb-2 flex-row items-center gap-3 rounded-card border border-hairline bg-paper-50 p-3 active:opacity-70">
          <View className="h-11 w-11 items-center justify-center rounded-[10px] bg-surface">
            <MaterialCommunityIcons name="map-marker-outline" size={18} color="#a03246" />
          </View>

          <View className="flex-1">
            <Text numberOfLines={1} className="font-body-semibold text-[13.5px] text-ink-800">
              {place.name}
            </Text>
            <Text numberOfLines={1} className="mt-0.5 font-body text-[11px] text-ink-400">
              {place.category ?? exploreCopy.place}
              {place.city ? ` · ${place.city}` : ''}
            </Text>
          </View>

          {typeof place.experienceCount === 'number' && place.experienceCount > 0 && (
            <View className="rounded-pill bg-rose-100 px-2 py-1">
              <Text className="font-body-semibold text-[10px] text-primary-600">
                {place.experienceCount}
              </Text>
            </View>
          )}
        </Pressable>
      ))}
    </ScrollViewWrapper>
  );
}

function ScrollViewWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      className="flex-1 bg-sand-300"
      contentContainerStyle={{ padding: 12 }}
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}
