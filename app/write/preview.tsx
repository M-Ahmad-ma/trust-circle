import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { experiencesApi, uploadsApi } from '@/api';
import { hasCode, isApiError } from '@/api/errors';
import { FlowHeader } from '@/components/write/FlowHeader';
import { Stars } from '@/components/write/Relationship';
import { formatVisitDate, relativeVisit } from '@/components/write/VisitCalendar';
import { STEP_ROUTES, useExperienceDraft } from '@/lib/experienceDraft';
import { visibilityOption } from '@/theme/relationship';
import { writeCopy } from '@/data';

type PublishError =
  | { kind: 'photos'; message: string }
  | { kind: 'visited'; message: string }
  | { kind: 'generic'; message: string };

export default function PreviewStep() {
  const insets = useSafeAreaInsets();
  const { draft, dispatch, reset } = useExperienceDraft();

  const [publishing, setPublishing] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<PublishError | null>(null);

  const ready =
    draft.placeId !== null &&
    draft.rating !== null &&
    draft.rating > 0 &&
    draft.visitedAt !== null &&
    draft.visibility !== null &&
    draft.reviewText.trim().length >= 10;

  const audience = draft.visibility ? visibilityOption(draft.visibility) : null;
  const rating = draft.rating ?? 0;
  const uploadedCount = draft.photos.filter((photo) => photo.uploadId).length;

  /**
   * Two-step publish per API.md §4: upload each photo to get an id, then create
   * the experience referencing those ids. Already-uploaded photos keep their id,
   * so a failed create can be retried without re-uploading.
   */
  const publish = async () => {
    if (!ready) return;

    setPublishing(true);
    setError(null);

    try {
      const photoIds: string[] = [];

      for (let index = 0; index < draft.photos.length; index += 1) {
        const photo = draft.photos[index];

        if (photo.uploadId) {
          photoIds.push(photo.uploadId);
          continue;
        }

        setProgress(writeCopy.uploadingPhoto(index + 1, draft.photos.length));
        const uploaded = await uploadsApi.uploadPhoto({
          uri: photo.localUri,
          name: photo.name,
          type: photo.type,
        });

        dispatch({ type: 'markUploaded', index, uploadId: uploaded.id });
        photoIds.push(uploaded.id);
      }

      setProgress(writeCopy.creatingExperience);

      const created = await experiencesApi.createExperience({
        placeId: draft.placeId as string,
        // Must be a JSON number, not a string.
        rating,
        reviewText: draft.reviewText.trim(),
        visitedAt: draft.visitedAt as string,
        visibility: draft.visibility as NonNullable<typeof draft.visibility>,
        photoIds: photoIds.length > 0 ? photoIds : undefined,
      });

      reset();
      router.replace({ pathname: '/experience/[id]', params: { id: created.id } });
    } catch (caught) {
      setError(toPublishError(caught));
    } finally {
      setPublishing(false);
      setProgress(null);
    }
  };

  const amended = useMemo(
    () => [
      { step: 'place', label: writeCopy.editPlace, detail: writeCopy.chosen },
      {
        step: 'photo',
        label: writeCopy.editPhotos,
        detail:
          draft.photos.length > 0
            ? `${draft.photos.length} · ${uploadedCount} uploaded`
            : writeCopy.noPhotosYet,
      },
      { step: 'rating', label: writeCopy.editRating, detail: rating ? `${rating}.0` : '—' },
      {
        step: 'date',
        label: writeCopy.editVisitDate,
        detail: draft.visitedAt ? formatVisitDate(draft.visitedAt) : '—',
      },
      { step: 'visibility', label: writeCopy.editAudience, detail: audience?.label ?? '—' },
    ],
    [draft.photos.length, uploadedCount, rating, draft.visitedAt, audience]
  );

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-paper-100 px-8">
        <Text className="text-center font-display text-[20px] text-ink-900">
          {writeCopy.previewIncomplete}
        </Text>
        <Pressable
          onPress={() => router.push(STEP_ROUTES.place)}
          accessibilityRole="button"
          className="active:opacity-60">
          <Text className="font-body-semibold text-[13px] text-primary-600">
            {writeCopy.backToStart}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-paper-100">
      <View style={{ paddingTop: insets.top + 8 }}>
        <FlowHeader
          current="preview"
          closeLabel={writeCopy.closeFlow}
          onClose={() => router.dismissAll()}
        />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 130 }}>
        <View className="px-5 pt-8">
          <Text className="font-body-semibold text-2xs uppercase text-primary-600">
            {writeCopy.previewEyebrow}
          </Text>
          <Text className="mt-2.5 font-display text-[24px] leading-[30px] text-ink-900">
            {writeCopy.previewTitle}
          </Text>
          <Text className="mt-2 max-w-[320px] font-body text-[12.5px] leading-[18px] text-ink-500">
            {writeCopy.previewSubtitle}
          </Text>
        </View>

        <View className="mt-6 px-5">
          <View className="overflow-hidden rounded-card border border-hairline bg-paper-50">
            <View className="flex-row items-center gap-2.5 px-4 pt-4">
              <Avatar
                user={{ id: 'me', name: writeCopy.yourName }}
                size={38}
                ringColor="#fdfaf4"
                ringWidth={2}
              />
              <View className="flex-1">
                <Text className="font-body-semibold text-[13.5px] text-ink-900">
                  {writeCopy.yourName}
                </Text>
                {/* The relationship badge is deliberately absent here. It is not
                    knowable until the server annotates the card for a given
                    viewer — your own experience reads differently to everyone else. */}
                <Text className="mt-1 font-body text-[10.5px] text-ink-400">
                  {writeCopy.visibleTo} {audience?.label}
                </Text>
              </View>
              <View className="items-end gap-1.5">
                <Stars rating={rating} size={15} />
                {draft.visitedAt && (
                  <Text className="font-body text-[11px] text-ink-400">
                    {formatVisitDate(draft.visitedAt)}
                  </Text>
                )}
              </View>
            </View>

            <Text className="px-4 pt-4 font-body text-[14px] leading-[22px] text-ink-700">
              {draft.reviewText.trim()}
            </Text>

            {draft.photos.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mt-4 grow-0"
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
                {draft.photos.map((photo, index) => (
                  <Image
                    key={`${photo.localUri}-${index}`}
                    source={{ uri: photo.localUri }}
                    style={{ width: 112, height: 112, borderRadius: 12 }}
                    resizeMode="cover"
                    accessibilityIgnoresInvertColors
                  />
                ))}
              </ScrollView>
            )}

            <View className="mt-4 gap-2 px-4">
              {draft.visitedAt && (
                <SignalRow
                  icon="map-marker-check-outline"
                  text={`${writeCopy.visitedHere} · ${relativeVisit(draft.visitedAt)}`}
                />
              )}
              {draft.photos.length > 0 && (
                <SignalRow
                  icon="camera-outline"
                  text={`${draft.photos.length} ${writeCopy.originalPhotos}`}
                />
              )}
            </View>

            <View className="mt-4 flex-row items-center justify-between border-t border-hairline px-4 py-3">
              <Text className="font-body-semibold text-3xs uppercase text-ink-300">
                {writeCopy.experienceLabel}
              </Text>
              <Text className="font-body text-[11px] text-ink-400">{audience?.audience}</Text>
            </View>
          </View>
        </View>

        {error && (
          <View className="mt-5 px-5">
            <View className="rounded-card bg-rose-100 p-4">
              <Text className="font-body text-[12.5px] leading-[19px] text-primary-700">
                {error.message}
              </Text>
            </View>
          </View>
        )}

        <View className="mt-6 gap-2 px-5">
          {amended.map((row) => (
            <AmendRow key={row.step} {...row} />
          ))}
        </View>
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 border-t border-hairline bg-paper-50 px-5"
        style={{ paddingBottom: Math.max(insets.bottom, 14), paddingTop: 12 }}>
        <Pressable
          onPress={() => void publish()}
          disabled={publishing}
          accessibilityRole="button"
          accessibilityState={{ busy: publishing, disabled: publishing }}
          className="flex-row items-center justify-center gap-2 rounded-card active:opacity-90"
          style={{
            height: 52,
            backgroundColor: publishing ? '#d9cbb2' : '#a03246',
            shadowColor: '#7e2534',
            shadowOpacity: publishing ? 0 : 0.28,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 5 },
            elevation: publishing ? 0 : 4,
          }}>
          <Text
            className="font-body-semibold text-[15px]"
            style={{ color: publishing ? '#f3ecdd' : '#fdfaf4' }}>
            {progress ?? (publishing ? writeCopy.publishing : writeCopy.publish)}
          </Text>
          {!publishing && <MaterialCommunityIcons name="check" size={17} color="#fdfaf4" />}
        </Pressable>
      </View>
    </View>
  );
}

