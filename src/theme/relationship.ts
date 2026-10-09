/**
 * Relationship vs visibility — API.md §2 and README §7.
 *
 * These are two different axes and conflating them is a correctness bug, not a
 * naming preference:
 *
 *   Visibility      what the AUTHOR chose when publishing (circle | extended | community)
 *   RelationshipType what the SERVER computes for the CURRENT VIEWER
 *                   (self | direct_friend | friend_of_friend | none)
 *
 * So an experience published as `circle` reads as "Extended Circle" to someone
 * two connections out, and as "Community" to a stranger. Any badge on a read
 * surface must therefore come from `relationship.type` on the card — never from
 * the stored visibility.
 *
 * Colours encode *proximity to the viewer*, never review quality. A 1-star
 * experience from Your Circle is still red.
 */

import type { RelationshipType, Visibility } from '@/api/types';

export type { RelationshipType, Visibility };

export type RelationshipStyle = {
  type: RelationshipType;
  /** Rendered when the server's label is unavailable; the server's wins. */
  fallbackLabel: string;
  color: string;
  wash: string;
  description: string;
};

export const RELATIONSHIP_STYLES: Record<RelationshipType, RelationshipStyle> = {
  self: {
    type: 'self',
    fallbackLabel: 'You',
    color: '#6b6058',
    wash: '#efe7d6',
    description: 'This is your own experience.',
  },
  direct_friend: {
    type: 'direct_friend',
    fallbackLabel: 'Your Circle',
    color: '#a03246',
    wash: '#f7e3e5',
    description: 'Someone you have personally connected with.',
  },
  friend_of_friend: {
    type: 'friend_of_friend',
    fallbackLabel: 'Extended Circle',
    color: '#d97a2b',
    wash: '#fbeada',
    description: 'Connected through your wider network.',
  },
  none: {
    type: 'none',
    fallbackLabel: 'Community',
    color: '#c9a227',
    wash: '#fbf2d6',
    description: 'Not directly connected to you.',
  },
};

export function relationshipStyle(type: RelationshipType): RelationshipStyle {
  return RELATIONSHIP_STYLES[type];
}

/* -------------------------------------------------------------------------- */
/* Visibility — author-side publishing choice, used only by the write flow.     */
/* -------------------------------------------------------------------------- */

export type VisibilityOption = {
  id: Visibility;
  label: string;
  description: string;
  audience: string;
  color: string;
  wash: string;
};

export const VISIBILITY_OPTIONS: VisibilityOption[] = [
  {
    id: 'circle',
    label: 'Your Circle',
    description: 'Only people you have personally connected with.',
    audience: 'Your Circle',
    color: '#a03246',
    wash: '#f7e3e5',
  },
  {
    id: 'extended',
    label: 'Extended Circle',
    description: 'Friends of friends, and people two connections out.',
    audience: 'Your wider network',
    color: '#d97a2b',
    wash: '#fbeada',
  },
  {
    id: 'community',
    label: 'Community',
    description: 'Anyone on Trust Circle who follows this place.',
    audience: 'All of Trust Circle',
    color: '#c9a227',
    wash: '#fbf2d6',
  },
];

export function visibilityOption(id: Visibility): VisibilityOption {
  return VISIBILITY_OPTIONS.find((option) => option.id === id) ?? VISIBILITY_OPTIONS[0];
}

/**
 * Future option per README §16. Not selectable yet, but modelled so enabling it
 * does not mean touching every consumer.
 */
export const PRIVATE_VISIBILITY = {
  id: 'private' as const,
  label: 'Only me',
  description: 'Kept in your journal. Never shown to anyone else.',
  color: '#6b6058',
  wash: '#efe7d6',
};

/**
 * Future option per README §16, modelled rather than shipped: the write step
 * hides it until the backend accepts it.
 */
export const WRITABLE_VISIBILITIES = VISIBILITY_OPTIONS;
