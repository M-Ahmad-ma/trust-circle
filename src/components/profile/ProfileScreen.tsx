import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authApi, usersApi } from '@/api';
import { absoluteUrl, getRefreshToken } from '@/api/session';
import type { ExperienceCard, UserProfile } from '@/api/types';
import { Avatar } from '@/components/Avatar';
import { EmptyState, ErrorState, LoadingState } from '@/components/EmptyState';
import { Stars } from '@/components/Stars';
import { RelationshipBadge } from '@/components/write/Relationship';
import { PlaceContext } from '@/components/profile/PlaceContext';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfilePhotosGrid, ProfilePlacesGrid } from '@/components/profile/ProfileGrids';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { formatVisitDate } from '@/components/write/VisitCalendar';
import { ProfileTopBar } from '@/components/profile/ProfileTopBar';
import { profileCopyApi } from '@/data';
import { useApiQuery } from '@/lib/useApiQuery';
import type { ProfileTab } from '@/types';

type ProfileScreenProps = {
  userId: string;
  onBack: () => void;
  onOpenPlace: (placeId: string) => void;
  onOpenSettings?: () => void;
  onEditProfile?: () => void;
};

export function ProfileScreen({
  userId,
  onBack,
  onOpenPlace,
  onOpenSettings,
  onEditProfile,
}: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<ProfileTab>('reviews');
  const [signingOut, setSigningOut] = useState(false);

  const profile = useApiQuery<UserProfile>(() => usersApi.getUser(userId), {
    key: `profile:${userId}`,
    errorMessage: profileCopyApi.failed,
    isEmpty: () => false,
  });

  const experiences = useApiQuery<ExperienceCard[]>(
    () => usersApi.listUserExperiences(userId, { limit: 30 }),
    { key: `profile-experiences:${userId}` }
  );

  const user = profile.data?.user;
  const relationship = profile.data?.relationship;
  const isSelf = relationship?.type === 'self';

  // Derived from the experiences actually returned — never from a static count.
  const placesSeen = Array.from(
    new Map(experiences.data?.map((e) => [e.place.id, e.place]) ?? []).values()
  );
  const photoKeys = (experiences.data ?? []).flatMap((experience) =>
    experience.photos.map((photo) => photo.url)
  );

  /**
   * `logout` revokes the refresh token and then clears local storage, and it
   * clears even when the network call fails — signing out must never strand
   * someone in an app they asked to leave. The redirect is belt-and-braces: the
   * `(auth)` and `(tabs)` layouts also swap on session change, but this screen is
   * mounted outside `(tabs)` too, so navigating here covers every entry point.
   */
  const signOut = async () => {
    setSigningOut(true);
    try {
      await authApi.logout(getRefreshToken());
      router.replace('/(auth)/login');
    } finally {
      setSigningOut(false);
    }
  };

  const confirmSignOut = () => {
    Alert.alert(profileCopyApi.signOutConfirmTitle, profileCopyApi.signOutConfirmBody, [
      { text: profileCopyApi.signOutCancel, style: 'cancel' },
      {
        text: profileCopyApi.signOutConfirmAction,
        style: 'destructive',
        onPress: () => void signOut(),
      },
    ]);
  };

  return (
    <View className="flex-1 bg-paper-100">
      <ProfileTopBar
        handle={user ? `@${handleFor(user.name)}` : ''}
        backLabel="Go back"
        settingsLabel="Settings"
        topInset={insets.top}
        onBack={onBack}
        onSettings={onOpenSettings ?? (() => {})}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[profile.status === 'ready' && user ? 1 : 0]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}>
        {profile.status === 'loading' && <LoadingState label={profileCopyApi.loading} />}

        {profile.status === 'error' && !user && (
          <ErrorState label={profile.message} onRetry={profile.refetch} />
        )}

        {profile.status === 'empty' && !user && (
          <EmptyState
            icon="account-off-outline"
            tone="sand"
            title="Profile unavailable"
            body="This person may have removed their account, or blocked you."
          />
        )}

        {user && (
          <ProfileHeader
            userId={userId}
            name={user.name}
            bio={user.bio}
            avatarPath={user.avatarPath}
            relationship={relationship}
            isSelf={isSelf}
            stats={{
              experiences: profile.data?.counts.experiences ?? 0,
              friends: profile.data?.counts.friends ?? 0,
            }}
            editLabel="Edit Profile"
            onEdit={onEditProfile ?? (() => {})}
            onBecameFriend={profile.refetch}
          />
        )}

        {user && (
          <ProfileTabs
            active={tab}
            labels={{
              reviews: profileCopyApi.experiences,
              places: profileCopyApi.places,
              photos: profileCopyApi.photos,
            }}
            onChange={setTab}
          />
        )}

        {user && tab === 'reviews' && (
          <View>
            <View className="px-6 pb-1 pt-6">
              <Text className="font-display-semibold text-[19px] text-ink-900">
                {profileCopyApi.experiences}
              </Text>
            </View>

            {experiences.status === 'loading' && <LoadingState label={profileCopyApi.loading} />}

            {experiences.status === 'empty' && (
              <EmptyState
                icon="notebook-outline"
                tone="sand"
                title={profileCopyApi.noExperiencesTitle}
                body={profileCopyApi.noExperiencesBody}
                {...(isSelf
                  ? {
                      actionLabel: profileCopyApi.writeFirst,
                      onAction: () => router.navigate('/write/place'),
                    }
                  : {})}
              />
            )}

            {experiences.status === 'error' && experiences.data === null && (
              <ErrorState label={experiences.message} onRetry={experiences.refetch} />
            )}

            {(experiences.data ?? []).map((experience) => (
              <View key={experience.id} className="mt-3">
                <PlaceContext
                  placeName={experience.place.name}
                  neighbourhood={experience.place.city ?? experience.place.address ?? ''}
                  time={formatVisitDate(experience.visitedAt)}
                  onPress={() => onOpenPlace(experience.place.id)}
                />
                <View className="px-6">
                  <ExperienceRow experience={experience} />
                </View>
              </View>
            ))}
          </View>
        )}

        {user && tab === 'places' && (
          <View className="pt-6">
            {placesSeen.length === 0 ? (
              <EmptyState
                icon="map-marker-off-outline"
                tone="sand"
                title={profileCopyApi.noPlacesTitle}
                body={profileCopyApi.noPlacesBody}
              />
            ) : (
              <ProfilePlacesGrid places={placesSeen} onOpen={onOpenPlace} />
            )}
          </View>
        )}

        {user && tab === 'photos' && (
          <View className="pt-6">
            {photoKeys.length === 0 ? (
              <EmptyState
                icon="image-off-outline"
                tone="sand"
                title={profileCopyApi.noPhotosTitle}
                body={profileCopyApi.noPhotosBody}
              />
            ) : (
              <ProfilePhotosGrid urls={photoKeys} />
            )}
          </View>
        )}

        {/* Sign-out is destructive and only ever meaningful on your own profile,
            so it sits at the very bottom and stays hidden when you are looking
            at someone else. */}
        {user && isSelf && (
          <Pressable
            onPress={confirmSignOut}
            disabled={signingOut}
            accessibilityRole="button"
            accessibilityLabel={profileCopyApi.signOut}
            accessibilityState={{ disabled: signingOut }}
            className="mx-6 mt-10 items-center rounded-xl  border border-danger-500 px-6 py-3 active:opacity-70"
            style={{ opacity: signingOut ? 0.5 : 1 }}>
            <Text className="font-body-semibold text-[13px] text-danger-600">
              {signingOut ? profileCopyApi.signOutBusy : profileCopyApi.signOut}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

/** One experience as the API returned it — reviewer, relationship and all. */
function ExperienceRow({ experience }: { experience: ExperienceCard }) {
  const [photos, setPhotos] = useState(experience.photos);

  return (
    <View className="overflow-hidden rounded-card border border-hairline bg-paper-50 px-5 pb-4 pt-4">
      <View className="flex-row items-center">
        <Avatar user={experience.reviewer} size={40} ringColor="#fdfaf4" ringWidth={2} />

        <View className="ml-3 flex-1">
          <Text className="font-body-semibold text-[14px] text-ink-900">
            {experience.reviewer.name}
          </Text>
          <View className="mt-1.5">
            <RelationshipBadge
              relationship={experience.relationship.type}
              label={experience.relationship.label}
              size="sm"
            />
          </View>
        </View>

        <View className="flex-row items-center gap-1.5">
          <Stars rating={experience.rating} size={14} />
          <Text className="font-body-bold text-[14px] text-ink-900">
            {experience.rating.toFixed(1)}
          </Text>
        </View>
      </View>

      <Text className="mt-4 font-body text-[14px] leading-[22px] text-ink-700">
        {experience.review}
      </Text>

      {photos.length > 0 && (
        <View className="mt-3 flex-row" style={{ gap: 8 }}>
          {photos.map((photo) => {
            const uri = absoluteUrl(photo.url);
            if (!uri) return null;

            return (
              <Pressable
                key={photo.id}
                onPress={() => setPhotos([])}
                accessibilityRole="button"
                accessibilityLabel="Hide photo"
                className="overflow-hidden rounded-[12px] active:opacity-80">
                <Image
                  source={{ uri }}
                  style={{ width: 112, height: 112 }}
                  resizeMode="cover"
                  accessibilityIgnoresInvertColors
                />
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

/** @sara.j from "Sara J." — matches the handle style the design uses. */
export function handleFor(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
  return cleaned.split('.')[0] ?? cleaned;
}
