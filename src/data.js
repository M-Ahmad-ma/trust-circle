/**
 * Static content for the Explore screen.
 * Coordinates are real WGS84 positions around Peshawar, Khyber Pakhtunkhwa.
 */

/** @type {import('./types').Viewer} */
export const viewer = {
  firstName: 'Adeel',
  city: 'Peshawar',
  circleName: 'Bala Bagh Circle',
  trustScore: 87,
  trustLabel: 'Trusted',
  streakWeeks: 12,
  circles: 6,
  saved: 24,
};

/** @type {import('./types').Greeting} */
export const greeting = {
  eyebrow: 'Good afternoon',
  title: 'Explore Peshawar',
};

/** @type {import('./types').Category[]} */
export const categories = [
  { id: 'all', label: 'All', count: 248 },
  { id: 'food', label: 'Food', count: 96 },
  { id: 'coffee', label: 'Coffee', count: 41 },
  { id: 'hotels', label: 'Hotels', count: 18 },
  { id: 'shopping', label: 'Shopping', count: 57 },
  { id: 'culture', label: 'Culture', count: 22 },
  { id: 'parks', label: 'Parks', count: 14 },
];

/** People in the viewer's trust circle. */
/** @type {import('./types').Member[]} */
export const members = [
  { id: 'm1', name: 'Bilal Ahmad', initials: 'BA', tint: '#8e2c39', relation: 'Flatmate' },
  { id: 'm2', name: 'Sana Khalid', initials: 'SK', tint: '#4a6b52', relation: 'College friend' },
  { id: 'm3', name: 'Hamza Tariq', initials: 'HT', tint: '#c08a2e', relation: 'Work' },
  { id: 'm4', name: 'Areeba Nawaz', initials: 'AN', tint: '#6e5a86', relation: 'School' },
  { id: 'm5', name: 'Daniyal Shah', initials: 'DS', tint: '#a06c22', relation: 'Cousin' },
  { id: 'm6', name: 'Maryam Iqbal', initials: 'MI', tint: '#3c5943', relation: 'Society' },
  { id: 'm7', name: 'Usman Ghani', initials: 'UG', tint: '#6e1f2a', relation: 'Team' },
  { id: 'm8', name: 'Fatima Javed', initials: 'FJ', tint: '#7c531c', relation: 'Neighbour' },
];

