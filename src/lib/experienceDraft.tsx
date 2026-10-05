import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';
import type { ImageSourcePropType } from 'react-native';

import type { Visibility } from '@/theme/relationship';

/** README §14 — the Experience data model, minus server-owned fields. */
export type ExperienceDraft = {
  id: string;
  placeId: string | null;
  rating: number | null;
  review: string;
  visitedAt: string | null;
  visibility: Visibility | null;
  photos: ImageSourcePropType[];
};

export const emptyDraft: ExperienceDraft = {
  id: 'draft',
  placeId: null,
  rating: null,
  review: '',
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

type Action =
  | { type: 'setPlace'; placeId: string }
  | { type: 'togglePhoto'; source: ImageSourcePropType }
  | { type: 'removePhotoAt'; index: number }
  | { type: 'movePhoto'; from: number; to: number }
  | { type: 'setRating'; rating: number }
  | { type: 'setReview'; review: string }
  | { type: 'setVisitedAt'; visitedAt: string }
  | { type: 'setVisibility'; visibility: Visibility }
  | { type: 'reset' };

function reducer(state: ExperienceDraft, action: Action): ExperienceDraft {
  switch (action.type) {
    case 'setPlace':
      return { ...state, placeId: action.placeId };
    case 'togglePhoto': {
      // Re-adding an already selected photo moves it to the end rather than
      // duplicating, so tapping twice cannot produce an identical pair.
      const exists = state.photos.indexOf(action.source);
      if (exists >= 0) {
        const photos = state.photos.filter((_, i) => i !== exists);
        return { ...state, photos };
      }
      return { ...state, photos: [...state.photos, action.source] };
    }
    case 'removePhotoAt':
      return { ...state, photos: state.photos.filter((_, i) => i !== action.index) };
    case 'movePhoto': {
      if (action.to < 0 || action.to >= state.photos.length) return state;
      const photos = [...state.photos];
      const [moved] = photos.splice(action.from, 1);
      photos.splice(action.to, 0, moved);
      return { ...state, photos };
    }
    case 'setRating':
      return { ...state, rating: action.rating };
    case 'setReview':
      return { ...state, review: action.review };
    case 'setVisitedAt':
      return { ...state, visitedAt: action.visitedAt };
    case 'setVisibility':
      return { ...state, visibility: action.visibility };
    case 'reset':
      return { ...emptyDraft, id: `draft_${Date.now()}` };
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
      return { complete: draft.review.trim().length >= 10, label: 'Experience' };
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
};

const DraftContext = createContext<DraftContextValue | null>(null);

export function ExperienceDraftProvider({ children }: { children: ReactNode }) {
  const [draft, dispatch] = useReducer(reducer, emptyDraft);

  const value = useMemo<DraftContextValue>(
    () => ({
      draft,
      dispatch,
      reset: () => dispatch({ type: 'reset' }),
    }),
    [draft]
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
