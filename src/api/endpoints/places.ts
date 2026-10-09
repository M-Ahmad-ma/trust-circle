import { api, unwrap, unwrapWithMeta } from '../client';
import type { CreatePlaceInput, WirePlace } from '../types';

export interface PlaceSearchParams {
  q?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  category?: string;
  limit?: number;
  offset?: number;
}

function toQuery(params: PlaceSearchParams): string {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  // lat/lng are a pair — sending one alone is a 400 INVALID_GEO.
  if (params.lat !== undefined && params.lng !== undefined) {
    query.set('lat', String(params.lat));
    query.set('lng', String(params.lng));
  }
  if (params.radius !== undefined) query.set('radius', String(params.radius));
  if (params.category) query.set('category', params.category);
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.offset !== undefined) query.set('offset', String(params.offset));
  return query.toString();
}

export async function searchPlaces(params: PlaceSearchParams) {
  const response = await api(`/api/places/search?${toQuery(params)}`);
  const { data, meta } = await unwrapWithMeta<WirePlace[]>(response);
  return { places: data, total: (meta?.total as number | undefined) ?? data.length };
}

export async function nearbyPlaces(
  params: Omit<PlaceSearchParams, 'lat' | 'lng'> & { lat: number; lng: number }
) {
  const response = await api(`/api/places/nearby?${toQuery(params)}`);
  const { data, meta } = await unwrapWithMeta<WirePlace[]>(response);
  return { places: data, total: (meta?.total as number | undefined) ?? data.length };
}

export async function getPlace(id: string): Promise<WirePlace> {
  return unwrap<WirePlace>(await api(`/api/places/${id}`));
}

export interface CreatedPlace {
  place: WirePlace;
  /**
   * False means the server matched an existing place by fuzzy name within 200 m
   * and returned *that* instead of inserting — reuse `place.id` rather than
   * creating a duplicate.
   */
  created: boolean;
}

export async function createPlace(input: CreatePlaceInput): Promise<CreatedPlace> {
  const response = await api('/api/places', { method: 'POST', json: input });
  const { data, meta } = await unwrapWithMeta<WirePlace>(response);
  return {
    place: data,
    created: (meta?.created as boolean | undefined) ?? response.status === 201,
  };
}
