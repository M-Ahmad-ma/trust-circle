import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FlowHeader } from '@/components/write/FlowHeader';
import { PhotoPicker } from '@/components/write/PhotoPicker';
import {
  MAX_PHOTOS,
  STEP_ROUTES,
  useExperienceDraft,
  type DraftPhoto,
} from '@/lib/experienceDraft';

/**
 * Photos are uploaded on publish, not here — so this step only collects local
 * files. The previous sample-image strip is gone on purpose: those are bundled
 * JPEGs with no upload id, so they could never be attached to an experience.
 */
export default function PhotoStep() {
  const insets = useSafeAreaInsets();
  const { draft, dispatch } = useExperienceDraft();

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
          closeLabel={'Discard this experience'}
          onClose={() => router.dismissAll()}
        />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        <View className="px-5 pt-9">
          <Text className="font-body-semibold text-2xs uppercase text-primary-600">
            {'Optional'}
          </Text>
          <Text className="mt-3 font-display text-[30px] leading-[35px] text-ink-900">
            Show what you <Text className="font-display-italic text-primary-600">experienced</Text>.
          </Text>
          <Text className="mt-3 max-w-[320px] font-body text-[13px] leading-[19px] text-ink-500">
            {
              'Photos are the difference between a claim and a memory. Add as many as you like, or none at all.'
            }
          </Text>
        </View>

        <View className="mt-7 px-5">
          <PhotoPicker
            photos={draft.photos}
            max={MAX_PHOTOS}
            orderHint={
              'The first photo is the cover. Use the arrows on a photo to change its order.'
            }
            emptyNote={
              'Photos make an experience worth trusting, but they are not required. You can publish without one.'
            }
            onAdd={(added) => {
              for (const photo of added) {
                dispatch({ type: 'addPhoto', photo: photo as DraftPhoto });
              }
            }}
            onRemove={(index) => dispatch({ type: 'removePhotoAt', index })}
            onMove={(from, to) => dispatch({ type: 'movePhoto', from, to })}
            onRemoveAll={removeAll}
          />
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
            {draft.photos.length > 0 ? 'Continue' : 'Skip photos for now'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
