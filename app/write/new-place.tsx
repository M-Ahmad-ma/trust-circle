import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { placesApi } from '@/api';
import { hasCode } from '@/api/errors';
import type { CreatePlaceInput } from '@/api/types';
import { AuthField } from '@/components/auth/AuthField';
import { useExperienceDraft } from '@/lib/experienceDraft';
import { writeCopy } from '@/data';

/** API accepts any category string ≤ 60; these are the common OpenMapTiles values. */
const CATEGORIES = ['restaurant', 'cafe', 'hotel', 'museum', 'landmark', 'park', 'shop', 'other'];

/** Peshawar centre — prefilled so the common case needs no coordinates. */
const DEFAULT_CENTER = { lat: 34.015, lng: 71.58 };

export default function NewPlaceStep() {
  const insets = useSafeAreaInsets();
  const { dispatch } = useExperienceDraft();

  const [form, setForm] = useState<CreatePlaceInput>({
    name: '',
    lat: DEFAULT_CENTER.lat,
    lng: DEFAULT_CENTER.lng,
    category: 'restaurant',
    address: '',
    city: 'Peshawar',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ text: string; matched: boolean } | null>(null);

  const set = <K extends keyof CreatePlaceInput>(key: K, value: CreatePlaceInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    const name = form.name.trim();

    if (name.length === 0) next.name = writeCopy.newPlaceNameRequired;
    else if (name.length > 140) next.name = 'That name is too long.';
    // Mirrors the server's INVALID_NAME rule: must contain a letter or number.
    else if (!/[\p{L}\p{N}]/u.test(name)) next.name = 'The name needs a letter or number.';

    if (typeof form.lat !== 'number' || form.lat < -90 || form.lat > 90)
      next.lat = 'Latitude must be between -90 and 90.';
    if (typeof form.lng !== 'number' || form.lng < -180 || form.lng > 180)
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
        ...form,
        name: form.name.trim(),
        category: form.category || null,
        address: form.address?.trim() || null,
        city: form.city?.trim() || null,
      });

      dispatch({ type: 'setPlace', placeId: result.place.id });
      router.replace('/write/place');
    } catch (error) {
      if (hasCode(error, 'INVALID_NAME')) {
        setErrors({ name: 'The name needs a letter or number.' });
      } else {
        setNotice({ text: writeCopy.newPlaceFailed, matched: false });
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
              {writeCopy.newPlaceHint}
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

            <View>
              <Text className="font-body-semibold text-3xs uppercase text-ink-400">
                {writeCopy.newPlaceCategoryLabel}
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
                      onPress={() => set('category', category)}
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
              label={writeCopy.newPlaceAddressLabel}
              value={form.address ?? ''}
              onChangeText={(address) => set('address', address)}
              placeholder="23 Saddar Bazaar"
              autoCapitalize="words"
            />

            <AuthField
              label={writeCopy.newPlaceCityLabel}
              value={form.city ?? ''}
              onChangeText={(city) => set('city', city)}
              placeholder="Peshawar"
              autoCapitalize="words"
            />

            <View className="flex-row gap-4">
              <View className="flex-1">
                <AuthField
                  label="Latitude"
                  value={String(form.lat)}
                  onChangeText={(text) => {
                    const parsed = Number.parseFloat(text);
                    set('lat', Number.isNaN(parsed) ? Number.NaN : parsed);
                  }}
                  error={errors.lat || null}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View className="flex-1">
                <AuthField
                  label="Longitude"
                  value={String(form.lng)}
                  onChangeText={(text) => {
                    const parsed = Number.parseFloat(text);
                    set('lng', Number.isNaN(parsed) ? Number.NaN : parsed);
                  }}
                  error={errors.lng || null}
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
                  {notice.text}
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
