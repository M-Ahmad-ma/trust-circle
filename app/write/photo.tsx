import { router } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { uploadsApi } from '@/api';
import { FlowHeader } from '@/components/write/FlowHeader';
import { PhotoPicker } from '@/components/write/PhotoPicker';
import {
  MAX_PHOTOS,
  STEP_ROUTES,
  useExperienceDraft,
  type DraftPhoto,
} from '@/lib/experienceDraft';

/**
 * A review needs at least one photo. The upload begins the moment a file is
 * picked — not at publish — so the bytes are already moving while the person
 * writes the rest of the experience, and each tile shows whether its own file
 * has landed. There is deliberately no "skip": the button does not unlock until
 * one photo is on the server.
 */
export default function PhotoStep() {
  const insets = useSafeAreaInsets();
  const { draft, dispatch } = useExperienceDraft();

  const uploadOne = useCallback(
    async (photo: DraftPhoto) => {
      try {
        const uploaded = await uploadsApi.uploadPhoto({
          uri: photo.localUri,
          name: photo.name,
          type: photo.type,
        });
        dispatch({ type: 'markUploaded', localId: photo.localId, uploadId: uploaded.id });
      } catch {
        dispatch({
          type: 'markUploadFailed',
          localId: photo.localId,
          message: 'That photo did not upload.',
        });
      }
    },
    [dispatch]
  );

  /**
   * Every accepted file starts at once. The picker has already compressed the
   * image and `MAX_PHOTOS` bounds the burst at ten, so a queue would only add
   * latency to files that are small enough to travel together.
   */
  const addPhotos = (added: readonly { localUri: string; name: string; type: string }[]) => {
    const batch = Date.now();
    const drafts: DraftPhoto[] = added.map((photo, index) => ({
      ...photo,
      localId: `${batch}-${index}-${photo.localUri}`,
      uploading: true,
    }));

    for (const photo of drafts) dispatch({ type: 'addPhoto', photo });
    for (const photo of drafts) void uploadOne(photo);
  };

  const retry = (index: number) => {
    const photo = draft.photos[index];
    if (!photo || photo.uploading) return;
    dispatch({ type: 'markUploadStarted', localId: photo.localId });
    void uploadOne(photo);
  };

  const removeAll = () => {
    for (let i = draft.photos.length - 1; i >= 0; i -= 1) {
      dispatch({ type: 'removePhotoAt', index: i });
    }
  };

  const readyCount = draft.photos.filter((photo) => photo.uploadId).length;
  const uploadingCount = draft.photos.filter((photo) => photo.uploading).length;
  const failedCount = draft.photos.filter((photo) => !photo.uploading && photo.uploadError).length;

  const canContinue = readyCount > 0 && uploadingCount === 0;
  const buttonLabel =
    uploadingCount > 0
      ? `Uploading ${readyCount} of ${draft.photos.length}…`
      : draft.photos.length === 0
        ? 'Add a photo to continue'
        : readyCount === 0 && failedCount > 0
          ? 'Retry the failed photo'
          : 'Continue';

  return (
    <View className="flex-1 bg-paper-100">
      <View style={{ paddingTop: insets.top + 8 }}>
        <FlowHeader
          current="photo"
          closeLabel="Discard this experience"
          onClose={() => router.replace('/(tabs)/')}
        />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        <View className="px-5 pt-9">
          <Text className="font-body-semibold text-2xs uppercase text-primary-600">Required</Text>
          <Text className="mt-3 font-display text-[30px] leading-[35px] text-ink-900">
            Show what you <Text className="font-display-italic text-primary-600">experienced</Text>.
          </Text>
          <Text className="mt-3 max-w-[320px] font-body text-[13px] leading-[19px] text-ink-500">
            At least one photo is required. Add as many as you like — the first one becomes the
            cover.
          </Text>
        </View>

        <View className="mt-7 px-5">
          <PhotoPicker
            photos={draft.photos}
            max={MAX_PHOTOS}
            orderHint="The first photo is the cover. Use the arrows on a photo to change its order."
            emptyNote="Add at least one photo before you continue."
            onAdd={addPhotos}
            onRemove={(index) => dispatch({ type: 'removePhotoAt', index })}
            onMove={(from, to) => dispatch({ type: 'movePhoto', from, to })}
            onRemoveAll={removeAll}
            onRetry={retry}
          />
        </View>
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 border-t border-hairline bg-paper-50 px-5"
        style={{ paddingBottom: Math.max(insets.bottom, 14), paddingTop: 12 }}>
        <Pressable
          onPress={() => router.push(STEP_ROUTES.rating)}
          disabled={!canContinue}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canContinue, busy: uploadingCount > 0 }}
          className="flex-row items-center justify-center gap-2 rounded-card active:opacity-90"
          style={{
            height: 52,
            backgroundColor: canContinue ? '#a03246' : '#d9cbb2',
          }}>
          {uploadingCount > 0 && <ActivityIndicator color="#f3ecdd" size="small" />}
          <Text
            className="font-body-semibold text-[15px]"
            style={{ color: canContinue ? '#fdfaf4' : '#f3ecdd' }}>
            {buttonLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
