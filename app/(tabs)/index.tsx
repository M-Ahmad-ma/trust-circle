import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { exploreApi, placesApi, usersApi } from '@/api';
import type { ExperienceCard, WirePlace } from '@/api/types';
import { Avatar } from '@/components/Avatar';
import { EmptyState, ErrorState, LoadingState } from '@/components/EmptyState';
import { ExploreHeader } from '@/components/ExploreHeader';
import { ExploreLayerToggle } from '@/components/ExploreLayerToggle';
import { ExploreMap, type ExploreLayer } from '@/components/ExploreMap';
import { ExperienceSheet } from '@/components/ExperienceSheet';
import { LocationBanner } from '@/components/LocationBanner';
import { Screen } from '@/components/Screen';
import { SearchField } from '@/components/SearchField';
import { Stars } from '@/components/Stars';
import { ViewModeToggle } from '@/components/ViewModeToggle';
import { exploreCopy } from '@/data';
import { useApiQuery } from '@/lib/useApiQuery';
import { useUserLocation } from '@/lib/useUserLocation';

const RADIUS_M = 20_000;

const noIsEmpty = undefined;

/**
 * Rounded to ~100 m before it reaches a query key. Raw GPS fixes drift by a few
 * metres between reads, and the focus re-read would otherwise produce a new key
 * — and a new request — every time the user returns to the screen.
 */