/** Maps API.md §5 codes onto copy the user can act on. */
function toPublishError(caught: unknown): PublishError {
  if (hasCode(caught, 'INVALID_PHOTOS') || hasCode(caught, 'PHOTOS_ATTACHED')) {
    return { kind: 'photos', message: writeCopy.photoAttachFailed };
  }
  if (hasCode(caught, 'VISITED_AT_FUTURE') || hasCode(caught, 'INVALID_VISITED_AT')) {
    return { kind: 'visited', message: writeCopy.visitDateRejected };
  }
  if (hasCode(caught, 'PLACE_NOT_FOUND')) {
    return { kind: 'generic', message: writeCopy.placeVanished };
  }
  if (hasCode(caught, 'INVALID_TOKEN') || hasCode(caught, 'UNAUTHORIZED')) {
    return { kind: 'generic', message: writeCopy.sessionExpired };
  }
  if (isApiError(caught) && caught.code === 'VALIDATION_ERROR') {
    return { kind: 'generic', message: caught.message };
  }
  return { kind: 'generic', message: writeCopy.publishFailed };
}

function SignalRow({
  icon,
  text,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  text: string;
}) {
  return (
    <View className="flex-row items-center gap-2">
      <MaterialCommunityIcons name={icon} size={13} color="#6b6058" />
      <Text className="font-body text-[11.5px] text-ink-500">{text}</Text>
    </View>
  );
}

function AmendRow({ label, detail, step }: { label: string; detail: string; step: string }) {
  return (
    <Pressable
      onPress={() => router.navigate(`/write/${step}`)}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${detail}`}
      className="flex-row items-center justify-between rounded-card border border-hairline bg-paper-50 px-4 py-3 active:opacity-70">
      <Text className="font-body text-[12.5px] text-ink-600">{label}</Text>
      <View className="flex-row items-center gap-1.5">
        <Text numberOfLines={1} className="font-body-semibold text-[12.5px] text-ink-900">
          {detail}
        </Text>
        <MaterialCommunityIcons name="chevron-right" size={16} color="#b8a37c" />
      </View>
    </Pressable>
  );
}
