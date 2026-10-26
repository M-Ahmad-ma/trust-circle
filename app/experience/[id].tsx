import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import type { ComponentProps } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { experiencesApi } from '@/api';
import { hasCode } from '@/api/errors';
import type { ExperienceDetail } from '@/api/types';
import { absoluteUrl } from '@/api/session';
import { Avatar } from '@/components/Avatar';
import { Stars } from '@/components/Stars';
import { RelationshipBadge } from '@/components/write/Relationship';
import { formatVisitDate, relativeVisit } from '@/components/write/VisitCalendar';

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; experience: ExperienceDetail }
  | { kind: 'hidden' }
  | { kind: 'missing' }
  | { kind: 'error' };

/** Landscape-ish strip; tall enough to read the place, short enough to leave room. */
const PHOTO_STRIP_HEIGHT = 260;

export default function ExperienceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [retryKey, setRetryKey] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    (async () => {
      try {
        const experience = await experiencesApi.getExperience(id);
        if (!cancelled) setState({ kind: 'ready', experience });
      } catch (error) {
        if (cancelled) return;
        if (hasCode(error, 'NOT_VISIBLE')) setState({ kind: 'hidden' });
        else if (hasCode(error, 'EXPERIENCE_NOT_FOUND')) setState({ kind: 'missing' });
        else setState({ kind: 'error' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, retryKey]);

  /**
   * Amending reuses the write flow rather than a second, thinner form: the same
   * validation, the same photo handling, one place to keep correct.
   *
   * Only the id travels in the route, not the record. `ExperienceDraftProvider`
   * is scoped to `/write` — it owns one in-progress draft and is destroyed when
   * the flow is dismissed — so this screen is deliberately outside it and cannot
   * seed it. The flow fetches and seeds itself on arrival, which also means a
   * deep link into `/write/place?editId=…` works the same as a tap here.
   */
  const startEdit = () => {
    if (state.kind !== 'ready') return;
    router.push({ pathname: '/write/place', params: { editId: state.experience.id } });
  };

  const runDelete = async () => {
    setDeleting(true);
    try {
      await experiencesApi.deleteExperience(id);
      // The experience no longer exists anywhere, so there is nothing to show it
      // on. Back to the map is the only honest destination.
      router.dismissTo('/');
    } catch {
      setDeleting(false);
    }
  };

  const confirmDelete = () => {
    const name = state.kind === 'ready' ? state.experience.place.name : '';
    Alert.alert(
      'Delete this experience?',
      'Your write-up of {place}, its rating and its photos are removed for everyone. This cannot be undone.'.replace(
        '{place}',
        name
      ),
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void runDelete(),
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View className="flex-1 bg-paper-100">
      <StatusBar style="dark" />

      <View
        className="flex-row items-center justify-between border-b border-hairline bg-paper-50 px-4"
        style={{ paddingTop: insets.top, height: insets.top + 52 }}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.navigate('/'))}
          accessibilityRole="button"
          accessibilityLabel={'Go back'}
          hitSlop={10}
          className="h-10 w-10 items-center justify-center active:opacity-60">
          <Text className="font-display text-[24px] text-ink-800">‹</Text>
        </Pressable>
        <Text className="font-body-semibold text-3xs uppercase text-ink-400">{'Experience'}</Text>
        <View className="h-10 w-10" />
      </View>

      {state.kind === 'loading' && (
        <View className="flex-1 items-center justify-center">
          <Text className="font-body text-[12px] text-ink-400">{'Loading experience…'}</Text>
        </View>
      )}

      {(state.kind === 'hidden' || state.kind === 'missing' || state.kind === 'error') && (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Text className="text-center font-display text-[20px] text-ink-900">
            {state.kind === 'hidden'
              ? 'This experience is not shared with you.'
              : state.kind === 'missing'
                ? 'This experience is gone.'
                : 'We could not load this experience.'}
          </Text>
          <Text className="text-center font-body text-[12.5px] leading-[19px] text-ink-500">
            {state.kind === 'hidden'
              ? "It was published to a smaller audience than the one you are in. That is the author's choice, not a bug."
              : state.kind === 'missing'
                ? 'It may have been deleted by the person who wrote it.'
                : 'Check your connection and try again.'}
          </Text>

          <View className="mt-2 flex-row gap-4">
            {state.kind === 'error' && (
              <Pressable
                onPress={() => {
                  setState({ kind: 'loading' });
                  setRetryKey((key) => key + 1);
                }}
                accessibilityRole="button"
                className="active:opacity-60">
                <Text className="font-body-semibold text-[13px] text-primary-600">
                  {'Try again'}
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => router.navigate('/')}
              accessibilityRole="button"
              className="active:opacity-60">
              <Text className="font-body-semibold text-[13px] text-primary-600">
                {'Back to the map'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {state.kind === 'ready' && (
        <>
          <ExperienceBody
            experience={state.experience}
            onEdit={startEdit}
            onDelete={confirmDelete}
            deleting={deleting}
          />

          {/* The primary action is pinned rather than left at the end of the
              scroll content: on a long review it sat below the fold, so
              getting to the place meant scrolling past everything you had just
              read. */}
          <View
            className="border-t border-hairline bg-paper-100 px-5 pt-3"
            style={{ paddingBottom: insets.bottom + 12 }}>
            <Pressable
              onPress={() => router.push(`/place/${state.experience.place.id}`)}
              accessibilityRole="button"
              className="h-12 items-center justify-center rounded-card border border-primary-600 active:bg-rose-100">
              <Text className="font-body-semibold text-[14px] text-primary-600">
                {'View place'}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

function ExperienceBody({
  experience,
  onEdit,
  onDelete,
  deleting,
}: {
  experience: ExperienceDetail;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const { place, reviewer, relationship } = experience;

  // Only the author may amend or delete. `relationship.type === 'self'` is the
  // server's own verdict for this viewer, so the controls cannot appear for
  // someone who merely has read access.
  const isOwner = relationship.type === 'self';

  // absoluteUrl returns null for anything unresolvable; drop those rather than
  // handing Image a null uri.
  const resolvedPhotos = experience.photos
    .map((photo) => ({ id: photo.id, uri: absoluteUrl(photo.url) }))
    .filter((photo): photo is { id: string; uri: string } => photo.uri !== null);

  // Sized to the viewport rather than a fixed width, so a photo fills the screen
  // on any device and a second one is visibly a second one.
  const { width: screenWidth } = useWindowDimensions();
  const photoWidth = screenWidth - 24;

  return (
    <ScrollView
      className="relative flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}>
      {resolvedPhotos.length > 0 && (
        // Height is pinned rather than left to the nested horizontal ScrollView
        // to derive from its content. A ScrollView does not report content size
        // to its parent's layout the way a plain View does, so inside the
        // vertical ScrollView this one can measure to zero height and take the
        // photos with it. `PlaceHero` pins its height for the same reason.
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ height: PHOTO_STRIP_HEIGHT }}
          contentContainerStyle={{ gap: 8 }}>
          {resolvedPhotos.map((photo) => (
            <Image
              key={photo.id}
              source={{ uri: photo.uri }}
              style={{ width: photoWidth, height: PHOTO_STRIP_HEIGHT }}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
          ))}
        </ScrollView>
      )}

      <View className="px-5 pt-6">
        <Text className="font-display text-[26px] leading-[32px] text-ink-900">{place.name}</Text>

        <Text className="mt-2 font-body text-[12.5px] text-ink-500">
          {place.category ?? 'Place'}
          {place.city ? ` · ${place.city}` : ''}
        </Text>

        <View className="mt-4 flex-row items-center gap-3">
          <Avatar user={reviewer} size={42} ringColor="#fdfaf4" ringWidth={2} />
          <View className="flex-1">
            <Text className="font-body-semibold text-[13.5px] text-ink-900">{reviewer.name}</Text>
            <View className="mt-1.5">
              {/* Server-computed for this viewer — the same experience shows a
                  different badge to a different person. */}
              <RelationshipBadge relationship={relationship.type} label={relationship.label} />
            </View>
          </View>
          <View className="items-end gap-1.5">
            <Stars rating={experience.rating} size={15} />
            <Text className="font-body text-[11px] text-ink-400">
              {experience.rating.toFixed(1)}
            </Text>
          </View>
        </View>

        <Text className="mt-6 font-body text-[15px] leading-[25px] text-ink-700">
          {experience.review}
        </Text>

        <View className="mt-6 gap-2 border-t border-hairline pt-4">
          <Row
            icon="calendar-check-outline"
            text={`${'Visited'} ${formatVisitDate(experience.visitedAt)} · ${relativeVisit(experience.visitedAt)}`}
          />
          {resolvedPhotos.length > 0 && (
            <Row icon="camera-outline" text={`${resolvedPhotos.length} ${'original photos'}`} />
          )}
          <Row icon="map-marker-outline" text={place.address ?? place.city ?? place.name} />
        </View>

        {isOwner && (
          <View className="mt-6 flex-row gap-3">
            <Pressable
              onPress={onEdit}
              accessibilityRole="button"
              accessibilityLabel={'Edit'}
              className="h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-card border border-hairline active:opacity-70">
              <MaterialCommunityIcons name="pencil-outline" size={15} color="#6b6058" />
              <Text className="font-body-semibold text-[13px] text-ink-700">{'Edit'}</Text>
            </Pressable>

            <Pressable
              onPress={onDelete}
              disabled={deleting}
              accessibilityRole="button"
              accessibilityLabel={'Delete'}
              accessibilityState={{ disabled: deleting, busy: deleting }}
              className="h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-card border border-danger-500 active:opacity-70"
              style={{ opacity: deleting ? 0.5 : 1 }}>
              <MaterialCommunityIcons name="trash-can-outline" size={15} color="#a03246" />
              <Text className="font-body-semibold text-[13px] text-danger-600">
                {deleting ? 'Deleting…' : 'Delete'}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function Row({
  icon,
  text,
}: {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  text: string;
}) {
  return (
    <View className="flex-row items-center gap-2">
      <MaterialCommunityIcons name={icon} size={14} color="#6b6058" />
      <Text className="flex-1 font-body text-[11.5px] text-ink-500">{text}</Text>
    </View>
  );
}
