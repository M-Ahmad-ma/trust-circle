import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { validateUpload } from '@/api/endpoints/uploads';
import { FlowHeader } from '@/components/write/FlowHeader';
import {
  MAX_PHOTOS,
  STEP_ROUTES,
  useExperienceDraft,
  type DraftPhoto,
} from '@/lib/experienceDraft';
import { writeCopy } from '@/data';

/**
 * Photos are uploaded on publish, not here — so this step only collects local
 * files. The previous sample-image strip is gone on purpose: those are bundled
 * JPEGs with no upload id, so they could never be attached to an experience.
 */
export default function PhotoStep() {
  const insets = useSafeAreaInsets();
  const { draft, dispatch } = useExperienceDraft();
  const [notice, setNotice] = useState<string | null>(null);

  const atLimit = draft.photos.length >= MAX_PHOTOS;
  const room = MAX_PHOTOS - draft.photos.length;

  const addAssets = (assets: ImagePicker.ImagePickerAsset[]) => {
    const rejected: string[] = [];

    for (const asset of assets) {
      if (draft.photos.length >= MAX_PHOTOS) break;

      const problem = validateUpload({
        size: asset.fileSize,
        type: asset.mimeType,
      });
      if (problem) {
        rejected.push(problem);
        continue;
      }

      dispatch({
        type: 'addPhoto',
        photo: {
          localUri: asset.uri,
          name: asset.fileName ?? `photo-${Date.now()}.jpg`,
          type: asset.mimeType ?? 'image/jpeg',
        },
      });
    }

    if (rejected.length > 0) setNotice(rejected[0]);
  };

  const openLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setNotice(writeCopy.pickerBlocked);
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
      setNotice(writeCopy.cameraBlocked);
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      addAssets(result.assets);
      setNotice(null);
    }
  };

  const removeAll = () => {
    for (let i = draft.photos.length - 1; i >= 0; i -= 1) {
      dispatch({ type: 'removePhotoAt', index: i });
    }
  };

  return (
    <View className="flex-1 bg-paper-100">
      <View style={{ paddingTop: insets.top + 8 }}>
        <FlowHeader
          current="photo"
          closeLabel={writeCopy.closeFlow}
          onClose={() => router.dismissAll()}
        />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        <View className="px-5 pt-9">
          <Text className="font-body-semibold text-2xs uppercase text-primary-600">
            {writeCopy.optional}
          </Text>
          <Text className="mt-3 font-display text-[30px] leading-[35px] text-ink-900">
            Show what you <Text className="font-display-italic text-primary-600">experienced</Text>.
          </Text>
          <Text className="mt-3 max-w-[320px] font-body text-[13px] leading-[19px] text-ink-500">
            {writeCopy.photoHint}
          </Text>
        </View>

        {draft.photos.length > 0 && (
          <View className="mt-7 px-5">
            <View className="flex-row items-center justify-between">
              <Text className="font-body-semibold text-3xs uppercase text-ink-400">
                {draft.photos.length} of {MAX_PHOTOS}
              </Text>
              <Pressable
                onPress={removeAll}
                accessibilityRole="button"
                accessibilityLabel={writeCopy.removeAllPhotos}
                hitSlop={8}
                className="active:opacity-60">
                <Text className="font-body-medium text-[11px] text-ink-400">
                  {writeCopy.removeAll}
                </Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-3 grow-0"
              contentContainerStyle={{ gap: 8 }}>
              {draft.photos.map((photo: DraftPhoto, index) => (
                <View key={`${photo.localUri}-${index}`} className="overflow-hidden rounded-card">
                  <Image
                    source={{ uri: photo.localUri }}
                    style={{ width: TILE, height: TILE }}
                    resizeMode="cover"
                    accessibilityIgnoresInvertColors
                  />
                  <Pressable
                    onPress={() => dispatch({ type: 'removePhotoAt', index })}
                    accessibilityRole="button"
                    accessibilityLabel={writeCopy.removePhoto(index + 1)}
                    className="absolute right-1.5 top-1.5 h-7 w-7 items-center justify-center rounded-pill bg-ink-900/70 active:opacity-70">
                    <MaterialCommunityIcons name="close" size={15} color="#fdfaf4" />
                  </Pressable>
                  {index === 0 && (
                    <View className="absolute bottom-1.5 left-1.5 rounded-pill bg-ink-900/75 px-2 py-0.5">
                      <Text className="font-body-semibold text-[8.5px] uppercase text-paper-50">
                        {writeCopy.cover}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>

            <Text className="mt-2.5 font-body text-[10.5px] text-ink-400">
              {writeCopy.uploadOnPublish}
            </Text>
          </View>
        )}

        <View className="mt-7 gap-2.5 px-5">
          <ActionRow
            icon="image-multiple-outline"
            label={writeCopy.chooseFromLibrary}
            disabled={atLimit}
            onPress={openLibrary}
          />
          <ActionRow
            icon="camera-outline"
            label={writeCopy.takePhoto}
            disabled={atLimit}
            onPress={openCamera}
          />

          {notice && (
            <View className="mt-1 rounded-card bg-accent-50 p-3">
              <Text className="font-body text-[11.5px] leading-[17px] text-accent-700">
                {notice}
              </Text>
            </View>
          )}

          {atLimit && (
            <Text className="mt-1 font-body text-[11.5px] text-ink-400">
              {writeCopy.photoLimitReached}
            </Text>
          )}

          {/* README §5 — photos are optional, so a blocked camera is not a dead end. */}
          {draft.photos.length === 0 && (
            <View className="mt-3 flex-row gap-2.5 rounded-card bg-surface p-4">
              <MaterialCommunityIcons name="information-outline" size={15} color="#6b6058" />
              <Text className="flex-1 font-body text-[11px] leading-[17px] text-ink-500">
                {writeCopy.photosOptionalNote}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 border-t border-hairline bg-paper-50 px-5"
        style={{ paddingBottom: Math.max(insets.bottom, 14), paddingTop: 12 }}>
        <Pressable
          onPress={() => router.push(STEP_ROUTES.rating)}
          accessibilityRole="button"
          className="items-center justify-center rounded-card bg-primary-600 active:opacity-90"
          style={{ height: 52 }}>
          <Text className="font-body-semibold text-[15px] text-primary-fg">
            {draft.photos.length > 0 ? writeCopy.continueLabel : writeCopy.skipPhotos}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const TILE = 104;

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
      className={`flex-row items-center gap-3 rounded-card border border-border bg-paper-50 px-4 py-3.5 ${
        disabled ? 'opacity-40' : 'active:opacity-70'
      }`}>
      <MaterialCommunityIcons name={icon} size={19} color="#a03246" />
      <Text className="flex-1 font-body-semibold text-[13px] text-ink-900">{label}</Text>
    </Pressable>
  );
}
