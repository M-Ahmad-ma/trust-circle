import type { UserSuggestion } from '@/api/types';

/**
 * Why this person is in the suggestions list. The server caps `sharedPlaces`
 * at three names and reports the real total separately, so the overflow copy
 * stays honest instead of implying those three are the only overlaps.
 */
export function sharedPlaceReason(suggestion: UserSuggestion): string {
  const { sharedPlaces, sharedPlaceCount } = suggestion;
  if (sharedPlaces.length === 0) return '';
  if (sharedPlaceCount > sharedPlaces.length) {
    return `Also at ${sharedPlaces.join(', ')} +${sharedPlaceCount - sharedPlaces.length} more`;
  }
  return sharedPlaces.length === 1
    ? `Also at ${sharedPlaces[0]}`
    : `Also at ${sharedPlaces.join(', ')}`;
}
