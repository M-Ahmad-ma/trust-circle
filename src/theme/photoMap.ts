import type { ImageSourcePropType } from 'react-native';

/**
 * Static require registry for the generated place imagery.
 *
 * Metro resolves `require` paths at build time, so asset keys cannot be
 * composed from data — `src/data.js` stores plain string keys and this map is
 * the only place that knows where the files live.
 */
export const PHOTOS = {
  'bala-bagh-fort-exp-1': require('../../assets/photos/bala-bagh-fort-exp-1.jpg'),
  'bala-bagh-fort-exp-2': require('../../assets/photos/bala-bagh-fort-exp-2.jpg'),
  'bala-bagh-fort-exp-3': require('../../assets/photos/bala-bagh-fort-exp-3.jpg'),
  'bala-bagh-fort-hero-1': require('../../assets/photos/bala-bagh-fort-hero-1.jpg'),
  'bala-bagh-fort-hero-2': require('../../assets/photos/bala-bagh-fort-hero-2.jpg'),
  'bala-bagh-fort-hero-3': require('../../assets/photos/bala-bagh-fort-hero-3.jpg'),
  'bala-bagh-fort-hero-4': require('../../assets/photos/bala-bagh-fort-hero-4.jpg'),
  'beanstalk-coffee-exp-1': require('../../assets/photos/beanstalk-coffee-exp-1.jpg'),
  'beanstalk-coffee-exp-2': require('../../assets/photos/beanstalk-coffee-exp-2.jpg'),
  'beanstalk-coffee-exp-3': require('../../assets/photos/beanstalk-coffee-exp-3.jpg'),
  'beanstalk-coffee-hero-1': require('../../assets/photos/beanstalk-coffee-hero-1.jpg'),
  'beanstalk-coffee-hero-2': require('../../assets/photos/beanstalk-coffee-hero-2.jpg'),
  'beanstalk-coffee-hero-3': require('../../assets/photos/beanstalk-coffee-hero-3.jpg'),
  'beanstalk-coffee-hero-4': require('../../assets/photos/beanstalk-coffee-hero-4.jpg'),
  'cafe-qahwa-exp-1': require('../../assets/photos/cafe-qahwa-exp-1.jpg'),
  'cafe-qahwa-exp-2': require('../../assets/photos/cafe-qahwa-exp-2.jpg'),
  'cafe-qahwa-exp-3': require('../../assets/photos/cafe-qahwa-exp-3.jpg'),
  'cafe-qahwa-hero-1': require('../../assets/photos/cafe-qahwa-hero-1.jpg'),
  'cafe-qahwa-hero-2': require('../../assets/photos/cafe-qahwa-hero-2.jpg'),
  'cafe-qahwa-hero-3': require('../../assets/photos/cafe-qahwa-hero-3.jpg'),
  'cafe-qahwa-hero-4': require('../../assets/photos/cafe-qahwa-hero-4.jpg'),
  'cheezious-usmanzai-exp-1': require('../../assets/photos/cheezious-usmanzai-exp-1.jpg'),
  'cheezious-usmanzai-exp-2': require('../../assets/photos/cheezious-usmanzai-exp-2.jpg'),
  'cheezious-usmanzai-exp-3': require('../../assets/photos/cheezious-usmanzai-exp-3.jpg'),
  'cheezious-usmanzai-hero-1': require('../../assets/photos/cheezious-usmanzai-hero-1.jpg'),
  'cheezious-usmanzai-hero-2': require('../../assets/photos/cheezious-usmanzai-hero-2.jpg'),
  'cheezious-usmanzai-hero-3': require('../../assets/photos/cheezious-usmanzai-hero-3.jpg'),
  'cheezious-usmanzai-hero-4': require('../../assets/photos/cheezious-usmanzai-hero-4.jpg'),
  'hotel-shahi-exp-1': require('../../assets/photos/hotel-shahi-exp-1.jpg'),
  'hotel-shahi-exp-2': require('../../assets/photos/hotel-shahi-exp-2.jpg'),
  'hotel-shahi-exp-3': require('../../assets/photos/hotel-shahi-exp-3.jpg'),
  'hotel-shahi-hero-1': require('../../assets/photos/hotel-shahi-hero-1.jpg'),
  'hotel-shahi-hero-2': require('../../assets/photos/hotel-shahi-hero-2.jpg'),
  'hotel-shahi-hero-3': require('../../assets/photos/hotel-shahi-hero-3.jpg'),
  'hotel-shahi-hero-4': require('../../assets/photos/hotel-shahi-hero-4.jpg'),
  'khyber-restaurant-exp-1': require('../../assets/photos/khyber-restaurant-exp-1.jpg'),
  'khyber-restaurant-exp-2': require('../../assets/photos/khyber-restaurant-exp-2.jpg'),
  'khyber-restaurant-exp-3': require('../../assets/photos/khyber-restaurant-exp-3.jpg'),
  'khyber-restaurant-hero-1': require('../../assets/photos/khyber-restaurant-hero-1.jpg'),
  'khyber-restaurant-hero-2': require('../../assets/photos/khyber-restaurant-hero-2.jpg'),
  'khyber-restaurant-hero-3': require('../../assets/photos/khyber-restaurant-hero-3.jpg'),
  'khyber-restaurant-hero-4': require('../../assets/photos/khyber-restaurant-hero-4.jpg'),
  'peshawar-museum-exp-1': require('../../assets/photos/peshawar-museum-exp-1.jpg'),
  'peshawar-museum-exp-2': require('../../assets/photos/peshawar-museum-exp-2.jpg'),
  'peshawar-museum-exp-3': require('../../assets/photos/peshawar-museum-exp-3.jpg'),
  'peshawar-museum-hero-1': require('../../assets/photos/peshawar-museum-hero-1.jpg'),
  'peshawar-museum-hero-2': require('../../assets/photos/peshawar-museum-hero-2.jpg'),
  'peshawar-museum-hero-3': require('../../assets/photos/peshawar-museum-hero-3.jpg'),
  'peshawar-museum-hero-4': require('../../assets/photos/peshawar-museum-hero-4.jpg'),
  'qissa-khwani-bazaar-exp-1': require('../../assets/photos/qissa-khwani-bazaar-exp-1.jpg'),
  'qissa-khwani-bazaar-exp-2': require('../../assets/photos/qissa-khwani-bazaar-exp-2.jpg'),
  'qissa-khwani-bazaar-exp-3': require('../../assets/photos/qissa-khwani-bazaar-exp-3.jpg'),
  'qissa-khwani-bazaar-hero-1': require('../../assets/photos/qissa-khwani-bazaar-hero-1.jpg'),
  'qissa-khwani-bazaar-hero-2': require('../../assets/photos/qissa-khwani-bazaar-hero-2.jpg'),
  'qissa-khwani-bazaar-hero-3': require('../../assets/photos/qissa-khwani-bazaar-hero-3.jpg'),
  'qissa-khwani-bazaar-hero-4': require('../../assets/photos/qissa-khwani-bazaar-hero-4.jpg'),
} satisfies Record<string, ImageSourcePropType>;

export type PhotoKey = keyof typeof PHOTOS;

export function photo(key: string): ImageSourcePropType {
  return PHOTOS[key as PhotoKey] ?? PHOTOS['khyber-restaurant-hero-1'];
}
