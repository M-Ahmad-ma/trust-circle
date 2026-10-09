import { api, unwrap } from '../client';
import { log } from '../logger';
import type { Photo } from '../types';

/**
 * Two-step flow: upload first, then reference the returned id in `photoIds`.
 * The FormData body is passed through untouched — setting Content-Type manually
 * strips the multipart boundary and the server rejects it with NO_FILE.
 */
export type UploadResult = Photo;

export async function uploadPhoto(file: {
  uri: string;
  name: string;
  type: string;
}): Promise<UploadResult> {
  const form = new FormData();
  // React Native's FormData takes this object shape for file parts.
  form.append('file', file as unknown as Blob);

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
