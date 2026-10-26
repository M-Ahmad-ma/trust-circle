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
import { PlaceLocationPicker } from '@/components/PlaceLocationPicker';
import { useApiQuery } from '@/lib/useApiQuery';
import { useUserLocation, type Coords } from '@/lib/useUserLocation';

/**
 * Server cap for `category` — mirrored client-side so an over-long value is
 * caught before the round trip. The pill list used to make this impossible;
 * free text does not.
 */
const CATEGORY_MAX = 60;

type Form = {
  name: string;
  category: string;
  address: string;
  city: string;
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
  const insets = useSafeAreaInsets();

  const place = useApiQuery<WirePlace>(() => placesApi.getPlace(id), {
    key: `place:${id}`,
    errorMessage: 'We could not load this place.',
    isEmpty: () => false,
  });

  if (place.status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-paper-100">
        <LoadingState label={'Loading place…'} />
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

  // Only the creator may amend. Reached by deep link, or by an edit button that
  // was on screen before someone else's change landed. Saying so here is better
  // than letting the user fill in a form and fail on save.
  if (place.data.canEdit !== true) {
    return (
      <View className="flex-1 bg-paper-100">
        <View
          className="flex-row items-center justify-between px-5"
          style={{ paddingTop: insets.top + 8 }}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.navigate('/'))}
            accessibilityRole="button"
            accessibilityLabel={'Go back'}
            hitSlop={10}
            className="h-9 w-9 items-center justify-center rounded-pill active:opacity-60">
            <MaterialCommunityIcons name="chevron-left" size={24} color="#342d27" />
          </Pressable>
          <Text className="font-body-semibold text-3xs uppercase text-ink-400">{'Edit place'}</Text>
          <View className="h-9 w-9" />
        </View>

        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center font-display text-[20px] text-ink-900">
            {'This place is not yours to edit'}
          </Text>
          <Text className="mt-3 text-center font-body text-[12.5px] leading-[19px] text-ink-500">
            {
              'Only the person who added a place can change its name, address or location. If something here is wrong, tell the person who added it.'
            }
          </Text>
          <Pressable
            onPress={() => router.replace({ pathname: '/place/[id]', params: { id } })}
            accessibilityRole="button"
            className="mt-6 h-11 items-center justify-center rounded-card border border-primary-600 px-6 active:bg-rose-100">
            <Text className="font-body-semibold text-[13px] text-primary-600">{'View place'}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return <PlaceForm place={place.data} />;
}

function PlaceForm({ place }: { place: WirePlace }) {
  const insets = useSafeAreaInsets();
  const location = useUserLocation();

  const [form, setForm] = useState<Form>(() => ({
    name: place.name,
    category: place.category ?? '',
    address: place.address ?? '',
    city: place.city ?? '',
  }));

  /**
   * The point, as a coordinate rather than two typed numbers. Decimal degrees
   * are not something a person editing a place can be expected to work out —
   * they read a map and say "here, a bit left". The map is the input; the
   * numbers are only what gets sent.
   */
  const [coords, setCoords] = useState<Coords>(() => ({
    lat: place.lat,
    lng: place.lng,
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

    if (name.length === 0) next.name = 'A place needs a name.';
    else if (name.length > 140) next.name = 'That name is too long.';
    // Mirrors the server's INVALID_NAME rule.
    else if (!/[\p{L}\p{N}]/u.test(name)) next.name = 'The name needs a letter or number.';

    // The pill list made this impossible; free text does not.
    if (current.category.trim().length > CATEGORY_MAX)
      next.category = 'That category is too long — 60 characters at most.';

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
        lat: coords.lat,
        lng: coords.lng,
      });

      // Replace rather than push: backing out of the edit screen should not
      // return to a form holding values that are now stale.
      router.replace({ pathname: '/place/[id]', params: { id: updated.id } });
    } catch (error) {
      if (hasCode(error, 'PLACE_NOT_FOUND')) {
        setNotice('This place no longer exists.');
      } else if (hasCode(error, 'NOT_PLACE_OWNER')) {
        setNotice(
          'Only the person who added a place can change its name, address or location. If something here is wrong, tell the person who added it.'
        );
      } else if (hasCode(error, 'INVALID_NAME')) {
        setErrors({ name: 'The name needs a letter or number.' });
      } else {
        setNotice('Those changes could not be saved. Try again in a moment.');
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
            accessibilityLabel={'Go back'}
            hitSlop={10}
            className="h-9 w-9 items-center justify-center rounded-pill active:opacity-60">
            <MaterialCommunityIcons name="chevron-left" size={24} color="#342d27" />
          </Pressable>
          <Text className="font-body-semibold text-3xs uppercase text-ink-400">{'Edit place'}</Text>
          <View className="h-9 w-9" />
        </View>

        {/*
          The map is the coordinate editor, and it must sit **outside** the
          vertical ScrollView below: nested inside one, the parent wins the
          vertical gesture and the map only pans sideways, which reads as a
          broken map. Pinned above the form it keeps the gesture and stays
          visible while the fields are edited.
        */}
        <PlaceLocationPicker
          value={coords}
          onChange={setCoords}
          center={{ lat: place.lat, lng: place.lng }}
          userLocation={location}
        />

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
              {
                'Places are shared, so anyone can correct the details. Experiences written about this place are left alone.'
              }
            </Text>
          </View>

          <View className="mt-8 gap-6 px-5">
            <AuthField
              label={'Place name'}
              value={form.name}
              onChangeText={(name) => set('name', name)}
              error={errors.name || null}
              autoCapitalize="words"
              returnKeyType="next"
            />

            {/*
              Free text, like the create form. The pill list capped the choice
              to eight fixed words, and a place is not always one of them —
              "rooftop bar", "swimming pool", "bookshop". Empty means no
              category, and the server reads it as clearing the old one.
            */}
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
              autoCapitalize="words"
            />

            <AuthField
              label={'City'}
              value={form.city}
              onChangeText={(city) => set('city', city)}
              autoCapitalize="words"
            />
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
            {saving ? 'Saving…' : 'Save changes'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
