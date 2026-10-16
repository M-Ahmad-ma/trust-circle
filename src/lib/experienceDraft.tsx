import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react';

import { absoluteUrl } from '@/api/session';
import type { ExperienceDetail, Visibility } from '@/api/types';

/**
 * A photo the user picked but that may not exist on the server yet. `uploadId`
 * is filled in as uploads succeed, so a failed publish can retry without
 * re-uploading — orphaned uploads stay owned by the user and are reusable
 * (API.md §4).
 *
 * When editing, a photo already attached to the experience arrives with
 * `photoId` set and `uploadId` equal to it. That single fact is what lets publish
 * tell "already on the server, keep it" from "new, upload it first", and lets it
 * work out which photos the edit *removed* so they can actually be deleted
 * rather than silently orphaned.
 */
export type DraftPhoto = {
  localUri: string;
  uploadId?: string;
  /** Set only for photos that already belong to the experience being edited. */
  photoId?: string;
  name: string;
  type: string;
};

/** README §14 Experience model, minus the server-owned id/createdAt/updatedAt. */
export type ExperienceDraft = {
  placeId: string | null;
  /** Must serialise as a JSON number, not "5". */
  rating: number | null;
  /** API write name is `reviewText`; the response calls it `review`. */
  reviewText: string;
  /** 'YYYY-MM-DD'. The server rejects future dates with VISITED_AT_FUTURE. */
  visitedAt: string | null;
  visibility: Visibility | null;
  photos: DraftPhoto[];
};

export const emptyDraft: ExperienceDraft = {
  placeId: null,
  rating: null,
  reviewText: '',
  visitedAt: null,
  visibility: null,
  photos: [],
};

/** README §5 order, ending at the preview the user publishes from. */
export const STEPS = [
  'place',
  'photo',
  'rating',
  'story',
  'date',
  'visibility',
  'preview',
] as const;

export type StepId = (typeof STEPS)[number];

export const STEP_ROUTES: Record<StepId, string> = {
  place: '/write/place',
  photo: '/write/photo',
  rating: '/write/rating',
  story: '/write/story',
  date: '/write/date',
  visibility: '/write/visibility',
  preview: '/write/preview',
};

export const MAX_PHOTOS = 10;

type Action =
  | { type: 'setPlace'; placeId: string }
  | { type: 'addPhoto'; photo: DraftPhoto }
  | { type: 'removePhotoAt'; index: number }
  | { type: 'movePhoto'; from: number; to: number }
  | { type: 'markUploaded'; index: number; uploadId: string }
  | { type: 'setRating'; rating: number }
  | { type: 'setReviewText'; reviewText: string }
  | { type: 'setVisitedAt'; visitedAt: string }
  | { type: 'setVisibility'; visibility: Visibility }
  | { type: 'load'; draft: ExperienceDraft }
  | { type: 'reset' };

function reducer(state: ExperienceDraft, action: Action): ExperienceDraft {
  switch (action.type) {
    case 'setPlace':
      return { ...state, placeId: action.placeId };
    case 'addPhoto':
      if (state.photos.length >= MAX_PHOTOS) return state;
      return { ...state, photos: [...state.photos, action.photo] };
    case 'removePhotoAt':
      return { ...state, photos: state.photos.filter((_, i) => i !== action.index) };
    case 'movePhoto': {
      const { from, to } = action;
      // Out-of-range moves come from stale index math in the photo grid when a
      // tile is removed mid-press; ignoring them beats producing a hole.
      if (from === to) return state;
      if (from < 0 || from >= state.photos.length) return state;
      if (to < 0 || to >= state.photos.length) return state;

      const photos = [...state.photos];
      const [moved] = photos.splice(from, 1);
      photos.splice(to, 0, moved);
      return { ...state, photos };
    }
    case 'markUploaded':
      return {
        ...state,
        photos: state.photos.map((photo, i) =>
          i === action.index ? { ...photo, uploadId: action.uploadId } : photo
        ),
      };
    case 'setRating':
      return { ...state, rating: action.rating };
    case 'setReviewText':
      return { ...state, reviewText: action.reviewText };
    case 'setVisitedAt':
      return { ...state, visitedAt: action.visitedAt };
    case 'setVisibility':
      return { ...state, visibility: action.visibility };
    case 'load':
      return action.draft;
    case 'reset':
      return { ...emptyDraft };
    default:
      return state;
  }
}