/** @type {import('./types').Place[]} */
export const places = [
  {
    id: 'khyber-restaurant',
    name: 'Khyber Restaurant',
    category: 'food',
    categoryLabel: 'Restaurant',
    neighbourhood: 'Hayatabad Phase 3',
    lngLat: [71.4385, 34.0095],
    distanceKm: 0.8,
    rating: 4.7,
    reviews: 128,
    priceLevel: '$$',
    openNow: true,
    closesAt: '23:30',
    blurb:
      'Charcoal-grilled seekh and mutton karahi that has anchored Hayatabad for three decades.',
    tags: ['Charcoal grill', 'Family hall', 'Cash only'],
    visitedBy: ['m1', 'm2', 'm5'],
    seal: 'Circle favourite',
  },
  {
    id: 'beanstalk-coffee',
    name: 'Beanstalk Coffee',
    category: 'coffee',
    categoryLabel: 'Coffee house',
    neighbourhood: 'Hayatabad Phase 1',
    lngLat: [71.445, 34.0072],
    distanceKm: 1.2,
    rating: 4.8,
    reviews: 214,
    priceLevel: '$$',
    openNow: true,
    closesAt: '22:00',
    blurb: 'Single-origin pour-overs and a courtyard that stays quiet even at sunset.',
    tags: ['Pour over', 'Work friendly', 'Outdoor'],
    visitedBy: ['m3', 'm6'],
    seal: 'Top rated nearby',
  },
  {
    id: 'cheezious-usmanzai',
    name: 'Cheezious',
    category: 'food',
    categoryLabel: 'Fast food',
    neighbourhood: 'Usmanzai',
    lngLat: [71.4822, 33.9956],
    distanceKm: 3.4,
    rating: 4.5,
    reviews: 903,
    priceLevel: '$',
    openNow: true,
    closesAt: '01:00',
    blurb: 'The Zinger legend. Expect a queue after 8pm and worth every minute of it.',
    tags: ['Zinger', 'Late night', 'Takeaway'],
    visitedBy: ['m1', 'm4', 'm7'],
    seal: null,
  },
  {
    id: 'qissa-khwani-bazaar',
    name: 'Qissa Khwani Bazaar',
    category: 'shopping',
    categoryLabel: 'Bazaar',
    neighbourhood: 'Qissa Khwani',
    lngLat: [71.5625, 34.0128],
    distanceKm: 5.1,
    rating: 4.6,
    reviews: 512,
    priceLevel: '$',
    openNow: true,
    closesAt: '20:30',
    blurb: 'Heddings, copper and dry fruit in the lanes the city has traded in for generations.',
    tags: ['Bargain', 'Heritage', 'Weekends'],
    visitedBy: ['m2', 'm6', 'm8'],
    seal: 'Circle favourite',
  },
  {
    id: 'hotel-shahi',
    name: 'Hotel Shahi',
    category: 'hotels',
    categoryLabel: 'Hotel',
    neighbourhood: 'Circular Road',
    lngLat: [71.52, 34.008],
    distanceKm: 2.6,
    rating: 4.3,
    reviews: 347,
    priceLevel: '$$$',
    openNow: false,
    closesAt: 'Reopens 06:00',
    blurb: 'A 1990s circular-road landmark with a bakery that quietly outdraws the lobby.',
    tags: ['Rooms', 'Bakery', 'Conference'],
    visitedBy: ['m7'],
    seal: null,
  },
  {
    id: 'bala-bagh-fort',
    name: 'Bala Bagh Fort',
    category: 'culture',
    categoryLabel: 'Heritage',
    neighbourhood: 'Bala Bagh',
    lngLat: [71.5825, 34.0175],
    distanceKm: 6.3,
    rating: 4.4,
    reviews: 289,
    priceLevel: 'Free',
    openNow: true,
    closesAt: '18:00',
    blurb: 'Timur-era fort on the highest ground in the city. Go at dusk, when the light turns.',
    tags: ['Heritage', 'Sunset', 'Free entry'],
    visitedBy: ['m4', 'm5'],
    seal: null,
  },
  {
    id: 'cafe-qahwa',
    name: 'Café Qahwa',
    category: 'coffee',
    categoryLabel: 'Coffee house',
    neighbourhood: 'University Road',
    lngLat: [71.485, 33.9975],
    distanceKm: 3.9,
    rating: 4.6,
    reviews: 176,
    priceLevel: '$',
    openNow: true,
    closesAt: '23:00',
    blurb: 'Student-run roastery doing serious work with washed arabica off the Islamabad road.',
    tags: ['Roastery', 'Beans to cup', 'Quiet'],
    visitedBy: ['m3'],
    seal: null,
  },
  {
    id: 'peshawar-museum',
    name: 'Peshawar Museum',
    category: 'culture',
    categoryLabel: 'Museum',
    neighbourhood: 'Bala Bagh',
    lngLat: [71.5775, 34.0136],
    distanceKm: 6.1,
    rating: 4.2,
    reviews: 164,
    priceLevel: 'Free',
    openNow: false,
    closesAt: 'Closed Mondays',
    blurb: 'Gandhara Buddhist sculpture and the machinery of the bicycles that built Pakistan.',
    tags: ['Gandhara', 'Guided tour', 'Free entry'],
    visitedBy: ['m6'],
    seal: null,
  },
];

export const defaultPlaceId = 'khyber-restaurant';

export const mapControls = {
  layersLabel: 'Map layers',
  locateLabel: 'Recenter on me',
};

/** OSM requires visible attribution wherever its tiles are displayed. */
export const mapAttribution = '© OpenStreetMap contributors';

export const searchPlaceholder = 'Search places, people or experiences…';

export const viewPlaceLabel = 'View Place';
