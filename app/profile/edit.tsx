import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { uploadsApi, usersApi } from '@/api';
import { isApiError } from '@/api/errors';
import { validateUpload } from '@/api/endpoints/uploads';
import { AuthButton } from '@/components/auth/AuthButton';
import { AuthField } from '@/components/auth/AuthField';
import { Avatar } from '@/components/Avatar';
import { ProfileTopBar } from '@/components/profile/ProfileTopBar';
import { useApiQuery } from '@/lib/useApiQuery';
import { validateName } from '@/lib/validation';

/**
 * The server's own limits, restated here so the form can refuse a save instead
 * of round-tripping to collect a 400. `PATCH /api/users/me` validates:
 * name 1–80 (trimmed), bio ≤500 or null, avatarPath must be an uploaded file path.
 */
const NAME_MAX = 80;
const BIO_MAX = 500;

/**
 * Edit profile. Writes through `PATCH /api/users/me`, which accepts name, bio and
 * avatarPath — there is no separate avatar endpoint, so a new photo is uploaded
 * first and the returned path is then referenced, exactly like experiences do.
 */
export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();

  // The form seeds from the profile the user is looking at, so it opens
  // pre-filled even when opened by deep link rather than from the profile screen.
  const me = useApiQuery(usersApi.me, {
    key: 'edit-profile-me',
    errorMessage: 'We could not load your profile.',
  });

  const [name, setName] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // `null` means "not overridden yet" — so the form shows the server's value
  // until the user actually types. A plain '' would erase their bio on open.
  const currentName = name ?? me.data?.name ?? '';
  const currentBio = bio ?? me.data?.bio ?? '';
  const currentAvatar = avatarPath !== null ? avatarPath : (me.data?.avatarPath ?? null);

  const nameError = validateName(currentName);
  const bioTooLong = currentBio.length > BIO_MAX;

  const pickAvatar = async () => {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Trust Circle needs photo access to change your picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const problem = validateUpload({ size: asset.fileSize, type: asset.mimeType });
    if (problem) {
      setError(problem);
      return;
    }

    setUploading(true);
    try {
      const photo = await uploadsApi.uploadPhoto({
        uri: asset.uri,
        name: asset.fileName ?? `avatar-${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      });
      // PATCH validates avatarPath against ^/uploads/<file>.<ext>, and uploadPhoto
      // returns exactly that shape as `url`.
      setAvatarPath(photo.url);
    } catch (caught) {
      setError(isApiError(caught) ? caught.message : 'We could not upload that photo.');
    } finally {
      setUploading(false);
    }
  };

  const dirty =
    currentName !== (me.data?.name ?? '') ||
    currentBio !== (me.data?.bio ?? '') ||
    currentAvatar !== (me.data?.avatarPath ?? null);

  const canSave =
    nameError === null && !bioTooLong && !uploading && !busy && (dirty || me.status === 'ready');

  const save = async () => {
    setTouched(true);
    setError(null);
    if (nameError || bioTooLong) return;
    if (!dirty) {
      router.back();
      return;
    }

    setBusy(true);
    try {
      // Send only what changed. Sending bio: '' would blank a bio the user never
      // touched, so an untouched field is simply left out of the patch.
      const patch: Parameters<typeof usersApi.updateMe>[0] = {};
      if (currentName !== (me.data?.name ?? '')) patch.name = currentName;
      if (currentBio !== (me.data?.bio ?? '')) patch.bio = currentBio === '' ? null : currentBio;
      if (currentAvatar !== (me.data?.avatarPath ?? null)) patch.avatarPath = currentAvatar;

      await usersApi.updateMe(patch);
      router.back();
    } catch (caught) {
      setError(
        isApiError(caught)
          ? caught.message
          : 'We could not save your changes. Try again in a moment.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-paper-100">
      <ProfileTopBar
        handle=""
        backLabel="Go back"
        settingsLabel=""
        topInset={insets.top}
        onBack={() => (router.canGoBack() ? router.back() : router.navigate('/'))}
        onSettings={() => { }}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <View className="items-center px-7 pt-6">
          <Pressable
            onPress={() => void pickAvatar()}
            disabled={uploading}
            accessibilityRole="button"
            accessibilityLabel={'Change photo'}
            accessibilityState={{ disabled: uploading, busy: uploading }}
            className="active:opacity-70">
            <Avatar
              user={{ id: 'me', name: currentName || 'You', avatarPath: currentAvatar }}
              size={112}
              ringColor="#fdfaf4"
              ringWidth={3}
            />
          </Pressable>

          <Text className="mt-3 font-body text-[12px] text-primary-600">
            {uploading ? 'Uploading…' : 'Change photo'}
          </Text>
        </View>

        <View className="mt-8 gap-6 px-6">
          <AuthField
            label={'Name'}
            value={currentName}
            onChangeText={setName}
            onBlur={() => setTouched(true)}
            error={touched ? nameError : null}
            hint={`${currentName.length}/${NAME_MAX}`}
            maxLength={NAME_MAX}
            autoCapitalize="words"
            textContentType="name"
          />

          <AuthField
            label={'Bio'}
            value={currentBio}
            onChangeText={setBio}
            onBlur={() => setTouched(true)}
            error={touched && bioTooLong ? 'That bio is a little long' : null}
            hint={`${currentBio.length}/${BIO_MAX}`}
            multiline
            numberOfLines={4}
            maxLength={BIO_MAX + 40}
          />
        </View>

        {error && (
          <View className="mx-6 mt-6 rounded-card bg-rose-100 p-3.5">
            <Text className="font-body text-[12px] leading-[18px] text-primary-700">{error}</Text>
          </View>
        )}

        <View className="mt-8 px-6">
          <AuthButton
            label={'Save changes'}
            onPress={() => void save()}
            busy={busy}
            disabled={!canSave}
          />
        </View>
      </ScrollView>
    </View>
  );
}
