export type Member = {
  id: string;
  name: string;
  initials: string;
  tint: string;
  relation: string;
};

export type Category = {
  id: string;
  label: string;
  count: number;
};

export type ProfileStats = {
  reviews: number;
  places: number;
  photos: number;
};

export type Profile = {
  id: string;
  name: string;
  handle: string;
  city: string;
  bio: string;
  initials: string;
  tint: string;
  isSelf: boolean;
  stats: ProfileStats;
};

export type ProfileReview = {
  id: string;
  placeId: string;
  placeName: string;
  neighbourhood: string;
  time: string;
  rating: number;
  body: string;
  photos: string[];
  helpful: number;
};

export type ProfileTab = 'reviews' | 'places' | 'photos';

/** Accent family an activity row is tinted with — matches the design's per-row colour. */
export type ActivityTone = 'berry' | 'gold' | 'rose' | 'sand';

export type CircleActivity = {
  id: string;
  memberId: string;
  verb: string;
  placeId: string;
  placeName: string;
  headline: string;
  time: string;
  quote: string;
  tone: ActivityTone;
  icon: string;
  photo: string;
};

/** Signals that qualify an experience as genuine rather than promotional. */
export type ExperienceSignals = {
  photo: boolean;
  visitDetails: boolean;
  confirmed: boolean;
};

export type Experience = {
  id: string;
  authorId: string;
  when: string;
  rating: number;
  body: string;
  photo: string;
  signals: ExperienceSignals;
};

/** A place as authored in `data.js` — `visitedBy` holds member ids. */
export type Place = {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  neighbourhood: string;
  address: string;
  lngLat: [longitude: number, latitude: number];
  distanceKm: number;
  rating: number;
  reviews: number;
  priceLevel: string;
  openNow: boolean;
  closesAt: string;
  blurb: string;
  tags: string[];
  visitedBy: string[];
  photos: string[];
  experiences: Experience[];
  seal: string | null;
};

/** A place with `visitedBy` resolved into full member records for display. */
export type ResolvedPlace = Omit<Place, 'visitedBy'> & { visitedBy: Member[] };

export type Viewer = {
  firstName: string;
  city: string;
  circleName: string;
  trustScore: number;
  trustLabel: string;
  streakWeeks: number;
  circles: number;
  saved: number;
};

export type Greeting = {
  eyebrow: string;
  title: string;
};

export type ViewMode = 'map' | 'list';
