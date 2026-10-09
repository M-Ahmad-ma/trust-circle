import { api, unwrapWithMeta } from '../client';
import type { ExploreLayer, ExploreMeta, ExperienceCard } from '../types';

export interface ExploreParams {
  lat: number;
  lng: number;
  radius?: number;
  layers?: ExploreLayer[];
  limit?: number;
  offset?: number;
}

export interface ExplorePage {
  experiences: ExperienceCard[];
  meta: ExploreMeta;
  hasMore: boolean;
}

export async function exploreNearby({
  lat,
  lng,
  radius = 5000,
  layers,
  limit = 30,
  offset = 0,
}: ExploreParams): Promise<ExplorePage> {
  const query = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radius: String(radius),
    limit: String(limit),
    offset: String(offset),
  });
  // Unknown layer values are ignored server-side; empty means "no filter".
  if (layers && layers.length > 0) query.set('layers', layers.join(','));

  const { data, meta } = await unwrapWithMeta<ExperienceCard[]>(
    await api(`/api/explore/nearby?${query}`)
  );

  const resolved = meta as unknown as ExploreMeta | undefined;
  const total = resolved?.total ?? data.length;
  const pageLimit = resolved?.limit ?? limit;
  const pageOffset = resolved?.offset ?? offset;

  return {
    experiences: data,
    meta: resolved ?? {
      total,
      limit: pageLimit,
      offset: pageOffset,
      center: { lat, lng },
      radiusM: radius,
      layers: [],
    },
    hasMore: pageOffset + pageLimit < total,
  };
}