function geoKey(lat: number, lng: number) {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

export default function ExploreScreen() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'map' | 'list'>('map');
  const [layer, setLayer] = useState<ExploreLayer>('experiences');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedExperienceId, setSelectedExperienceId] = useState<string | null>(null);
  const [recenterToken, setRecenterToken] = useState(0);

  // Asked on this screen's first mount, never at app launch. Coordinates are
  // always populated — the Peshawar fallback stands in until a real fix arrives.
  const location = useUserLocation();
  const center = location.coords;

  const fetchPlaces = useCallback(async () => {
    const result = await placesApi.searchPlaces({
      q: query.trim() || undefined,
      lat: center.lat,
      lng: center.lng,
      radius: RADIUS_M,
      limit: 50,
    });
    return result.places;
  }, [query, center.lat, center.lng]);

  const fetchExperiences = useCallback(async () => {
    const page = await exploreApi.exploreNearby({
      lat: center.lat,
      lng: center.lng,
      radius: RADIUS_M,
      limit: 100,
    });
    return page.experiences;
  }, [center.lat, center.lng]);

  const places = useApiQuery<WirePlace[]>(fetchPlaces, {
    key: `places:${query}:${geoKey(center.lat, center.lng)}`,
    errorMessage: exploreCopy.placesFailed,
    isEmpty: noIsEmpty,
  });

  const experiences = useApiQuery<ExperienceCard[]>(fetchExperiences, {
    key: `experiences:${geoKey(center.lat, center.lng)}`,
    errorMessage: exploreCopy.experiencesFailed,
    isEmpty: noIsEmpty,
  });

  const me = useApiQuery(usersApi.me, {
    key: 'me',
    errorMessage: exploreCopy.meFailed,
    isEmpty: () => false,
  });

  const activeQuery = layer === 'places' ? places : experiences;
  const placeList = places.data ?? [];
  const experienceList = experiences.data ?? [];

  const selectedPlace = placeList.find((place) => place.id === selectedPlaceId) ?? null;
  const selectedExperience =
    experienceList.find((item) => item.id === selectedExperienceId) ?? null;

  const recenter = () => {
    // With the OS prompt suppressed the only way forward is Settings, so the
    // button has to route there rather than silently failing a request.
    if (!location.canAskAgain) location.openSettings();
    else location.request();
    setRecenterToken((token) => token + 1);
  };

  return (
    <Screen className="bg-paper-100" edges={['top']}>
      <View className="mt-4 flex grow-0 flex-row items-end justify-between">
        <ExploreHeader
          eyebrow={exploreCopy.eyebrow}
          title={location.isFallback ? exploreCopy.title : exploreCopy.titleNearYou}
        />

        {me.data ? (
          <TouchableOpacity onPress={() => router.push('/profile')}>
            <View className="flex-row items-center gap-2 px-4">
              <Avatar user={me.data} size={24} />
            </View>
          </TouchableOpacity>
        ) : null}
      </View>

      <SearchField value={query} placeholder={exploreCopy.searchPlaceholder} onChange={setQuery} />

      {/* Always visible, not tucked into an empty state. The `EmptyState` below
          only mounts when the query returns nothing, so a user whose city has
          places in it — which is everyone but a brand-new account on a new city —
          had no way to add one at all. */}
      <Pressable
        onPress={() => router.push({ pathname: '/write/new-place', params: { standalone: '1' } })}
        accessibilityRole="button"
        accessibilityLabel={exploreCopy.addAPlace}
        className="mt-2.5 flex-row items-center justify-center gap-2 rounded-card border border-dashed border-sand-400 py-3 active:opacity-70">
        <MaterialCommunityIcons name="plus" size={15} color="#a03246" />
        <Text className="font-body-semibold text-[12px] text-primary-600">
          {exploreCopy.addAPlace}
        </Text>
      </Pressable>

      <LocationBanner
        status={location.status}
        canAskAgain={location.canAskAgain}
        onEnable={recenter}
      />

      <View className="relative mt-4 flex-1 overflow-hidden">
        {activeQuery.status === 'loading' && !activeQuery.data && (
          <LoadingState
            label={layer === 'places' ? exploreCopy.loadingPlaces : exploreCopy.loadingExperiences}
          />
        )}

        {activeQuery.status === 'error' && !activeQuery.data && (
          <ErrorState label={activeQuery.message} onRetry={activeQuery.refetch} />
        )}

        {activeQuery.status === 'empty' && (
          <EmptyState
            icon="map-search-outline"
            tone="sand"
            title={layer === 'places' ? exploreCopy.noPlacesTitle : exploreCopy.noExperiencesTitle}
            body={layer === 'places' ? exploreCopy.noPlacesBody : exploreCopy.noExperiencesBody}
            actionLabel={exploreCopy.addAPlace}
            // Standalone too: this button also lives on Explore, so it must not
            // drop the user into the review flow. The experiences-layer empty
            // state shares this action, and "add a place" is the right next step
            // there as well — you cannot review a place that does not exist.
            onAction={() =>
              router.push({ pathname: '/write/new-place', params: { standalone: '1' } })
            }
          />
        )}

        {activeQuery.status === 'ready' && (
          <>
            {mode === 'map' ? (
              <ExploreMap
                places={placeList}
                experiences={experienceList}
                layer={layer}
                selectedPlaceId={selectedPlace?.id ?? null}
                selectedExperienceId={selectedExperience?.id ?? null}
                center={center}
                onSelectPlace={setSelectedPlaceId}
                onSelectExperience={setSelectedExperienceId}
                recenterToken={recenterToken}
                onRecenter={recenter}
                locating={location.status === 'requesting'}
                canAskAgain={location.canAskAgain}
              />
            ) : layer === 'places' ? (
              <PlaceDirectory places={placeList} onSelect={setSelectedPlaceId} />
            ) : (
              <ExperienceDirectory
                experiences={experienceList}
                onSelect={setSelectedExperienceId}
              />
            )}

            <ViewModeToggle mode={mode} onModeChange={setMode} />

            {mode === 'map' && (
              <ExploreLayerToggle
                layer={layer}
                onLayerChange={setLayer}
                placesLabel={exploreCopy.placesLayer}
                experiencesLabel={exploreCopy.experiencesLayer}
              />
            )}
          </>
        )}
      </View>

      {mode === 'map' && layer === 'places' && selectedPlace && (
        <PlaceSummary
          place={selectedPlace}
          onOpen={() => router.push(`/place/${selectedPlace.id}`)}
          onWrite={() => router.push(`/write?placeId=${selectedPlace.id}`)}
        />
      )}

      {mode === 'map' && layer === 'experiences' && selectedExperience && (
        <ExperienceSheet
          experience={selectedExperience}
          onOpenExperience={() => router.push(`/experience/${selectedExperience.id}`)}
          onOpenPlace={() => router.push(`/place/${selectedExperience.place.id}`)}
          onOpenReviewer={() => {
            // Your own review must not link to your own profile — that is the
            // screen you are already looking at.
            if (me.data && me.data.id === selectedExperience.reviewer.id) return;
            router.push(`/profile/${selectedExperience.reviewer.id}`);
          }}
        />
      )}
    </Screen>
  );
}

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

      {/* `avgRating` is `number | null` — a place with no experiences you can see
          has none — so it is gated on its own rather than folded into the count,
          which would render a trailing "· " with nothing after it. */}
      {typeof place.avgRating === 'number' && (
        <View className="mt-3 flex-row items-center gap-2">
          <Stars rating={place.avgRating} size={14} gap={2} />
          <Text className="font-body-bold text-[13px] text-ink-800">
            {place.avgRating.toFixed(1)}
          </Text>
          <Text className="font-body text-[11.5px] text-ink-400">{exploreCopy.averageRating}</Text>
        </View>
      )}

      {typeof place.experienceCount === 'number' && place.experienceCount > 0 && (
        <View className="mt-2 flex-row items-center gap-1.5">
          <View className="h-1.5 w-1.5 rounded-pill bg-moss-500" />
          <Text className="font-body text-[11.5px] text-ink-500">
            {place.experienceCount} {exploreCopy.experiencesVisible}
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

function ExperienceDirectory({
  experiences,
  onSelect,
}: {
  experiences: ExperienceCard[];
  onSelect: (id: string) => void;
}) {
  return (
    <ScrollViewWrapper>
      {experiences.map((experience) => (
        <Pressable
          key={experience.id}
          onPress={() => {
            onSelect(experience.id);
            router.push(`/experience/${experience.id}`);
          }}
          accessibilityRole="button"
          className="mb-2 flex-row items-center gap-3 rounded-card border border-hairline bg-paper-50 p-3 active:opacity-70">
          <Avatar user={experience.reviewer} size={40} />

          <View className="flex-1">
            <Text numberOfLines={1} className="font-body-semibold text-[13.5px] text-ink-800">
              {experience.place.name}
            </Text>
            <View className="mt-1 flex-row items-center gap-1.5">
              <Stars rating={experience.rating} size={10} gap={1} />
              <Text className="font-body text-[11px] text-ink-400">
                {experience.rating.toFixed(1)} · {experience.reviewer.name}
              </Text>
            </View>
          </View>

          <RelationshipDot type={experience.relationship.type} />
        </Pressable>
      ))}
    </ScrollViewWrapper>
  );
}

/** Proximity to the viewer, as a single coloured dot. Never colour alone. */
function RelationshipDot({ type }: { type: ExperienceCard['relationship']['type'] }) {
  const color =
    type === 'direct_friend'
      ? '#a03246'
      : type === 'friend_of_friend'
        ? '#d97a2b'
        : type === 'self'
          ? '#6b6058'
          : '#c9a227';

  return <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: color }} />;
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
