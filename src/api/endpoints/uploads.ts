import { File } from 'expo-file-system';

import { api, unwrap } from '../client';
import { log } from '../logger';
import type { Photo } from '../types';

/**
 * Two-step flow: upload first, then reference the returned id in `photoIds`.
 * The FormData body is passed through untouched — setting Content-Type manually
 * strips the multipart boundary and the server rejects it with NO_FILE.
 */
export type UploadResult = Photo;

/**
 * `placeId` attaches the photo to the place itself rather than leaving it
 * unattached, which is what makes it the place's cover. The server reads it as
 * a plain multipart text field.
 */
export async function uploadPhoto(
  file: {
    uri: string;
    name: string;
    type: string;
  },
  options: { placeId?: string } = {}
): Promise<UploadResult> {
  const form = new FormData();

  /**
   * Not `{ uri, name, type }`, which is what React Native's legacy FormData
   * wanted. Expo's fetch accepts only a string, a real Blob, or an object with
   * `bytes()` — anything else throws "Unsupported FormDataPart implementation"
   * before the request is ever sent, which is exactly what was happening.
   *
   * All three properties are load-bearing, because the server rejects a part
   * missing any of them:
   *   name → without a filename multer treats the part as a plain field and
   *          `req.file` comes back undefined (NO_FILE)
   *   type → `fileFilter` checks `file.mimetype` and answers 415 UNSUPPORTED_TYPE
   *   bytes() → the only thing expo's fetch can actually read the file with
   *
   * `expo-file-system`'s `File` supplies `name` and `bytes()` but has no `type`
   * at all, so the mime type is carried on this wrapper instead. The cast is
   * honest: the part implements the contract expo's fetch documents, even though
   * it is not a `Blob` instance.
   */
  const source = new File(file.uri);
  form.append('file', {
    name: file.name || source.name,
    type: file.type,
    bytes: () => source.bytes(),
  } as unknown as Blob);

  // A text part, not a file: the server reads it off the multipart body.
  if (options.placeId) form.append('placeId', options.placeId);

  log.upload.info('uploading photo', { name: file.name, type: file.type });
  const result = await unwrap<UploadResult>(await api('/api/uploads', { method: 'POST', form }));
  log.upload.info('photo uploaded', { id: result.id, url: result.url });
  return result;
}

export async function deletePhoto(photoId: string): Promise<void> {
  await unwrap<unknown>(await api(`/api/uploads/${photoId}`, { method: 'DELETE' }));
}

/** Server accepts jpeg/png/webp/gif only, ≤ 5 MB (MAX_UPLOAD_MB). */
export const UPLOAD_ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;
export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

export function validateUpload(file: {
  size?: number;
  type?: string;
  mimeType?: string;
}): string | null {
  const type = file.type ?? file.mimeType;
  if (type && !(UPLOAD_ACCEPTED_TYPES as readonly string[]).includes(type)) {
    return 'Photos need to be JPEG, PNG, WebP or GIF.';
  }
  if (typeof file.size === 'number' && file.size > UPLOAD_MAX_BYTES) {
    return 'That photo is larger than 5 MB.';
  }
  return null;
}
