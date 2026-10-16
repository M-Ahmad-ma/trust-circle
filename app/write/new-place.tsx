import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { placesApi } from '@/api';
import { hasCode } from '@/api/errors';
import { AuthField } from '@/components/auth/AuthField';
import { useExperienceDraft } from '@/lib/experienceDraft';
import { useUserLocation } from '@/lib/useUserLocation';
import { writeCopy } from '@/data';

/** Server cap for `category` — mirrored client-side to avoid a round trip. */
const CATEGORY_MAX = 60;

/**
 * Coordinates are held as text, not numbers. A number field cannot represent
 * "not set yet" — the previous version prefilled Peshawar's coordinates, so a
 * new account anywhere else created its place at the wrong point on the map and
 * could not see it on their own Explore screen. Empty is the honest default and
 * "Use my location" fills it in one tap.
 */
type Form = {
  name: string;
  category: string;
  address: string;
  city: string;
  lat: string;
  lng: string;
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
    lat: '',
    lng: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  /**
   * Fills the coordinates from a real fix, or asks for one. When the OS will no
   * longer prompt there is nothing to ask for, so it routes to Settings rather
   * than appearing to do nothing.
   */
  const useMyLocation = () => {
    if (location.isFallback) {
      if (location.canAskAgain) location.request();
      else location.openSettings();
      return;
    }

    // Six decimals is ~10 cm — finer than any consumer GPS, and enough that
    // rounding can never move someone else's place.
    set('lat', location.coords.lat.toFixed(6));
    set('lng', location.coords.lng.toFixed(6));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    const name = form.name.trim();

    if (name.length === 0) next.name = writeCopy.newPlaceNameRequired;
    else if (name.length > 140) next.name = 'That name is too long.';
    // Mirrors the server's INVALID_NAME rule: must contain a letter or number.
    else if (!/[\p{L}\p{N}]/u.test(name)) next.name = 'The name needs a letter or number.';

    // Free text now, so the length cap is the user's to hit — the pill list
    // made it impossible to exceed.
    if (form.category.trim().length > CATEGORY_MAX)
      next.category = `That category is too long — ${CATEGORY_MAX} characters at most.`;

    const lat = Number.parseFloat(form.lat);
    const lng = Number.parseFloat(form.lng);

    if (form.lat.trim() === '') next.lat = writeCopy.locationRequired;
    else if (Number.isNaN(lat) || lat < -90 || lat > 90)
      next.lat = 'Latitude must be between -90 and 90.';

    if (form.lng.trim() === '') next.lng = writeCopy.locationRequired;
    else if (Number.isNaN(lng) || lng < -180 || lng > 180)
      next.lng = 'Longitude must be between -180 and 180.';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (!validate()) return;

    setSaving(true);
    setNotice(null);

    try {
      const result = await placesApi.createPlace({
        name: form.name.trim(),
        lat: Number.parseFloat(form.lat),
        lng: Number.parseFloat(form.lng),
        category: form.category || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
      });

      if (isStandalone) {
        // `created: false` means the server fuzzy-matched an existing place
        // within 200 m. Silently landing there would read as "you added this",
        // so the place screen says what actually happened.
        router.replace({
          pathname: '/place/[id]',
          params: { id: result.place.id },
          ...(result.created ? {} : { deduped: '1' }),
        });
        return;
      }

      dispatch({ type: 'setPlace', placeId: result.place.id });
      router.replace('/write/place');
    } catch (error) {
      if (hasCode(error, 'INVALID_NAME')) {
        setErrors({ name: 'The name needs a letter or number.' });
      } else {
        setNotice(writeCopy.newPlaceFailed);
      }
    } finally {
      setSaving(false);
    }
  };

  const locationLabel =
    location.status === 'requesting'
      ? writeCopy.locating
      : location.isFallback && !location.canAskAgain
        ? writeCopy.locationOff
        : writeCopy.useMyLocation;

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
            accessibilityLabel={writeCopy.back}
            hitSlop={10}
            className="h-9 w-9 items-center justify-center rounded-pill active:opacity-60">
            <MaterialCommunityIcons name="chevron-left" size={24} color="#342d27" />
          </Pressable>
          <Text className="font-body-semibold text-3xs uppercase text-ink-400">
            {writeCopy.newPlaceEyebrow}
          </Text>
          <View className="h-9 w-9" />
        </View>

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
              {isStandalone ? writeCopy.newPlaceHintStandalone : writeCopy.newPlaceHint}
            </Text>
          </View>

          <View className="mt-8 gap-6 px-5">
            <AuthField
              label={writeCopy.newPlaceNameLabel}
              value={form.name}
              onChangeText={(name) => set('name', name)}
              error={errors.name || null}
              placeholder="Khyber Restaurant"
              autoCapitalize="words"
              returnKeyType="next"
            />

            <AuthField
              label={writeCopy.newPlaceCategoryLabel}
              value={form.category}
              onChangeText={(category) => set('category', category)}
              error={errors.category || null}
              hint={writeCopy.newPlaceCategoryHint}
              placeholder="cafe"
              autoCapitalize="none"
              returnKeyType="next"
            />

            <AuthField
              label={writeCopy.newPlaceAddressLabel}
              value={form.address}
              onChangeText={(address) => set('address', address)}
              placeholder="23 Saddar Bazaar"
              autoCapitalize="words"
            />

            <AuthField
              label={writeCopy.newPlaceCityLabel}
              value={form.city}
              onChangeText={(city) => set('city', city)}
              placeholder="Peshawar"
              autoCapitalize="words"
            />

            <View className="gap-2.5">
              {/* Location is the one field a person cannot know by heart, so it
                  gets a button rather than making them type a decimal degree. */}
              <Pressable
                onPress={useMyLocation}
                accessibilityRole="button"
                accessibilityLabel={locationLabel}
                className="flex-row items-center justify-center gap-2 rounded-card border border-dashed border-sand-400 py-3 active:opacity-70">
                <MaterialCommunityIcons name="crosshairs-gps" size={16} color="#a03246" />
                <Text className="font-body-semibold text-[12.5px] text-primary-600">
                  {locationLabel}
                </Text>
              </Pressable>

              {location.isFallback && (
                <Text className="font-body text-[11px] leading-[17px] text-ink-400">
                  {location.canAskAgain
                    ? writeCopy.locationUnavailable
                    : writeCopy.locationUnavailableSettings}
                </Text>
              )}
            </View>

            <View className="flex-row gap-4">
              <View className="flex-1">
                <AuthField
                  label="Latitude"
                  value={form.lat}
                  onChangeText={(text) => set('lat', text)}
                  error={errors.lat || null}
                  placeholder="34.0152"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View className="flex-1">
                <AuthField
                  label="Longitude"
                  value={form.lng}
                  onChangeText={(text) => set('lng', text)}
                  error={errors.lng || null}
                  placeholder="71.5806"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>
          </View>

          {/* API dedup note — the honest version of why this form warns you. */}
          <View className="mt-7 px-5">
            <View className="flex-row gap-2.5 rounded-card bg-surface p-4">
              <MaterialCommunityIcons name="link-variant" size={15} color="#6b6058" />
              <Text className="flex-1 font-body text-[11px] leading-[17px] text-ink-500">
                {writeCopy.dedupNote}
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
            {saving ? writeCopy.saving : writeCopy.addPlace}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
