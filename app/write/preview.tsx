import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Monogram } from '@/components/Monogram';
import { RelationshipBadge, Stars } from '@/components/write/Relationship';
import { formatVisitDate, relativeVisit } from '@/components/write/VisitCalendar';
import { FlowHeader } from '@/components/write/FlowHeader';
import { profile, places, writeCopy } from '@/data';
import { useExperienceDraft } from '@/lib/experienceDraft';
import { relationshipFor } from '@/theme/relationship';

export default function PreviewStep() {
  const insets = useSafeAreaInsets();
  const { draft, reset } = useExperienceDraft();
  const [publishing, setPublishing] = useState(false);

  const place = useMemo(
    () => places.find((candidate) => candidate.id === draft.placeId),
    [draft.placeId]
  );
  const level = draft.visibility ? relationshipFor(draft.visibility) : null;

  const publish = () => {
    setPublishing(true);
    // No backend yet: clear the draft and return to the place the user came from.
    reset();
    if (draft.placeId) router.replace(`/place/${draft.placeId}`);
    else router.dismissAll();
  };

  if (!place || !draft.visibility || !draft.rating || !draft.visitedAt) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-paper-100 px-8">
        <Text className="text-center font-display text-[20px] text-ink-900">
          {writeCopy.previewIncomplete}
        </Text>
        <Pressable
          onPress={() => router.dismissAll()}
          accessibilityRole="button"
          className="active:opacity-60">
          <Text className="font-body-semibold text-[13px] text-primary-600">
            {writeCopy.startOver}
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

        {/* Exactly how it will appear to the audience chosen above. */}
        <View className="mt-6 px-5">
          <View className="overflow-hidden rounded-card border border-hairline bg-paper-50">
            <View className="flex-row items-center gap-2.5 px-4 pt-4">
              <Monogram
                initials={profile.initials}
                tint={profile.tint}
                size={38}
                ringColor="#fdfaf4"
                ringWidth={2}
              />
              <View className="flex-1">
                <Text className="font-body-semibold text-[13.5px] text-ink-900">
                  {profile.name}
                </Text>
                <View className="mt-1.5">
                  <RelationshipBadge visibility={draft.visibility} />
                </View>
              </View>
              <View className="items-end gap-1.5">
                <Stars rating={draft.rating} size={15} />
                <Text className="font-body text-[11px] text-ink-400">
                  {formatVisitDate(draft.visitedAt)}
                </Text>
              </View>
            </View>

            <Text className="px-4 pt-4 font-body text-[14px] leading-[22px] text-ink-700">
              {draft.review}
            </Text>

            {draft.photos.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mt-4 grow-0"
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
                {draft.photos.map((source, index) => (
                  <Image
                    key={`${index}`}
                    source={source}
                    style={{ width: 112, height: 112, borderRadius: 12 }}
                    resizeMode="cover"
                    accessibilityIgnoresInvertColors
                  />
                ))}
              </ScrollView>
            )}

            {/* README §23 — trust signals, framed as context not verification. */}
            <View className="mt-4 gap-2 px-4">
              <SignalRow
                icon="map-marker-check-outline"
                text={`${writeCopy.visitedHere} · ${relativeVisit(draft.visitedAt)}`}
              />
              {draft.photos.length > 0 && (
                <SignalRow
                  icon="camera-outline"
                  text={`${draft.photos.length} ${writeCopy.originalPhotos}`}
                />
              )}
            </View>

            <View className="mt-4 flex-row items-center justify-between border-t border-hairline px-4 py-3">
              <Text className="font-body-semibold text-3xs uppercase text-ink-300">
                {place.name}
              </Text>
              <Text className="font-body text-[11px] text-ink-400">{level?.audience}</Text>
            </View>
          </View>
        </View>

        {/* Amend anything, per the flow's promise before this step. */}
        <View className="mt-6 gap-2 px-5">
          <AmendRow label={writeCopy.editPlace} detail={place.name} step="place" />
          <AmendRow
            label={writeCopy.editPhotos}
            detail={
              draft.photos.length > 0 ? `${draft.photos.length} selected` : writeCopy.noPhotosYet
            }
            step="photo"
          />
          <AmendRow label={writeCopy.editRating} detail={`${draft.rating}.0`} step="rating" />
          <AmendRow
            label={writeCopy.editVisitDate}
            detail={formatVisitDate(draft.visitedAt)}
            step="date"
          />
          <AmendRow label={writeCopy.editAudience} detail={level?.label ?? ''} step="visibility" />
        </View>
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 border-t border-hairline bg-paper-50 px-5"
        style={{ paddingBottom: Math.max(insets.bottom, 14), paddingTop: 12 }}>
        <Pressable
          onPress={publish}
          accessibilityRole="button"
          className="flex-row items-center justify-center gap-2 rounded-card active:opacity-90"
          style={{
            height: 52,
            backgroundColor: '#a03246',
            shadowColor: '#7e2534',
            shadowOpacity: 0.28,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 5 },
            elevation: 4,
          }}>
          <Text className="font-body-semibold text-[15px] text-primary-fg">
            {publishing ? writeCopy.publishing : writeCopy.publish}
          </Text>
          {!publishing && <MaterialCommunityIcons name="check" size={17} color="#fdfaf4" />}
        </Pressable>
      </View>
    </View>
  );
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
