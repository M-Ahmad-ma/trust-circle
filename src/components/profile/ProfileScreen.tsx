import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlaceContext } from '@/components/profile/PlaceContext';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfilePhotosGrid, ProfilePlacesGrid } from '@/components/profile/ProfileGrids';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { ProfileTopBar } from '@/components/profile/ProfileTopBar';
import { ReviewCard } from '@/components/profile/ReviewCard';
import { places, profile, profileCopy, profileReviews } from '@/data';
import type { ProfileTab } from '@/types';

type ProfileScreenProps = {
  /** Host decides where the chevron goes — a pushed route pops, a tab navigates. */
  onBack: () => void;
  onOpenPlace: (placeId: string) => void;
  onEditProfile: () => void;
  onOpenSettings: () => void;
};

/**
 * Presentational body of the profile screen, shared by the pushed route and the
 * Profile tab so the two cannot drift apart.
 */
export function ProfileScreen({
  onBack,
  onOpenPlace,
  onEditProfile,
  onOpenSettings,
}: ProfileScreenProps) {
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<ProfileTab>('reviews');
  const [helpful, setHelpful] = useState<Record<string, boolean>>({});

  const reviewedPlaces = useMemo(() => {
    const ids = new Set(profileReviews.map((review) => review.placeId));
    return places.filter((place) => ids.has(place.id));
  }, []);

  const photoKeys = useMemo(() => profileReviews.flatMap((review) => review.photos), []);

  const toggleHelpful = (reviewId: string) =>
    setHelpful((current) => ({ ...current, [reviewId]: !current[reviewId] }));

  return (
    <View className="flex-1 bg-paper-100">
      <ProfileTopBar
        handle={profile.handle}
        backLabel={profileCopy.back}
        settingsLabel={profileCopy.settings}
        topInset={insets.top}
        onBack={onBack}
        onSettings={onOpenSettings}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}>
        <ProfileHeader
          profile={profile}
          editLabel={profileCopy.editProfile}
          onEdit={onEditProfile}
        />

        <ProfileTabs active={tab} labels={profileCopy.tabs} onChange={setTab} />

        {tab === 'reviews' &&
          (profileReviews.length === 0 ? (
            <View className="items-center gap-1.5 px-8 py-16">
              <Text className="text-center font-display-semibold text-[16px] text-ink-700">
                No reviews yet
              </Text>
              <Text className="text-center font-body text-[12px] text-ink-400">
                Places you write about will show up here.
              </Text>
            </View>
          ) : (
            <View>
              <View className="flex-row items-baseline justify-between px-6 pb-1 pt-6">
                <Text className="font-display-semibold text-[19px] text-ink-900">
                  {profileCopy.recentReviews}
                </Text>
                <Text className="font-body text-[12px] text-ink-400">
                  {profile.stats.reviews} {profileCopy.totalSuffix}
                </Text>
              </View>

              {profileReviews.map((review) => (
                <View key={review.id} className="mt-3">
                  <PlaceContext
                    placeName={review.placeName}
                    neighbourhood={review.neighbourhood}
                    time={review.time}
                    onPress={() => onOpenPlace(review.placeId)}
                  />
                  <View className="px-6">
                    <ReviewCard
                      review={review}
                      profile={profile}
                      circleLabel={profileCopy.yourCircle}
                      helpfulLabel={profileCopy.helpful}
                      helpful={helpful}
                      onToggleHelpful={toggleHelpful}
                      onOpenPlace={onOpenPlace}
                    />
                  </View>
                </View>
              ))}
            </View>
          ))}

        {tab === 'places' && (
          <View className="pt-6">
            <ProfilePlacesGrid places={reviewedPlaces} onOpen={onOpenPlace} />
          </View>
        )}

        {tab === 'photos' && (
          <View className="pt-6">
            <ProfilePhotosGrid keys={photoKeys} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
