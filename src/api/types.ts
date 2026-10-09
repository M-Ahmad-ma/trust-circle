/**
 * Wire types — API.md §3, copied verbatim from the reference so a contract
 * change shows up as a compile error here rather than as `undefined` at runtime.
 */

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/** Full user — only ever returned for the logged-in user (has email). */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  /** '/uploads/<file>' — relative, prefix with the base URL. */
  avatarPath: string | null;
  bio: string | null;
  /** ISO-8601. */
  createdAt: string;
}

/** Compact user — other people, in lists/search/friends. Never has email. */
export interface SlimUser {
  id: string;
  name: string;
  avatarPath: string | null;
  bio: string | null;
}

export type RelationshipType = 'self' | 'direct_friend' | 'friend_of_friend' | 'none';

export interface Relationship {
  type: RelationshipType;
  /** Pre-localised by the server — render directly, do not re-derive. */
  label: 'You' | 'Your Circle' | 'Extended Circle' | 'Community';
}

export interface Photo {
  id: string;
  /** '/uploads/<file>' — relative, prefix with the base URL. */
  url: string;
  position: number;
}

export interface WirePlace {
  id: string;
  name: string;
  category: string | null;
  address: string | null;
  city: string | null;
  lat: number;
  lng: number;
  /** Present only when the request carried lat/lng. */
  distanceM?: number;
  /** Detail + search only, viewer-aware. */
  experienceCount?: number;
  /** Detail + search only, one decimal. */
  avgRating: number | null;
  /**
   * Cover image, derived server-side from the newest experience at this place that
   * *the requesting viewer* is allowed to see. Absent on a place with no visible
   * photo, and not carried on the `place` nested inside an ExperienceCard.
   * Two viewers can legitimately receive different covers for the same place.
   */
  coverPhoto?: string | null;
}

/** Everything needed to place the pin — present on both Place and card.place. */
export type PlaceMapFields = Pick<WirePlace, 'id' | 'name' | 'lat' | 'lng'>;

/** The card returned everywhere experiences are listed. */
export interface ExperienceCard {
  id: string;
  rating: number;
  review: string;
  /** 'YYYY-MM-DD'. */
  visitedAt: string;
  /** ISO-8601 or Postgres `+00` — both parse with `new Date()`. */
  createdAt: string;
  relationship: Relationship;
  reviewer: { id: string; name: string; avatarPath: string | null };
  place: WirePlace;
  photos: Photo[];
}

export interface ExperienceDetail extends ExperienceCard {
  visibility: 'circle' | 'extended' | 'community';
  updatedAt: string;
}

export interface FriendEntry {
  user: SlimUser;
  friendsSince: string;
}

/**
 * GET /users/suggestions — someone who has been to places you have also been to.
 * `sharedPlaces` is capped at 3 names for display; `sharedPlaceCount` is the real
 * total used for ranking. `relationship` is always `none` here, and the server has
 * already applied visibility to *their* experience, so a shared place can only ever
 * be one you were both allowed to see.
 */
export interface UserSuggestion {
  user: SlimUser;
  relationship: Relationship;
  sharedPlaceCount: number;
  sharedPlaces: string[];
}

/** A friend request as it arrives from GET /friends/requests. */
export interface FriendRequest {
  requestId: string;
  user: SlimUser;
  createdAt: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  user: Omit<AuthUser, 'email'> & { email?: string };
  relationship: Relationship;
  counts: { experiences: number; friends: number };
}

/** List envelope — `meta` present on paginated endpoints only. */
export interface Paginated<T> {
  data: T[];
  meta: { total?: number; limit: number; offset: number };
}

export interface ExploreMeta {
  total: number;
  limit: number;
  offset: number;
  center: { lat: number; lng: number };
  radiusM: number;
  /** Labels actually applied, not the raw layer keys. */
  layers: string[];
}

/** Body of `POST /api/experiences`. Note `reviewText`, not `review`. */
export interface CreateExperienceInput {
  placeId: string;
  rating: number;
  reviewText: string;
  visitedAt: string;
  visibility: Visibility;
  photoIds?: string[];
}

export interface CreatePlaceInput {
  name: string;
  lat: number;
  lng: number;
  category?: string | null;
  address?: string | null;
  city?: string | null;
}

/** Author's publishing choice. Distinct from the viewer's RelationshipType. */
export type Visibility = 'circle' | 'extended' | 'community';

/** `layers` query param for explore — mapped server-side onto relationship types. */
export type ExploreLayer = 'self' | 'circle' | 'extended' | 'community';
