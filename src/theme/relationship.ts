/**
 * Relationship levels — README §7.
 *
 * These colours encode *proximity to the viewer*, never review quality. A 1-star
 * experience from Your Circle is still red; a 5-star one from Community is still
 * yellow. Every surface that shows a reviewer must use this scale rather than
 * borrowing an accent from the review itself.
 */

export type Visibility = 'circle' | 'extended' | 'community';

export type RelationshipLevel = {
  id: Visibility;
  label: string;
  /** Short form for dense rows. */
  short: string;
  color: string;
  /** Tinted background for badges. */
  wash: string;
  description: string;
  /** Who can see it, in plain words. */
  audience: string;
};

export const RELATIONSHIP: Record<Visibility, RelationshipLevel> = {
  circle: {
    id: 'circle',
    label: 'Your Circle',
    short: 'Circle',
    color: '#a03246',
    wash: '#f7e3e5',
    description: 'Only people you have personally connected with.',
    audience: '17 people in your Circle',
  },
  extended: {
    id: 'extended',
    label: 'Extended Circle',
    short: 'Extended',
    color: '#d97a2b',
    wash: '#fbeada',
    description: 'Friends of friends, and people two connections out.',
    audience: 'Your wider network',
  },
  community: {
    id: 'community',
    label: 'Community',
    short: 'Community',
    color: '#c9a227',
    wash: '#fbf2d6',
    description: 'Anyone on Trust Circle who follows this place.',
    audience: 'All of Trust Circle',
  },
};

/** Fixed order — always presents the most intimate audience first. */
export const VISIBILITY_ORDER: Visibility[] = ['circle', 'extended', 'community'];

export function relationshipFor(visibility: Visibility): RelationshipLevel {
  return RELATIONSHIP[visibility];
}

/**
 * Future option per README §16. Not selectable yet, but modelled so adding it
 * does not mean touching every consumer.
 */
export const PRIVATE_VISIBILITY = {
  id: 'private' as const,
  label: 'Only me',
  color: '#6b6058',
  wash: '#efe7d6',
  description: 'Kept in your journal. Never shown to anyone else.',
  audience: 'Only you',
};
