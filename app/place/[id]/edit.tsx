import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
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
 * README §13 — a place added with an approximate pin is only a placeholder
 * until its creator corrects it. Only the person who added the place may edit
 * it; the server enforces that, and this screen refuses to render the form for
 * anyone else even if they arrive by deep link.
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
        <LoadingState label="Loading place…" />
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
            accessibilityLabel="Go back"
            hitSlop={10}
            className="h-9 w-9 items-center justify-center rounded-pill active:opacity-60">
            <MaterialCommunityIcons name="chevron-left" size={24} color="#342d27" />
          </Pressable>
          <Text className="font-body-semibold text-3xs uppercase text-ink-400">Edit place</Text>
          <View className="h-9 w-9" />
        </View>

        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center font-display text-[20px] text-ink-900">
            This place is not yours to edit
          </Text>
          <Text className="mt-3 text-center font-body text-[12.5px] leading-[19px] text-ink-500">
            Only the person who added a place can change its name, address or location. If something
            here is wrong, tell the person who added it.
          </Text>
          <Pressable
            onPress={() => router.replace({ pathname: '/place/[id]', params: { id } })}
            accessibilityRole="button"
            className="mt-6 h-11 items-center justify-center rounded-card border border-primary-600 px-6 active:bg-rose-100">
            <Text className="font-body-semibold text-[13px] text-primary-600">View place</Text>
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

  /**
   * The sheet edits a pending point. Closing it without confirming leaves the
   * saved location untouched, which is the only behaviour that makes a cancel
   * button mean something.
   */
  const [locationOpen, setLocationOpen] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<Coords>(coords);

  const openLocation = () => {
    setPendingCoords(coords);
    setLocationOpen(true);
  };

  const applyLocation = () => {
    setCoords(pendingCoords);
    setLocationOpen(false);
  };

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
            accessibilityLabel="Go back"
            hitSlop={10}
            className="h-9 w-9 items-center justify-center rounded-pill active:opacity-60">
            <MaterialCommunityIcons name="chevron-left" size={24} color="#342d27" />
          </Pressable>
          <Text className="font-body-semibold text-3xs uppercase text-ink-400">Edit place</Text>
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
              Only you can change this place. Experiences written about it are left alone.
            </Text>
          </View>

          <View className="mt-8 gap-6 px-5">
            <AuthField
              label="Place name"
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
              label="Category"
              value={form.category}
              onChangeText={(category) => set('category', category)}
              error={errors.category || null}
              placeholder="cafe"
              autoCapitalize="none"
              returnKeyType="next"
            />

            <AuthField
              label="Address"
              value={form.address}
              onChangeText={(address) => set('address', address)}
              autoCapitalize="words"
            />

            <AuthField
              label="City"
              value={form.city}
              onChangeText={(city) => set('city', city)}
              autoCapitalize="words"
            />

            {/* The map/search moved into a full-height sheet, so the fields
                open at the top of the screen instead of below a 224 px map. */}
            <View>
              <Text className="font-body-semibold text-3xs uppercase text-ink-400">Location</Text>

              <Pressable
                onPress={openLocation}
                accessibilityRole="button"
                accessibilityLabel="Change location"
                className="mt-2 flex-row items-center gap-3 rounded-card border border-hairline bg-paper-50 px-3 py-3 active:opacity-70">
                <View className="h-10 w-10 items-center justify-center rounded-[10px] bg-rose-100">
                  <MaterialCommunityIcons
                    name="map-marker-radius-outline"
                    size={18}
                    color="#a03246"
                  />
                </View>

                <View className="flex-1">
                  <Text className="font-body-semibold text-[13px] text-ink-900">
                    Location selected
                  </Text>
                  <Text numberOfLines={1} className="mt-0.5 font-body text-[11px] text-ink-400">
                    {`${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`}
                  </Text>
                </View>

                <Text className="font-body-semibold text-[11.5px] text-primary-600">Change</Text>
              </Pressable>
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
            {saving ? 'Saving…' : 'Save changes'}
          </Text>
        </Pressable>
      </View>

      {/* Mounted only while open so the map starts from the saved point rather
          than wherever it was left last time. Closing discards the pending
          point; nothing reaches the server until Save changes. */}
      {locationOpen && (
        <Modal
          visible
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setLocationOpen(false)}>
          <KeyboardAvoidingView
            className="flex-1 bg-paper-100"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View
              className="flex-row items-center justify-between border-b border-hairline bg-paper-50 px-4"
              style={{ paddingTop: insets.top + 8, paddingBottom: 8 }}>
              <Pressable
                onPress={() => setLocationOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Close location picker"
                hitSlop={10}
                className="h-10 w-10 items-center justify-center active:opacity-60">
                <MaterialCommunityIcons name="close" size={21} color="#342d27" />
              </Pressable>
              <Text className="font-body-semibold text-3xs uppercase text-ink-400">
                Edit location
              </Text>
              <View className="h-10 w-10" />
            </View>

            <PlaceLocationPicker
              variant="sheet"
              value={pendingCoords}
              onChange={setPendingCoords}
              center={coords}
              userLocation={location}
            />

            <View
              className="border-t border-hairline bg-paper-50 px-4"
              style={{ paddingBottom: Math.max(insets.bottom, 14), paddingTop: 12 }}>
              <Pressable
                onPress={applyLocation}
                accessibilityRole="button"
                className="items-center justify-center rounded-card bg-primary-600 active:opacity-90"
                style={{ height: 52 }}>
                <Text className="font-body-semibold text-[15px] text-primary-fg">
                  Use this location
                </Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </View>
  );
}