export type StepStatus = { complete: boolean; label: string };

/** Drives the header rail and the Continue button's disabled state. */
export function stepStatus(draft: ExperienceDraft, step: StepId): StepStatus {
  switch (step) {
    case 'place':
      return { complete: draft.placeId !== null, label: 'Place' };
    case 'photo':
      // README §5 — photos are optional, so this step is always complete.
      return { complete: true, label: 'Photos' };
    case 'rating':
      return { complete: draft.rating !== null && draft.rating > 0, label: 'Rating' };
    case 'story':
      // Server only requires 1 char; the client holds a slightly higher bar.
      return { complete: draft.reviewText.trim().length >= 10, label: 'Experience' };
    case 'date':
      return { complete: draft.visitedAt !== null, label: 'Visited' };
    case 'visibility':
      return { complete: draft.visibility !== null, label: 'Audience' };
    case 'preview':
      return { complete: false, label: 'Preview' };
    default:
      return { complete: false, label: '' };
  }
}

export function canPublish(draft: ExperienceDraft): boolean {
  return STEPS.filter((step) => step !== 'preview').every(
    (step) => stepStatus(draft, step).complete
  );
}

type DraftContextValue = {
  draft: ExperienceDraft;
  dispatch: (action: Action) => void;
  reset: () => void;
  /** Non-null while amending an existing experience rather than writing a new one. */
  editing: EditingState | null;
  /** Seeds the draft from a stored experience. Overwrites whatever was in it. */
  beginEdit: (experience: ExperienceDetail) => void;
};

/**
 * Everything needed to reconcile an edit against what is already on the server.
 * `originalPhotoIds` is the part that cannot be derived from the draft later: by
 * the time publish runs, the removed photos are gone from the draft and nothing
 * left in it says they ever existed.
 */
export type EditingState = {
  id: string;
  originalPhotoIds: string[];
};

const DraftContext = createContext<DraftContextValue | null>(null);

export function ExperienceDraftProvider({ children }: { children: ReactNode }) {
  const [draft, dispatch] = useReducer(reducer, emptyDraft);
  const [editing, setEditing] = useState<EditingState | null>(null);

  const reset = useCallback(() => {
    dispatch({ type: 'reset' });
    setEditing(null);
  }, []);

  const beginEdit = useCallback((experience: ExperienceDetail) => {
    dispatch({
      type: 'load',
      draft: {
        placeId: experience.place.id,
        rating: experience.rating,
        reviewText: experience.review,
        visitedAt: experience.visitedAt,
        visibility: experience.visibility,
        photos: experience.photos.map((photo) => ({
          // Already on the server: `uploadId === photoId` is what stops publish
          // re-uploading it, and `localUri` is the resolved display URL.
          localUri: absoluteUrl(photo.url) ?? '',
          uploadId: photo.id,
          photoId: photo.id,
          name: photo.url,
          type: 'image/jpeg',
        })),
      },
    });
    setEditing({
      id: experience.id,
      originalPhotoIds: experience.photos.map((photo) => photo.id),
    });
  }, []);

  const value = useMemo<DraftContextValue>(
    () => ({ draft, dispatch, reset, editing, beginEdit }),
    [draft, reset, editing, beginEdit]
  );

  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useExperienceDraft(): DraftContextValue {
  const value = useContext(DraftContext);
  if (!value) {
    throw new Error('useExperienceDraft must be used inside ExperienceDraftProvider');
  }
  return value;
}
