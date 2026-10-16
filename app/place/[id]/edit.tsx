import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { placesApi } from '@/api';
import { hasCode } from '@/api/errors';
import type { WirePlace } from '@/api/types';
import { AuthField } from '@/components/auth/AuthField';
import { ErrorState, LoadingState } from '@/components/EmptyState';
import { placeCopyApi } from '@/data';
import { useApiQuery } from '@/lib/useApiQuery';

const CATEGORIES = ['restaurant', 'cafe', 'hotel', 'museum', 'landmark', 'park', 'shop', 'other'];

type Form = {
  name: string;
  category: string;
  address: string;
  city: string;
  lat: string;
  lng: string;
};

/**
 * README §13 — a place added with an approximate pin is only a placeholder until
 * someone corrects it, and the create form already promises that ("Location can
 * be rough — it can be corrected later"). Corrections are open to any signed-in
 * user; the server enforces no ownership, matching the open POST.
 *
 * Split into a loader and a form because the form seeds itself from the loaded
 * record in a state initialiser. Copying the record into state from an effect
 * means two renders that can disagree, and a flash of an empty form; `key`ing
 * the form on the place id makes "re-seed when the record changes" a remount,
 * which is what is actually meant.
 */
export default function EditPlaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const place = useApiQuery<WirePlace>(() => placesApi.getPlace(id), {
    key: `place:${id}`,
    errorMessage: placeCopyApi.failed,
    isEmpty: () => false,
  });

  if (place.status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-paper-100">
        <LoadingState label={placeCopyApi.loading} />
      </View>
    );
  }

  if (place.status === 'error' && !place.data) {
    return (
      <View className="flex-1 items-center justify-center bg-paper-100">
        <ErrorState label={place.message} onRetry={place.refetch} />
      </View>
    );
  }

  if (!place.data) return null;

  return <PlaceForm place={place.data} />;
}

function PlaceForm({ place }: { place: WirePlace }) {
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState<Form>(() => ({
    name: place.name,
    category: place.category ?? '',
    address: place.address ?? '',
    city: place.city ?? '',
    lat: String(place.lat),
    lng: String(place.lng),
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const validate = (current: Form) => {
    const next: Record<string, string> = {};
    const name = current.name.trim();

    if (name.length === 0) next.name = placeCopyApi.editPlaceNameRequired;
    else if (name.length > 140) next.name = 'That name is too long.';
    // Mirrors the server's INVALID_NAME rule.
    else if (!/[\p{L}\p{N}]/u.test(name)) next.name = 'The name needs a letter or number.';

    const lat = Number.parseFloat(current.lat);
    const lng = Number.parseFloat(current.lng);

    if (Number.isNaN(lat) || lat < -90 || lat > 90) next.lat = 'Latitude must be -90 to 90.';
    if (Number.isNaN(lng) || lng < -180 || lng > 180) next.lng = 'Longitude must be -180 to 180.';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (!validate(form)) return;

    setSaving(true);
    setNotice(null);

    try {
      const updated = await placesApi.updatePlace(place.id, {
        name: form.name.trim(),
        // An empty category means "no category", not "keep the old one" — the
        // user cleared the field on purpose, and the server treats null as clear.
        category: form.category.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        lat: Number.parseFloat(form.lat),
        lng: Number.parseFloat(form.lng),
      });

      // Replace rather than push: backing out of the edit screen should not
      // return to a form holding values that are now stale.
      router.replace({ pathname: '/place/[id]', params: { id: updated.id } });
    } catch (error) {
      if (hasCode(error, 'PLACE_NOT_FOUND')) {
        setNotice(placeCopyApi.editPlaceMissing);
      } else if (hasCode(error, 'INVALID_NAME')) {
        setErrors({ name: 'The name needs a letter or number.' });
      } else {
        setNotice(placeCopyApi.editPlaceFailed);
      }
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
            onPress={() => (router.canGoBack() ? router.back() : router.navigate('/'))}
            accessibilityRole="button"
            accessibilityLabel={placeCopyApi.back}
            hitSlop={10}
            className="h-9 w-9 items-center justify-center rounded-pill active:opacity-60">
            <MaterialCommunityIcons name="chevron-left" size={24} color="#342d27" />
          </Pressable>
          <Text className="font-body-semibold text-3xs uppercase text-ink-400">
            {placeCopyApi.editPlaceEyebrow}
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
              Fix the <Text className="font-display-italic text-primary-600">details</Text>.
            </Text>
            <Text className="mt-3 font-body text-[12.5px] leading-[18px] text-ink-500">
              {placeCopyApi.editPlaceHint}
            </Text>
          </View>

          <View className="mt-8 gap-6 px-5">
            <AuthField
              label={placeCopyApi.editPlaceNameLabel}
              value={form.name}
              onChangeText={(name) => set('name', name)}
              error={errors.name || null}
              autoCapitalize="words"
              returnKeyType="next"
            />

            <View>
              <Text className="font-body-semibold text-3xs uppercase text-ink-400">
                {placeCopyApi.editPlaceCategoryLabel}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mt-2.5 grow-0"
                contentContainerStyle={{ gap: 8, paddingRight: 4 }}>
                {CATEGORIES.map((category) => {
                  const active = form.category === category;

                  return (
                    <Pressable
                      key={category}
                      onPress={() => set('category', active ? '' : category)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      className="rounded-pill border px-3.5 py-2 active:opacity-70"
                      style={{
                        borderColor: active ? '#a03246' : '#e0d2b4',
                        backgroundColor: active ? '#a03246' : '#fdfaf4',
                      }}>
                      <Text
                        className={
                          active
                            ? 'font-body-semibold text-[11.5px] text-primary-fg'
                            : 'font-body-medium text-[11.5px] text-ink-700'
                        }>
                        {category}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <AuthField
              label={placeCopyApi.editPlaceAddressLabel}
              value={form.address}
              onChangeText={(address) => set('address', address)}
              autoCapitalize="words"
            />

            <AuthField
              label={placeCopyApi.editPlaceCityLabel}
              value={form.city}
              onChangeText={(city) => set('city', city)}
              autoCapitalize="words"
            />

            <View className="flex-row gap-4">
              <View className="flex-1">
                <AuthField
                  label="Latitude"
                  value={form.lat}
                  onChangeText={(text) => set('lat', text)}
                  error={errors.lat || null}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View className="flex-1">
                <AuthField
                  label="Longitude"
                  value={form.lng}
                  onChangeText={(text) => set('lng', text)}
                  error={errors.lng || null}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>
          </View>

          {notice && (
            <View className="mt-5 px-5">
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
            {saving ? placeCopyApi.saving : placeCopyApi.savePlaceChanges}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
