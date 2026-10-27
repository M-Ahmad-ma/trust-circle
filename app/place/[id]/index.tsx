import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaterialCommunityIcons } from '@expo/vector-icons';

import { placesApi, experiencesApi } from '@/api';
import type { ExperienceCard, WirePlace } from '@/api/types';
import { Avatar } from '@/components/Avatar';
import { EmptyState, ErrorState, LoadingState } from '@/components/EmptyState';
import { RelatedExperiences, RelatedPlacesRail } from '@/components/related/RelatedContent';
import { PlaceHeading } from '@/components/place/PlaceHeading';
import { ACTION_BAR_CONTENT_HEIGHT, PlaceActionBar } from '@/components/place/PlaceActionBar';
import { ExperienceRow } from '@/components/place/ExperienceRow';
import { PlaceBackButton } from '@/components/place/PlaceBackButton';
import { PlaceHero, hasHero } from '@/components/place/PlaceHero';
import { Toast } from '@/components/Toast';
import { useApiQuery } from '@/lib/useApiQuery';

export default function PlaceDetailScreen() {
  const { id, deduped, photosFailed } = useLocalSearchParams<{
    id: string;
    deduped?: string;
    photosFailed?: string;
  }>();
  const insets = useSafeAreaInsets();

  /**
   * A toast, not a banner in the scroll content: the message explains the
   * navigation the user just experienced, so it must be visible on arrival and
   * must not be something they can scroll past before reading.
   *
   * Dismissal is remembered per `id:deduped` key rather than as a boolean. A new
   * key (another place, or a fresh dedup navigation) is a new event that should
   * show again; the dismissed key never needs an effect to reset.
   */
  const toastKey = `${id}:${deduped ?? ''}`;
  const [dismissedToastKey, setDismissedToastKey] = useState<string | null>(null);
  const dedupedToast = deduped === '1' && dismissedToastKey !== toastKey;
  const dismissDedupedToast = useCallback(() => setDismissedToastKey(toastKey), [toastKey]);

  const fetchPlace = useCallback(() => placesApi.getPlace(id), [id]);
  const place = useApiQuery<WirePlace>(fetchPlace, {
    key: `place:${id}`,
    errorMessage: 'We could not load this place.',
    isEmpty: () => false,
  });

  const experiences = useApiQuery<ExperienceCard[]>(
    () => experiencesApi.listPlaceExperiences(id, { limit: 30 }),
    { key: `place-experiences:${id}` }
  );

  /**
   * Recommendations are fetched separately from the place itself: a failure
   * here must not turn the place into an error screen, and the sections simply
   * do not render until there is something related to show.
   */
  const related = useApiQuery(() => placesApi.getPlaceRelated(id), {
    key: `place-related:${id}`,
    errorMessage: 'We could not load related places.',
    isEmpty: (content) => content.places.length === 0 && content.experiences.length === 0,
  });

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

        <PlaceBackButton topInset={insets.top} />
      </View>
    );
  }

  const data = place.data;
  // Read once so the plural below is decided in one place.
  const failedPhotos = Number(photosFailed) || 1;

  return (
    <View className="flex-1 bg-paper-100">
      <StatusBar style={hasHero(data?.coverPhoto) ? 'light' : 'dark'} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: ACTION_BAR_CONTENT_HEIGHT }}>
        {!data && place.status === 'loading' && (
          <View className="flex-1">
            <LoadingState label="Loading place…" />
          </View>
        )}

        {data && photosFailed && (
          // The place was created; only some of its photos made it. Saying so
          // beats a silently incomplete place.
          <View className="mx-4 mt-4 flex-row gap-2.5 rounded-card bg-surface p-4">
            <MaterialCommunityIcons name="image-off-outline" size={15} color="#6b6058" />
            <Text className="flex-1 font-body text-[11.5px] leading-[17px] text-ink-500">
              {`The place was added, but ${failedPhotos} photo${failedPhotos === 1 ? '' : 's'
                } could not be uploaded. You can add them again from the place.`}
            </Text>
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
              experienceCountLabel={(n) => `${n} experiences you can see`}
              ratingLabel={(r) => `${r.toFixed(1)} average`}
              openNow={null}
            />

            {typeof data.distanceM === 'number' && (
              <Text className="px-4 pt-2 font-body text-[11.5px] text-ink-400">
                {(data.distanceM / 1000).toFixed(1)} km away
              </Text>
            )}

            {/* Attribution, not a privacy leak: the server sends this only on
                the detail projection. A place whose author deleted their
                account simply has no owner block. */}
            {data.owner && (
              <Pressable
                onPress={() => router.push(`/profile/${data.owner!.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${data.owner.name}'s profile`}
                className="mx-4 mt-4 flex-row items-center gap-2.5 rounded-card border border-hairline bg-paper-50 px-3 py-2.5 active:opacity-70">
                <Avatar user={data.owner} size={30} ringColor="#fdfaf4" ringWidth={2} />
                <View className="flex-1">
                  <Text numberOfLines={1} className="font-body-semibold text-[12.5px] text-ink-900">
                    {data.owner.name}
                  </Text>
                  <Text className="mt-0.5 font-body text-[10.5px] text-ink-400">
                    {data.canEdit ? 'You added this place' : 'Added this place'}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={16} color="#b8a37c" />
              </Pressable>
            )}

            {/* Only the person who added the place can correct it, so the
                server sends `canEdit` and the button follows it. */}
            {data.canEdit === true && (
              <Pressable
                onPress={() => router.push(`/place/${data.id}/edit`)}
                accessibilityRole="button"
                accessibilityLabel="Edit place"
                className="ml-4 mt-3 flex-row items-center gap-1.5 self-start rounded-pill bg-surface px-3 py-1.5 active:opacity-70">
                <MaterialCommunityIcons name="pencil-outline" size={13} color="#6b6058" />
                <Text className="font-body-medium text-[11.5px] text-ink-600">Edit place</Text>
              </Pressable>
            )}

            <View className="mt-7 px-4">
              <View className="flex-row items-baseline justify-between">
                <Text className="font-display-semibold text-[18px] text-ink-900">Experiences</Text>
              </View>
            </View>

            {experiences.status === 'loading' && <LoadingState label="Loading place…" />}

            {experiences.status === 'empty' && (
              <EmptyState
                icon="notebook-outline"
                tone="sand"
                title="No experiences yet"
                body="Nobody you can see has written about this place. Be the first."
              // actionLabel="Write an experience"
              // onAction={() => router.push(`/write?placeId=${data.id}`)}
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
                  // On a place, the reviewers are other people, so their profile
                  // is somewhere worth going.
                  onOpenReviewer={() => router.push(`/profile/${experience.reviewer.id}`)}
                />
              ))}
            </View>

            {related.status === 'ready' && (
              <View>
                <RelatedPlacesRail places={related.data.places} />
                <RelatedExperiences
                  title="Related experiences"
                  subtitle="What people wrote at nearby places."
                  experiences={related.data.experiences}
                  showPlace
                />
              </View>
            )}
          </>
        )}
      </ScrollView>

      {data && (
        <PlaceActionBar
          writeLabel="Write an experience"
          bottomInset={insets.bottom}
          onWrite={() => router.push(`/write?placeId=${data.id}`)}
        />
      )}

      {/* Floats above the hero, so it stays reachable with no top bar of its own.
          The dark scrim keeps the white arrow legible over the photo and over the
          paper once it scrolls away. */}
      <PlaceBackButton topInset={insets.top} />

      <Toast
        visible={dedupedToast}
        title="Place already exists"
        message="Someone already added this place"
        onDismiss={dismissDedupedToast}
        topOffset={insets.top + 20}
        icon="link-variant"
      />
    </View>
  );
}
