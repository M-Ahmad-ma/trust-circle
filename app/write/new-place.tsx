import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { placesApi, uploadsApi } from '@/api';
import { hasCode } from '@/api/errors';
import { AuthField } from '@/components/auth/AuthField';
import { PlaceLocationPicker } from '@/components/PlaceLocationPicker';
import { PhotoPicker, type PickerPhoto } from '@/components/write/PhotoPicker';
import { useExperienceDraft } from '@/lib/experienceDraft';
import { useUserLocation, type Coords } from '@/lib/useUserLocation';

/** Server cap for `category` — mirrored client-side to avoid a round trip. */
const CATEGORY_MAX = 60;

/** A place carries a cover and a handful of others, not a full gallery. */
const MAX_PLACE_PHOTOS = 6;

/**
 * No `lat`/`lng` fields at all. Coordinates come from the map — your own fix, a
 * dragged pin, or a search result — because asking a person to type decimal
 * degrees is not a thing anyone does. The previous version prefilled Peshawar,
 * so a new account elsewhere created its place at the wrong point and could not
 * see it on its own Explore screen.
 */
type Form = {
  name: string;
  category: string;
  address: string;
  city: string;
};

export default function NewPlaceStep() {
  const insets = useSafeAreaInsets();
  const { dispatch } = useExperienceDraft();
  const { standalone } = useLocalSearchParams<{ standalone?: string }>();
  const location = useUserLocation();

  /**
   * Entered from Explore, adding a place is the whole task — forcing the user
   * into the review flow afterwards was the other half of "there is no way to
   * add a place". Entered from the write flow, the place is a step towards a
   * review, so the draft is updated and the flow continues exactly as before.
   */
  const isStandalone = standalone === '1';

  const [form, setForm] = useState<Form>({
    name: '',
    category: '',
    address: '',
    city: '',
  });

  /** Chosen on the map, or null while the pin has not been placed. */
  const [coords, setCoords] = useState<Coords | null>(null);

  /**
   * The place's own images. They stay local until the place exists, because the
   * upload needs the place id — so these are picked here and sent the moment
   * the place comes back from the server.
   */
  const [photos, setPhotos] = useState<PickerPhoto[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    const name = form.name.trim();

    if (name.length === 0) next.name = 'A place needs a name.';
    else if (name.length > 140) next.name = 'That name is too long.';
    // Mirrors the server's INVALID_NAME rule: must contain a letter or number.
    else if (!/[\p{L}\p{N}]/u.test(name)) next.name = 'The name needs a letter or number.';

    // Free text now, so the length cap is the user's to hit — the pill list
    // made it impossible to exceed.
    if (form.category.trim().length > CATEGORY_MAX)
      next.category = `That category is too long — ${CATEGORY_MAX} characters at most.`;

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const movePhoto = (from: number, to: number) => {
    if (to < 0 || to >= photos.length) return;
    setPhotos((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const save = async () => {
    // Coordinates come from the map, and there is no text field to type them
    // into, so this gate is new — and it must block, because the server would
    // otherwise reject the whole form after it looked filled in.
    if (!coords) {
      setNotice('Tap “Use my location”, or type the coordinates.');
      return;
    }
    if (!validate()) return;

    setSaving(true);
    setNotice(null);

    try {
      const result = await placesApi.createPlace({
        name: form.name.trim(),
        lat: coords.lat,
        lng: coords.lng,
        category: form.category || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
      });

      /**
       * The place exists now, so the photos have somewhere to go. Each upload
       * names the place, which makes the photo the place's own rather than an
       * experience's — and the first one is its cover.
       *
       * A failed upload must not undo the place: it is already created and
       * already true. So failures are counted and reported on the place screen
       * rather than thrown away here.
       */
      let failed = 0;
      for (const photo of photos) {
        try {
          await uploadsApi.uploadPhoto(
            { uri: photo.localUri, name: photo.name, type: photo.type },
            { placeId: result.place.id }
          );
        } catch {
          failed += 1;
        }
      }

      const photosFailedParam = failed > 0 ? { photosFailed: String(failed) } : {};

      if (isStandalone) {
        // `created: false` means the server fuzzy-matched an existing place
        // within 200 m. Silently landing there would read as "you added this",
        // so the place screen says what actually happened.
        router.replace({
          pathname: '/place/[id]',
          params: {
            id: result.place.id,
            ...(result.created ? {} : { deduped: '1' }),
            ...photosFailedParam,
          },
        });
        return;
      }

      dispatch({ type: 'setPlace', placeId: result.place.id });
      router.replace('/write/place');
    } catch (error) {
      if (hasCode(error, 'INVALID_NAME')) {
        setErrors({ name: 'The name needs a letter or number.' });
      } else {
        setNotice('That place could not be saved. Try again in a moment.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-paper-100">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 56}>
        <View
          className="flex-row items-center justify-between px-5"
          style={{ paddingTop: insets.top + 8 }}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={'Go back'}
            hitSlop={10}
            className="h-9 w-9 items-center justify-center rounded-pill active:opacity-60">
            <MaterialCommunityIcons name="chevron-left" size={24} color="#342d27" />
          </Pressable>
          <Text className="font-body-semibold text-3xs uppercase text-ink-400">{'New place'}</Text>
          <View className="h-9 w-9" />
        </View>

        {/*
          Pinned above the scrolling form on purpose. A Map inside a vertical
          ScrollView loses the vertical gesture to the parent — the map then pans
          horizontally but not vertically, which reads as a broken map. Keeping it
          outside the ScrollView hands it the gesture outright.
        */}
        <PlaceLocationPicker
          value={coords}
          onChange={setCoords}
          center={location.coords}
          userLocation={location}
          onPickResult={(result) => {
            // Fill only what the user has not already typed. The gazetteer knows
            // the city and the kind of place better than an empty form does, but
            // overwriting a deliberate edit would be rude.
            setForm((current) => ({
              ...current,
              name: current.name || result.name,
              city: current.city || result.city || current.city,
              category: current.category || result.category || current.category,
            }));
          }}
        />

        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
          <View className="px-5 pt-8">
            <Text className="font-display text-[27px] leading-[32px] text-ink-900">
              Add a place that isn&apos;t here{' '}
              <Text className="font-display-italic text-primary-600">yet</Text>.
            </Text>
            <Text className="mt-3 font-body text-[12.5px] leading-[18px] text-ink-500">
              {isStandalone
                ? 'Add the details you know. You can write your experience about it afterwards.'
                : 'Add the details you know. Location can be rough — you can correct it later.'}
            </Text>
          </View>

          <View className="mt-8 gap-6 px-5">
            <AuthField
              label={'Place name'}
              value={form.name}
              onChangeText={(name) => set('name', name)}
              error={errors.name || null}
              placeholder="Khyber Restaurant"
              autoCapitalize="words"
              returnKeyType="next"
            />

            <AuthField
              label={'Category'}
              value={form.category}
              onChangeText={(category) => set('category', category)}
              error={errors.category || null}
              placeholder="cafe"
              autoCapitalize="none"
              returnKeyType="next"
            />

            <AuthField
              label={'Address'}
              value={form.address}
              onChangeText={(address) => set('address', address)}
              placeholder="23 Saddar Bazaar"
              autoCapitalize="words"
            />

            <AuthField
              label={'City'}
              value={form.city}
              onChangeText={(city) => set('city', city)}
              placeholder="Peshawar"
              autoCapitalize="words"
            />
          </View>

          {/* The place's own images. Same picker as the write flow — the same
              validation, the same cover rule, the same ordering. */}
          <View className="mt-9 px-5">
            <Text className="font-body-semibold text-3xs uppercase text-ink-400">{'Photos'}</Text>
            <Text className="mt-2 max-w-[320px] font-body text-[11.5px] leading-[17px] text-ink-500">
              {'Pictures of the place itself. The first one becomes its cover image.'}
            </Text>

            <View className="mt-4">
              <PhotoPicker
                photos={photos}
                max={MAX_PLACE_PHOTOS}
                orderHint={
                  'The first photo is the cover. Use the arrows on a photo to change its order.'
                }
                emptyNote={
                  'Photos are optional, but a place with a cover is far easier to recognise on the map.'
                }
                onAdd={(added) =>
                  setPhotos((current) => [...current, ...added].slice(0, MAX_PLACE_PHOTOS))
                }
                onRemove={(index) => setPhotos((current) => current.filter((_, i) => i !== index))}
                onMove={movePhoto}
                onRemoveAll={() => setPhotos([])}
              />
            </View>
          </View>

          {/* API dedup note — the honest version of why this form warns you. */}
          <View className="mt-7 px-5">
            <View className="flex-row gap-2.5 rounded-card bg-surface p-4">
              <MaterialCommunityIcons name="link-variant" size={15} color="#6b6058" />
              <Text className="flex-1 font-body text-[11px] leading-[17px] text-ink-500">
                {
                  'If a similar place already exists nearby, Trust Circle will point you at it instead of creating a duplicate.'
                }
              </Text>
            </View>
          </View>

          {notice && (
            <View className="mt-4 px-5">
              <View className="rounded-card bg-rose-100 p-4">
                <Text className="font-body text-[12px] leading-[18px] text-primary-700">
                  {notice}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View
        className="absolute bottom-0 left-0 right-0 border-t border-hairline bg-paper-50 px-5"
        style={{ paddingBottom: Math.max(insets.bottom, 14), paddingTop: 12 }}>
        <Pressable
          onPress={() => void save()}
          disabled={saving}
          accessibilityRole="button"
          accessibilityState={{ busy: saving, disabled: saving }}
          className="items-center justify-center rounded-card active:opacity-90"
          style={{ height: 52, backgroundColor: saving ? '#d9cbb2' : '#a03246' }}>
          <Text
            className="font-body-semibold text-[15px]"
            style={{ color: saving ? '#f3ecdd' : '#fdfaf4' }}>
            {saving ? 'Saving…' : 'Add place'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
