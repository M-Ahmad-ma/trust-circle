import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authApi, usersApi } from '@/api';
import { getRefreshToken } from '@/api/session';
import type { ExperienceCard, UserProfile } from '@/api/types';
import { EmptyState, ErrorState, LoadingState } from '@/components/EmptyState';
import { PlaceContext } from '@/components/profile/PlaceContext';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfilePhotosGrid, ProfilePlacesGrid } from '@/components/profile/ProfileGrids';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { ExperienceRow } from '@/components/place/ExperienceRow';
import { formatVisitDate } from '@/components/write/VisitCalendar';
import { ProfileTopBar } from '@/components/profile/ProfileTopBar';
import { useApiQuery } from '@/lib/useApiQuery';
import type { ProfileTab } from '@/types';
import { log } from '@/api/logger';

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
    errorMessage: 'We could not load your profile.',
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

  console.log(profile, 'profile data');
  console.log('experience', experiences);
  console.log(placesSeen, 'place');
  console.log(photoKeys, 'photoKeys');

  const confirmSignOut = () => {
    Alert.alert(
      'Sign out of Trust Circle?',
      'You will need to sign in again to post, and your Circle requests waiting for you stay where they are.',
      [
        { text: 'Stay signed in', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: () => void signOut(),
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-paper-100">
      <ProfileTopBar
        handle={user ? `${handleFor(user.name)}` : ''}
        backLabel="Go back"
        settingsLabel="Settings"
        topInset={insets.top}
        onBack={onBack}
        onSettings={onOpenSettings ?? (() => router.push('/settings'))}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[profile.status === 'ready' && user ? 1 : 0]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}>
        {profile.status === 'loading' && <LoadingState label="Loading your profile…" />}

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
            onEdit={onEditProfile ?? (() => router.push('/profile/edit'))}
            onBecameFriend={profile.refetch}
            onOpenFriends={isSelf ? () => router.push('/friends') : undefined}
            // A blocked profile 404s, so refetching would replace a real screen
            // with the "Profile unavailable" empty state and read like a failure.
            // Leaving is the truthful outcome.
            onBlocked={onBack}
          />
        )}

        {user && (
          <ProfileTabs
            active={tab}
            labels={{
              reviews: 'Experiences',
              places: 'Places',
              photos: 'Photos',
            }}
            onChange={setTab}
          />
        )}

        {user && tab === 'reviews' && (
          <View>
            <View className="px-6 pb-1 pt-6">
              <Text className="font-display-semibold text-[19px] text-ink-900">Experiences</Text>
            </View>

            {experiences.status === 'loading' && <LoadingState label="Loading your profile…" />}

            {experiences.status === 'empty' && (
              <EmptyState
                icon="notebook-outline"
                tone="sand"
                title="No experiences yet"
                body="Visit somewhere, then write it up. It only reaches the people you choose."
                {...(isSelf
                  ? {
                      actionLabel: 'Write your first experience',
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
                  {/* `GET /users/:id/experiences` returns experiences *authored
                      by* that user, so the reviewer is always the profile you
                      are already on. Verified against the API — every row comes
                      back with the owner as reviewer. Making the avatar tappable
                      here would push a duplicate of the current screen, so the
                      handler is only passed when it could ever lead anywhere. */}
                  <ExperienceRow
                    experience={experience}
                    onOpen={() => router.push(`/experience/${experience.id}`)}
                    onOpenReviewer={
                      experience.reviewer.id === userId
                        ? undefined
                        : () => router.push(`/profile/${experience.reviewer.id}`)
                    }
                  />
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
                title="No places yet"
                body="Places you write about will collect here."
              />
            ) : (
              <ProfilePlacesGrid places={placesSeen} imageKeys={photoKeys} onOpen={onOpenPlace} />
            )}
          </View>
        )}

        {user && tab === 'photos' && (
          <View className="pt-6">
            {photoKeys.length === 0 ? (
              <EmptyState
                icon="image-off-outline"
                tone="sand"
                title="No photos yet"
                body="Photos you attach to an experience show up here."
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
            accessibilityLabel="Sign out"
            accessibilityState={{ disabled: signingOut }}
            className="mx-6 mt-10 items-center rounded-xl  border border-danger-500 px-6 py-3 active:opacity-70"
            style={{ opacity: signingOut ? 0.5 : 1 }}>
            <Text className="font-body-semibold text-[13px] text-danger-600">
              {signingOut ? 'Signing out…' : 'Sign out'}
            </Text>
          </Pressable>
        )}
      </ScrollView>
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
