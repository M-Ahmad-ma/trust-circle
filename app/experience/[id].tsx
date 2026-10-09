import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
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
import { experienceCopy } from '@/data';

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; experience: ExperienceDetail }
  // 403 NOT_VISIBLE means it exists but is hidden from you; 404 means it is
  // gone. API.md §4 is explicit that these need different copy.
  | { kind: 'hidden' }
  | { kind: 'missing' }
  | { kind: 'error' };

export default function ExperienceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [retryKey, setRetryKey] = useState(0);

  // Retry re-runs the effect by bumping the key. The cancellation flag prevents
  // a late response from setting state on an unmounted screen.
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

  return (
    <View className="flex-1 bg-paper-100">
      <StatusBar style="dark" />

      <View
        className="flex-row items-center justify-between border-b border-hairline bg-paper-50 px-4"
        style={{ paddingTop: insets.top, height: insets.top + 52 }}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.navigate('/'))}
          accessibilityRole="button"
          accessibilityLabel={experienceCopy.back}
          hitSlop={10}
          className="h-10 w-10 items-center justify-center active:opacity-60">
          <Text className="font-display text-[24px] text-ink-800">‹</Text>
        </Pressable>
        <Text className="font-body-semibold text-3xs uppercase text-ink-400">
          {experienceCopy.experience}
        </Text>
        <View className="h-10 w-10" />
      </View>

      {state.kind === 'loading' && (
        <View className="flex-1 items-center justify-center">
          <Text className="font-body text-[12px] text-ink-400">{experienceCopy.loading}</Text>
        </View>
      )}

      {(state.kind === 'hidden' || state.kind === 'missing' || state.kind === 'error') && (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Text className="text-center font-display text-[20px] text-ink-900">
            {state.kind === 'hidden'
              ? experienceCopy.hidden
              : state.kind === 'missing'
                ? experienceCopy.missing
                : experienceCopy.failed}
          </Text>
          <Text className="text-center font-body text-[12.5px] leading-[19px] text-ink-500">
            {state.kind === 'hidden'
              ? experienceCopy.hiddenBody
              : state.kind === 'missing'
                ? experienceCopy.missingBody
                : experienceCopy.failedBody}
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
                  {experienceCopy.tryAgain}
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => router.navigate('/')}
              accessibilityRole="button"
              className="active:opacity-60">
              <Text className="font-body-semibold text-[13px] text-primary-600">
                {experienceCopy.backToMap}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {state.kind === 'ready' && <ExperienceBody experience={state.experience} />}
    </View>
  );
}

function ExperienceBody({ experience }: { experience: ExperienceDetail }) {
  const { place, reviewer, relationship } = experience;

  // absoluteUrl returns null for anything unresolvable; drop those rather than
  // handing Image a null uri.
  const resolvedPhotos = experience.photos
    .map((photo) => ({ id: photo.id, uri: absoluteUrl(photo.url) }))
    .filter((photo): photo is { id: string; uri: string } => photo.uri !== null);

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}>
      {resolvedPhotos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="grow-0">
          {resolvedPhotos.map((photo) => (
            <Image
              key={photo.id}
              source={{ uri: photo.uri }}
              style={{ width: 420, height: 280 }}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
          ))}
        </ScrollView>
      )}

      <View className="px-5 pt-6">
        <Text className="font-display text-[26px] leading-[32px] text-ink-900">{place.name}</Text>

        <Text className="mt-2 font-body text-[12.5px] text-ink-500">
          {place.category ?? experienceCopy.place}
          {place.city ? ` · ${place.city}` : ''}
        </Text>

        <View className="mt-4 flex-row items-center gap-3">
          <Avatar
            user={{ id: reviewer.id, name: reviewer.name, coverPhoto: reviewer.avatarPath }}
            size={42}
            ringColor="#fdfaf4"
            ringWidth={2}
          />
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
            text={`${experienceCopy.visited} ${formatVisitDate(experience.visitedAt)} · ${relativeVisit(experience.visitedAt)}`}
          />
          {resolvedPhotos.length > 0 && (
            <Row
              icon="camera-outline"
              text={`${resolvedPhotos.length} ${experienceCopy.originalPhotos}`}
            />
          )}
          <Row icon="map-marker-outline" text={place.address ?? place.city ?? place.name} />
        </View>

        <Pressable
          onPress={() => router.push(`/place/${place.id}`)}
          accessibilityRole="button"
          className="mt-7 h-12 items-center justify-center rounded-card border border-primary-600 active:bg-rose-100">
          <Text className="font-body-semibold text-[14px] text-primary-600">
            {experienceCopy.viewPlace}
          </Text>
        </Pressable>
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
