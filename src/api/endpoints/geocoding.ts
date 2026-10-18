import { api, unwrapWithMeta } from '../client';

export interface GeocodeParams {
  q: string;
  /**
   * Search centre. Required by the server: an unbounded lookup ranks by global
   * importance, and "Bala Hisar" then returns a shop in India rather than
   * nothing. Scoping to the map the user is looking at keeps results local.
   */
  lat: number;
  lng: number;
  limit?: number;
}

export interface GeocodeResult {
  id: string;
  name: string;
  /** Full human-readable address — the second line in the results list. */
  displayName: string;
  lat: number;
  lng: number;
  /** Nominatim's type, e.g. `restaurant`, `cafe`. May be null. */
  category: string | null;
  city: string | null;
}

/** Straight-line distance in metres, used to rank results nearest-first. */
export function distanceM(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export async function geocodePlaces({
  q,
  lat,
  lng,
  limit = 5,
}: GeocodeParams): Promise<GeocodeResult[]> {
  const query = new URLSearchParams({
    q: q.trim(),
    lat: String(lat),
    lng: String(lng),
    limit: String(limit),
  });

  const { data } = await unwrapWithMeta<GeocodeResult[]>(await api(`/api/geocode?${query}`));

  // Nominatim ranks by importance; within a city that is rarely "nearest to the
  // pin being placed", which is what the user actually means.
  return [...data].sort((a, b) => distanceM({ lat, lng }, a) - distanceM({ lat, lng }, b));
}
