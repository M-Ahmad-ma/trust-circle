/**
 * View-model types for the UI layer.
 *
 * Wire shapes live in `src/api/types.ts` and are re-exported from `src/api`.
 * Nothing here describes server data — these are the shapes screens render.
 */

export type { RelationshipType, Visibility, ExploreLayer } from '@/api/types';

export type ProfileTab = 'reviews' | 'places' | 'photos';

/** Accent family a row or state is tinted with. Never review quality. */
export type ActivityTone = 'berry' | 'gold' | 'rose' | 'sand';

export type ViewMode = 'map' | 'list';

export type AvatarUser = {
  id: string;
  name: string;
  /** Relative path from the API, e.g. '/uploads/abc.png'. */
  coverPhoto?: string | null;
};
