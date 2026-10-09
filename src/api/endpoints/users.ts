import { api, unwrap, unwrapWithMeta } from '../client';
import { fetchMe } from '../session';
import type {
  AuthUser,
  ExperienceCard,
  FriendEntry,
  FriendRequest,
  Relationship,
  SlimUser,
  UserProfile,
  UserSuggestion,
} from '../types';

export function me(): Promise<AuthUser> {
  return fetchMe();
}

export async function getUser(id: string): Promise<UserProfile> {
  return unwrap<UserProfile>(await api(`/api/users/${id}`));
}

export interface UpdateMeInput {
  name?: string;
  /** null clears it. */
  bio?: string | null;
  /** Must be an upload id path from POST /api/uploads. null clears. */
  avatarPath?: string | null;
}

export async function updateMe(input: UpdateMeInput): Promise<AuthUser> {
  const response = await api('/api/users/me', { method: 'PATCH', json: input });
  return (await unwrap<{ user: AuthUser }>(response)).user;
}

/** Single page by design — no offset, limit caps at 50. */
export async function searchUsers(q: string, limit = 20) {
  const query = new URLSearchParams({ q, limit: String(Math.min(limit, 50)) });
  const { data } = await unwrapWithMeta<
    {
      user: SlimUser;
      // Self and blocked pairs are excluded server-side, so only these two.
      relationship: { type: 'direct_friend' | 'none'; label: 'Your Circle' | 'Community' };
    }[]
  >(await api(`/api/users/search?${query}`));
  return data;
}

/**
 * People who've been to places you've been to. Resolves to `[]` when you have no
 * experiences — that is a normal empty state, not a failure, so callers should render
 * an empty state rather than an error.
 */
export async function fetchSuggestions(limit = 12): Promise<UserSuggestion[]> {
  const { data } = await unwrapWithMeta<UserSuggestion[]>(
    await api(`/api/users/suggestions?limit=${Math.min(limit, 25)}`)
  );
  return data;
}

export async function listUserExperiences(
  id: string,
  params: { limit?: number; offset?: number } = {}
): Promise<ExperienceCard[]> {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.offset !== undefined) query.set('offset', String(params.offset));
  const suffix = query.toString() ? `?${query}` : '';
  const { data } = await unwrapWithMeta<ExperienceCard[]>(
    await api(`/api/users/${id}/experiences${suffix}`)
  );
  return data;
}

export async function listFriends(): Promise<FriendEntry[]> {
  const { data } = await unwrapWithMeta<FriendEntry[]>(await api('/api/friends'));
  return data;
}

export async function listFriendRequests(): Promise<{
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}> {
  return unwrap(await api('/api/friends/requests'));
}

export async function sendFriendRequest(userId: string) {
  return unwrap(await api(`/api/friends/request/${userId}`, { method: 'POST' }));
}

export async function acceptFriendRequest(requestId: string) {
  return unwrap(await api(`/api/friends/${requestId}/accept`, { method: 'POST' }));
}

export async function rejectFriendRequest(requestId: string) {
  return unwrap(await api(`/api/friends/${requestId}/reject`, { method: 'POST' }));
}

export async function removeFriend(userId: string) {
  return unwrap(await api(`/api/friends/${userId}`, { method: 'DELETE' }));
}

export async function blockUser(userId: string) {
  return unwrap(await api(`/api/friends/block/${userId}`, { method: 'POST' }));
}

export async function unblockUser(userId: string) {
  return unwrap(await api(`/api/friends/block/${userId}`, { method: 'DELETE' }));
}

export async function getRelationship(userId: string): Promise<Relationship> {
  return unwrap<Relationship>(await api(`/api/friends/${userId}/relationship`));
}
