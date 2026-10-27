import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';

import { validateUpload } from '@/api/endpoints/uploads';

/**
 * A photo the user picked, before it is anywhere on the server.
 *
 * `localUri` is enough to show it; `name` and `type` are what the multipart
 * upload needs, and both come from the picker — the mime type in particular has
 * to survive the trip, because the server rejects an unknown type with 415.
 */
export type PickerPhoto = {
  localUri: string;
  name: string;
  type: string;
};

type PhotoPickerProps = {
  /**
   * Local files only — the strip renders `localUri`. The optional upload fields
   * are owned by the caller, which starts the transfer as soon as a file is
   * picked and flips them as it settles.
   */
  photos: readonly {
    localUri: string;
    uploading?: boolean;
    uploadError?: string | null;
  }[];
  /** Hard cap. The last slot is the cover. */
  max: number;
  onAdd: (added: PickerPhoto[]) => void;
  onRemove: (index: number) => void;
  onMove: (from: number, to: number) => void;
  onRemoveAll: () => void;
  /** Retry a tile whose upload failed. No-op when uploads are synchronous. */
  onRetry?: (index: number) => void;
  /** Under the strip — what the cover rule and the arrows mean. */
  orderHint?: string | null;
  /** Shown when nothing has been picked yet. */
  emptyNote?: string | null;
  tile?: number;
};

const TILE = 104;

/**
 * Picking photos, and the strip that shows what was picked.
 *
 * Both the experience flow and the new-place flow need this, and both need it
 * to behave identically — the same validation, the same cover rule, the same
 * ordering controls — so it lives here rather than being written twice. The
 * caller owns the list; this owns the camera, the library, the permission
 * prompts and the rejection messages.
 *
 * Uploading is the caller's job — it is the only side that knows where the
 * file belongs (an experience for the write flow, a place for a new one) — but
 * the caller reports progress back through the photo entries, so a tile says
 * "uploading" or offers a retry instead of looking finished before it is.
 */
