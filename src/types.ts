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

/** A place as authored in `data.js` — `visitedBy` holds member ids. */
export type Place = {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  neighbourhood: string;
  lngLat: [longitude: number, latitude: number];
  distanceKm: number;
  rating: number;
  reviews: number;
  priceLevel: string;
  openNow: boolean;
  blurb: string;
  tags: string[];
  visitedBy: string[];
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
