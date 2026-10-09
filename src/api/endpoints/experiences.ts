import { api, unwrap, unwrapWithMeta } from '../client';
import type { CreateExperienceInput, ExperienceCard, ExperienceDetail } from '../types';

export async function createExperience(input: CreateExperienceInput): Promise<ExperienceDetail> {
  return unwrap<ExperienceDetail>(await api('/api/experiences', { method: 'POST', json: input }));
}

export async function getExperience(id: string): Promise<ExperienceDetail> {
  return unwrap<ExperienceDetail>(await api(`/api/experiences/${id}`));
}

export type UpdateExperienceInput = Partial<Omit<CreateExperienceInput, 'placeId'>>;

export async function updateExperience(
  id: string,
  input: UpdateExperienceInput
): Promise<ExperienceDetail> {
  return unwrap<ExperienceDetail>(
    await api(`/api/experiences/${id}`, { method: 'PATCH', json: input })
  );
}

export async function deleteExperience(id: string): Promise<void> {
  await unwrap<{ ok: true }>(await api(`/api/experiences/${id}`, { method: 'DELETE' }));
}

export async function listPlaceExperiences(
  placeId: string,
  params: { limit?: number; offset?: number } = {}
): Promise<ExperienceCard[]> {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.offset !== undefined) query.set('offset', String(params.offset));
  const suffix = query.toString() ? `?${query}` : '';
  const { data } = await unwrapWithMeta<ExperienceCard[]>(
    await api(`/api/places/${placeId}/experiences${suffix}`)
  );
  return data;
}