export function PhotoPicker({
  photos,
  max,
  onAdd,
  onRemove,
  onMove,
  onRemoveAll,
  onRetry,
  orderHint,
  emptyNote,
  tile = TILE,
}: PhotoPickerProps) {
  const [notice, setNotice] = useState<string | null>(null);

  const atLimit = photos.length >= max;
  const room = max - photos.length;

  const addAssets = (assets: ImagePicker.ImagePickerAsset[]) => {
    const rejected: string[] = [];
    const accepted: PickerPhoto[] = [];

    for (const asset of assets) {
      if (accepted.length >= room) break;

      const problem = validateUpload({
        size: asset.fileSize,
        type: asset.mimeType,
      });
      if (problem) {
        rejected.push(problem);
        continue;
      }

      accepted.push({
        localUri: asset.uri,
        name: asset.fileName ?? `photo-${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      });
    }

    if (rejected.length > 0) setNotice(rejected[0]);
    if (accepted.length > 0) onAdd(accepted);
  };

  const openLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setNotice(
        'Photo access is off, so the picker cannot open. Enable it in Settings, then try again.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, room),
      quality: 0.8,
    });

    if (!result.canceled) {
      addAssets(result.assets);
      setNotice(null);
    }
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setNotice('Camera access is off. Enable it in Settings, or choose from your library.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      addAssets(result.assets);
      setNotice(null);
    }
  };

  return (
    <View>
      {photos.length > 0 && (
        <View>
          <View className="flex-row mt-4 items-center justify-between">
            <Text className="font-body-semibold text-3xs uppercase text-ink-400">
              {photos.length} of {max}
            </Text>
            <Pressable
              onPress={onRemoveAll}
              accessibilityRole="button"
              accessibilityLabel="Remove all photos"
              hitSlop={8}
              className="active:opacity-60">
              <Text className="font-body-medium text-[11px] text-ink-400">Remove all</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-3 grow-0"
            contentContainerStyle={{ gap: 8 }}>
            {photos.map((photo, index) => (
              <View key={`${photo.localUri}-${index}`} className="overflow-hidden rounded-card">
                <Image
                  source={{ uri: photo.localUri }}
                  style={{ width: tile, height: tile }}
                  resizeMode="cover"
                  accessibilityIgnoresInvertColors
                />

                {/* Upload state sits above the image but below the remove and
                    reorder controls, so a tile that is still moving can still
                    be reordered or dropped. */}
                {(photo.uploading || photo.uploadError) && (
                  <View
                    className="absolute inset-0 items-center justify-center"
                    style={{ backgroundColor: 'rgba(28,24,21,0.58)' }}>
                    {photo.uploading ? (
                      <>
                        <ActivityIndicator color="#fdfaf4" size="small" />
                        <Text className="mt-1 font-body-medium text-[9px] text-paper-50">
                          Uploading
                        </Text>
                      </>
                    ) : (
                      <Pressable
                        onPress={() => onRetry?.(index)}
                        accessibilityRole="button"
                        accessibilityLabel={`Retry uploading photo ${index + 1}`}
                        hitSlop={6}
                        className="items-center justify-center gap-0.5 active:opacity-70">
                        <MaterialCommunityIcons name="refresh" size={19} color="#fdfaf4" />
                        <Text className="font-body-semibold text-[9px] uppercase text-paper-50">
                          Retry
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}

                <Pressable
                  onPress={() => onRemove(index)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove photo ${index + 1}`}
                  className="absolute right-1.5 top-1.5 h-7 w-7 items-center justify-center rounded-pill bg-ink-900/70 active:opacity-70">
                  <MaterialCommunityIcons name="close" size={15} color="#fdfaf4" />
                </Pressable>
                {index === 0 && (
                  <View className="absolute bottom-1.5 left-1.5 rounded-pill bg-ink-900/75 px-2 py-0.5">
                    <Text className="font-body-semibold text-[8.5px] uppercase text-paper-50">
                      Cover
                    </Text>
                  </View>
                )}

                {/* Reordering is explicit rather than drag-based: these tiles
                    live inside a horizontal ScrollView, where a drag gesture
                    has to fight the scroll for every pixel, and a long-press
                    reorder that misfires silently reorders the user's photos.
                    Arrows cannot be ambiguous about what they did. */}
                <View className="absolute bottom-1.5 right-1.5 flex-row overflow-hidden rounded-pill bg-ink-900/70">
                  <ReorderButton
                    icon="chevron-left"
                    label={`Move photo ${index + 1} earlier`}
                    disabled={index === 0}
                    onPress={() => onMove(index, index - 1)}
                  />
                  <ReorderButton
                    icon="chevron-right"
                    label={`Move photo ${index + 1} later`}
                    disabled={index === photos.length - 1}
                    onPress={() => onMove(index, index + 1)}
                  />
                </View>
              </View>
            ))}
          </ScrollView>

          {orderHint ? (
            <Text className="mt-2.5 font-body text-[10.5px] text-ink-400">{orderHint}</Text>
          ) : null}

          {photos.some((photo) => photo.uploadError) && (
            <Text className="mt-1.5 font-body text-[10.5px] text-primary-700">
              A photo did not upload. Tap it to try again.
            </Text>
          )}
        </View>
      )}

      <View className="mt-3 gap-2.5">
        <ActionRow
          icon="image-multiple-outline"
          label="Choose from library"
          disabled={atLimit}
          onPress={openLibrary}
        />
        <ActionRow
          icon="camera-outline"
          label="Take a photo"
          disabled={atLimit}
          onPress={openCamera}
        />

        {notice && (
          <View className="mt-1 rounded-card bg-accent-50 p-3">
            <Text className="font-body text-[11.5px] leading-[17px] text-accent-700">{notice}</Text>
          </View>
        )}

        {atLimit && (
          <Text className="mt-1 font-body text-[11.5px] text-ink-400">
            Ten photos is the maximum for one experience.
          </Text>
        )}

        {/* The caller decides whether this step is required; when photos are not
            necessary yet, a blocked camera still needs to be a way forward. */}
        {photos.length === 0 && emptyNote && (
          <View className="mt-3 flex-row gap-2.5 rounded-card bg-surface p-4">
            <MaterialCommunityIcons name="information-outline" size={15} color="#6b6058" />
            <Text className="flex-1 font-body text-[11px] leading-[17px] text-ink-500">
              {emptyNote}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function ReorderButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      hitSlop={4}
      className="h-6 w-7 items-center justify-center active:opacity-60"
      style={{ opacity: disabled ? 0.3 : 1 }}>
      <MaterialCommunityIcons name={icon} size={15} color="#fdfaf4" />
    </Pressable>
  );
}

function ActionRow({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={`flex-row items-center gap-3 rounded-card border border-border bg-paper-50 px-4 py-3.5 ${disabled ? 'opacity-40' : 'active:opacity-70'
        }`}>
      <MaterialCommunityIcons name={icon} size={19} color="#a03246" />
      <Text className="flex-1 font-body-semibold text-[13px] text-ink-900">{label}</Text>
    </Pressable>
  );
}
