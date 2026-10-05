import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FlowHeader } from '@/components/write/FlowHeader';
import { writeCopy } from '@/data';
import { photo } from '@/theme/photoMap';
import { STEP_ROUTES, useExperienceDraft } from '@/lib/experienceDraft';

const TILE = 104;
const MAX_PHOTOS = 6;

/**
 * Fallback set for when the picker is unavailable or permission is declined, so
 * the step is never a dead end. README §5 makes photos optional precisely so a
 * blocked camera cannot block publishing.
 */
const SAMPLE_KEYS = [
  'janis-cafe-review-1',
  'charsli-tikka-review-1',
  'beanstalk-coffee-hero-1',
  'qissa-khwani-bazaar-hero-2',
  'bala-bagh-fort-hero-3',
  'cafe-qahwa-hero-2',
];

export default function PhotoStep() {
  const insets = useSafeAreaInsets();
  const { draft, dispatch } = useExperienceDraft();
  const [pickerNote, setPickerNote] = useState<string | null>(null);

  const openLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setPickerNote(writeCopy.pickerBlocked);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - draft.photos.length,
      quality: 0.8,
    });

    if (result.canceled) return;

    for (const asset of result.assets) {
      if (draft.photos.length >= MAX_PHOTOS) break;
      dispatch({ type: 'togglePhoto', source: { uri: asset.uri } });
    }
    setPickerNote(null);
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      setPickerNote(writeCopy.cameraBlocked);
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (result.canceled) return;

    dispatch({ type: 'togglePhoto', source: { uri: result.assets[0].uri } });
    setPickerNote(null);
  };

  const atLimit = draft.photos.length >= MAX_PHOTOS;

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
                onPress={() =>
                  draft.photos.forEach((_, index) => dispatch({ type: 'removePhotoAt', index: 0 }))
                }
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
              {draft.photos.map((source, index) => (
                <View key={`${index}`} className="overflow-hidden rounded-card">
                  <Image
                    source={source}
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
              {writeCopy.coverHint}
            </Text>
          </View>
        )}

        <View className="mt-7 gap-2.5 px-5">
          <Pressable
            onPress={openLibrary}
            disabled={atLimit}
            accessibilityRole="button"
            accessibilityLabel={writeCopy.chooseFromLibrary}
            className={`flex-row items-center gap-3 rounded-card border border-border bg-paper-50 px-4 py-3.5 ${
              atLimit ? 'opacity-40' : 'active:opacity-70'
            }`}>
            <MaterialCommunityIcons name="image-multiple-outline" size={19} color="#a03246" />
            <Text className="flex-1 font-body-semibold text-[13px] text-ink-900">
              {writeCopy.chooseFromLibrary}
            </Text>
          </Pressable>

          <Pressable
            onPress={openCamera}
            disabled={atLimit}
            accessibilityRole="button"
            accessibilityLabel={writeCopy.takePhoto}
            className={`flex-row items-center gap-3 rounded-card border border-border bg-paper-50 px-4 py-3.5 ${
              atLimit ? 'opacity-40' : 'active:opacity-70'
            }`}>
            <MaterialCommunityIcons name="camera-outline" size={19} color="#a03246" />
            <Text className="flex-1 font-body-semibold text-[13px] text-ink-900">
              {writeCopy.takePhoto}
            </Text>
          </Pressable>

          {pickerNote && (
            <View className="mt-1 rounded-card bg-accent-50 p-3">
              <Text className="font-body text-[11.5px] leading-[17px] text-accent-700">
                {pickerNote}
              </Text>
            </View>
          )}

          {!atLimit && (
            <>
              <Text className="mt-4 font-body-semibold text-3xs uppercase text-ink-300">
                {writeCopy.orUseSample}
              </Text>
              <View className="mt-2.5 flex-row flex-wrap" style={{ gap: 8 }}>
                {SAMPLE_KEYS.map((key) => (
                  <Pressable
                    key={key}
                    onPress={() => dispatch({ type: 'togglePhoto', source: photo(key) })}
                    accessibilityRole="button"
                    accessibilityLabel={writeCopy.addSample}
                    className="overflow-hidden rounded-[10px] active:opacity-60">
                    <Image
                      source={photo(key)}
                      style={{ width: 64, height: 64, borderRadius: 10 }}
                      resizeMode="cover"
                      accessibilityIgnoresInvertColors
                    />
                  </Pressable>
                ))}
              </View>
            </>
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
