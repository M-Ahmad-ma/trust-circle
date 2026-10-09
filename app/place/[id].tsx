import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { placesApi, experiencesApi } from '@/api';
import type { ExperienceCard, WirePlace } from '@/api/types';
import { EmptyState, ErrorState, LoadingState } from '@/components/EmptyState';
import { PlaceHeading } from '@/components/place/PlaceHeading';
import { ACTION_BAR_CONTENT_HEIGHT, PlaceActionBar } from '@/components/place/PlaceActionBar';
import { ExperienceRow } from '@/components/place/ExperienceRow';
import { PlaceHero, hasHero } from '@/components/place/PlaceHero';
import { placeCopyApi } from '@/data';
import { useApiQuery } from '@/lib/useApiQuery';

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [saved, setSaved] = useState(false);

  const fetchPlace = useCallback(() => placesApi.getPlace(id), [id]);
  const place = useApiQuery<WirePlace>(fetchPlace, {
    key: `place:${id}`,
    errorMessage: placeCopyApi.failed,
    isEmpty: () => false,
  });

  const experiences = useApiQuery<ExperienceCard[]>(
    () => experiencesApi.listPlaceExperiences(id, { limit: 30 }),
    { key: `place-experiences:${id}` }
  );

  if (place.status === 'error' && !place.data) {
    return (
      <View className="flex-1 items-center justify-center bg-paper-100">
        <StatusBar style="dark" />
        <ErrorState label={place.message} onRetry={place.refetch} />
        <Pressable
          onPress={() => router.navigate('/')}
          accessibilityRole="button"
          className="active:opacity-60">
          <Text className="font-body-semibold text-[13px] text-primary-600">Back to the map</Text>
        </Pressable>
      </View>
    );
  }

  const data = place.data;

  return (
    <View className="flex-1 bg-paper-100">
      <StatusBar style={hasHero(data?.coverPhoto) ? 'light' : 'dark'} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: ACTION_BAR_CONTENT_HEIGHT }}>
        {!data && place.status === 'loading' && (
          <View className="flex-1">
            <LoadingState label={placeCopyApi.loading} />
          </View>
        )}

        {data && (
          <>
            <PlaceHero coverPhoto={data.coverPhoto} />

            <PlaceHeading
              name={data.name}
              categoryLabel={data.category ?? 'Place'}
              city={data.city ?? ''}
              address={data.address ?? data.city ?? ''}
              rating={data.avgRating}
              experienceCount={data.experienceCount ?? 0}
              experienceCountLabel={placeCopyApi.experienceCount}
              ratingLabel={placeCopyApi.avgRating}
              openNow={null}
            />

            {typeof data.distanceM === 'number' && (
              <Text className="px-4 pt-2 font-body text-[11.5px] text-ink-400">
                {(data.distanceM / 1000).toFixed(1)} km away
              </Text>
            )}

            <View className="mt-7 px-4">
              <View className="flex-row items-baseline justify-between">
                <Text className="font-display-semibold text-[18px] text-ink-900">Experiences</Text>
                <Text className="font-body text-[12px] text-ink-400">
                  {experiences.data?.length ?? 0} shown
                </Text>
              </View>
            </View>

            {experiences.status === 'loading' && <LoadingState label={placeCopyApi.loading} />}

            {experiences.status === 'empty' && (
              <EmptyState
                icon="notebook-outline"
                tone="sand"
                title={placeCopyApi.noExperiencesTitle}
                body={placeCopyApi.noExperiencesBody}
                actionLabel={placeCopyApi.writeFirst}
                onAction={() => router.push(`/write?placeId=${data.id}`)}
              />
            )}

            {experiences.status === 'error' && experiences.data === null && (
              <ErrorState label={experiences.message} onRetry={experiences.refetch} />
            )}

            <View className="mt-3 gap-3 px-4 pb-6">
              {(experiences.data ?? []).map((experience) => (
                <ExperienceRow
                  key={experience.id}
                  experience={experience}
                  onOpen={() => router.push(`/experience/${experience.id}`)}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {data && (
        <PlaceActionBar
          writeLabel={placeCopyApi.writeFirst}
          saveLabel="Save Place"
          savedLabel="Saved"
          saved={saved}
          bottomInset={insets.bottom}
          onWrite={() => router.push(`/write?placeId=${data.id}`)}
          onToggleSave={() => setSaved((value) => !value)}
        />
      )}
    </View>
  );
}
