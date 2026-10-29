# Trust Circle — App Reference

What the mobile app is, how it is built, and exactly which API call each screen makes.

This complements two existing documents:

| Document | Covers |
| --- | --- |
| `README.md` | The product idea and why it exists |
| `API.md` | The full HTTP contract — payloads, error codes, enums |
| **This file** | The app itself: screens, routing, per-screen API usage, architecture |

---

## 1. What the app is

**Trust Circle** is a location-based social discovery app built on one idea:

> People trust experiences shared by people they know.

Conventional review platforms show anonymous ratings. Trust Circle shows *who* wrote a review and **how that person is connected to you** — Your Circle, Extended Circle, or Community.

A place's identity is a **Place**. A person's opinion of it is an **Experience** (photo + 1–5 rating + written review + visit date). Every experience carries a **visibility** that scopes it to a relationship tier, and the server enforces that scoping on every read. Two people can legitimately see different content for the same place.

The app is a client of a separate Node/Express server in `../server`. It has no business logic of its own — every screen renders what the API returns.

---

## 2. Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Expo SDK 56, expo-router 56 (file-based routing) |
| Runtime | React Native 0.85.3, React 19.2.3 |
| Language | TypeScript ~6.0 |
| Styling | NativeWind 4 (Tailwind 3 preset), custom warm-paper palette |
| Maps | `@maplibre/maplibre-react-native` 11.4 |
| Storage | `expo-secure-store` for tokens |
| Fonts | Fraunces (display/serif) + Sora (body/sans) via `expo-font` |
| Media | `expo-image-picker` |
| Anim | `react-native-reanimated` 4.3 + `react-native-worklets` |

**Basemap tiles:** Liberty from OpenFreeMap, restyled to the app's warm sand palette in `src/theme/warmStyle.ts`. Vector tiles, so it stays sharp at every zoom. Attribution is rendered in-app at `src/theme/mapStyle.ts:37` — `© OpenFreeMap · © OpenMapTiles / © OpenStreetMap contributors` — and is deliberately not hidden behind the map's own control.

**Geographic anchor:** Peshawar, Pakistan. The map centres on `34.0052, 71.4789` at zoom 13.6.

---

## 3. Project layout

```
my-expo-app/
├─ app/                     # Routes only — one file per screen
│  ├─ _layout.tsx           # Root Stack; gates on fonts + session hydration
│  ├─ +not-found.tsx
│  ├─ (auth)/               # Unauthenticated group
│  │  ├─ _layout.tsx        # Redirects to /(tabs) if already signed in
│  │  ├─ login.tsx
│  │  └─ register.tsx
│  ├─ (tabs)/               # Signed-in group
│  │  ├─ _layout.tsx        # Redirects to login if no session
│  │  ├─ index.tsx          # Explore — map/list of nearby places
│  │  ├─ circles.tsx        # Friends, suggestions, requests
│  │  └─ profile.tsx        # Your own profile, inline
│  ├─ friends.tsx           # Friends hub — requests, suggestions, your friends
│  ├─ place/[id].tsx        # Place detail
│  ├─ experience/[id].tsx   # Experience detail
│  ├─ profile/
│  │  ├─ [id].tsx           # Someone else's profile
│  │  ├─ me.tsx             # Static route resolving to your own id
│  │  ├─ edit.tsx           # Edit name / bio / avatar
│  │  └─ search.tsx         # Find people by name
│  ├─ write/                # 7-step compose flow
│  │  ├─ place → photo → rating → story → date → visibility → preview
│  │  └─ new-place.tsx      # Create a place that doesn't exist yet
│  └─ dev/logs.tsx          # In-app network log viewer

├─ src/
│  ├─ api/                  # The entire API layer
│  │  ├─ client.ts          # fetch wrapper: bearer, 401 refresh, logging
│  │  ├─ session.ts         # Token lifecycle + SecureStore
│  │  ├─ errors.ts          # ApiRequestError, code narrowing helpers
│  │  ├─ logger.ts          # Scoped in-memory log + subscribers
│  │  ├─ types.ts           # Wire types (server field names)
│  │  └─ endpoints/         # One module per server area
│  ├─ lib/
│  │  ├─ useApiQuery.ts     # The data-fetching hook every screen uses
│  │  ├─ useSession.ts      # Session as React state
│  │  ├─ experienceDraft.tsx# Compose-flow reducer + context
│  │  └─ validation.ts
│  ├─ components/           # Presentational, grouped by domain
│  └─ theme/                # Palette (tailwind.config.js), map style, relationship
```

**Convention:** `src/api/types.ts` holds **wire** types using the server's own field names (`avatarPath`). UI-only types live in `src/types.ts`. `AvatarUser` deliberately keeps `avatarPath` so any wire user can be passed straight in — renaming it would let a `SlimUser` satisfy the type while carrying no photo, and TypeScript would not catch it because the field is optional.

---

## 4. Every screen and the API calls it makes

This is the map you asked for. 🔒 = requires a bearer token.

### Unauthenticated

| Screen | Calls | Notes |
| --- | --- | --- |
| `(auth)/login.tsx` | `POST /api/auth/login` 🔓 | On success sets the session, then redirects |
| `(auth)/register.tsx` | `POST /api/auth/register` 🔓 | Same |

### Explore

| Screen | Calls | Notes |
| --- | --- | --- |
| `(tabs)/index.tsx` | `GET /api/places/search` 🔒<br>`GET /api/users/me` 🔒 | `search` is re-run per keystroke via a `useCallback` keyed on `query`. Fixed centre `34.015, 71.58`, radius 20 km, limit 50 |

The centre comes from `useUserLocation`; Peshawar is only the fallback until a fix or permission arrives.

### Place & experience

| Screen | Calls | Notes |
| --- | --- | --- |
| `place/[id].tsx` | `GET /api/places/:id` 🔒<br>`GET /api/places/:id/experiences` 🔒<br>`GET /api/places/:id/related` 🔒 | Owner attribution under the heading; related places + nearby experiences after the place's own list. Tapping a reviewer avatar/name pushes `/profile/:reviewerId` |
| `experience/[id].tsx` | `GET /api/experiences/:id` 🔒<br>`GET /api/places/:placeId/experiences` 🔒<br>`GET /api/places/:placeId/related` 🔒 | Own hand-rolled `kind` state machine: `loading`/`ready`/`hidden`/`missing`/`error`. Related sections: more at the same place, related places, nearby experiences |

### People

| Screen | Calls | Notes |
| --- | --- | --- |
| `(tabs)/circles.tsx` | `GET /api/friends` 🔒<br>`GET /api/friends/requests` 🔒<br>`GET /api/users/suggestions?limit=12` 🔒<br>`POST /api/friends/request/:userId` 🔒<br>`POST /api/friends/:requestId/accept` 🔒<br>`POST /api/friends/:requestId/reject` 🔒 | Three queries run on mount and refetch on focus, keeping previous rows visible. This is what removes a just-blocked person from the cached suggestions. The header Friends pill and the friends rail's Manage link open `/friends`; the suggestions section carries its own search filter; a footer row links to Blocked people for unblocking |
| `friends.tsx` | `GET /api/friends` 🔒<br>`GET /api/friends/requests` 🔒<br>`GET /api/users/directory?limit=100` 🔒<br>`POST /api/friends/request/:userId` 🔒<br>`POST /api/friends/:requestId/accept` 🔒<br>`POST /api/friends/:requestId/reject` 🔒<br>`DELETE /api/friends/:userId` 🔒 | Friends hub: incoming requests with Accept/Decline, **all users** in the directory with Add / Requested, and the accepted friends list with Remove (confirmed). The Circle suggestions keep the shared-place ranking. Refetches on focus; previous rows stay visible during the refresh |
| `profile/search.tsx` | `GET /api/users/search?q&limit` 🔒<br>`POST /api/friends/request/:userId` 🔒 | Real server-side name search, single page |
| `profile/[id].tsx` | `GET /api/users/:id` 🔒<br>`GET /api/users/:id/experiences` 🔒 | via `ProfileScreen` |
| `profile/me.tsx` | `GET /api/users/me` 🔒 | Resolves to an id, then replaces with `/profile/:id`. Static route so it wins over `[id]` |
| `(tabs)/profile.tsx` | `GET /api/users/me` 🔒<br>`GET /api/places/:id` 🔒 | Inline by design: pushing `/profile/me` would loop on back |
| `profile/edit.tsx` | `GET /api/users/me` 🔒<br>`POST /api/uploads` 🔒<br>`PATCH /api/users/me` 🔒 | Avatar is two-step: upload → get path → reference it |

### Compose flow

`write/place → photo → rating → story → date → visibility → preview`

| Step | Calls | Notes |
| --- | --- | --- |
| `write/place.tsx` | `GET /api/places/search` 🔒 | Pick an existing place |
| `write/photo.tsx` | `POST /api/uploads` 🔒 | Required; each photo uploads as it is picked, in parallel, with per-tile progress and retry |
| `write/rating.tsx` | — | 1–5: *Not for me · It was fine · Good · Really good · Exceptional* |
| `write/story.tsx` | — | |
| `write/date.tsx` | — | Cannot be in the future |
| `write/visibility.tsx` | — | circle / extended / community |
| `write/preview.tsx` | `POST /api/uploads` 🔒 (retries only unfinished photos)<br>`POST /api/experiences` 🔒 | Uploads any stragglers with a progress bar, then posts with `photoIds` |
| `write/new-place.tsx` | `POST /api/places` 🔒<br>`POST /api/uploads` 🔒 (per photo) | Map/search live in a full-height location sheet behind a *Select location* row; photos upload in parallel |

**Visibility options** (`src/theme/relationship.ts:81`):

| Id | Label | Who sees it |
| --- | --- | --- |
| `circle` | Your Circle | People you have personally connected with |
| `extended` | Extended Circle | Friends of friends, two connections out |
| `community` | Community | Anyone on Trust Circle |

### Dev

| Screen | Calls |
| --- | --- |
| `dev/logs.tsx` | None. In-memory viewer of `logger.ts` output, reachable by deep link `trustcircle://dev/logs` |

---

## 5. Endpoints the client defines but does not call

The server supports these; the app has typed wrappers but no screen uses them:

| Endpoint | Wrapper | Status |
| --- | --- | --- |
| `GET /api/explore/nearby` | `exploreApi.exploreNearby` | **Dead code** — zero call sites. Built for a layered explore view that was not built |
| `GET /api/places/nearby` | `placesApi.nearbyPlaces` | Unused; the Explore screen uses `search` instead |
| `PATCH /api/experiences/:id` | `experiencesApi.updateExperience` | Unused — experiences are write-once in the UI |
| `DELETE /api/experiences/:id` | `experiencesApi.deleteExperience` | Unused |
| `DELETE /api/uploads/:photoId` | `uploadsApi.deletePhoto` | Unused |
| `POST /api/friends/block/:userId` | `usersApi.blockUser` | Unused |
| `DELETE /api/friends/block/:userId` | `usersApi.unblockUser` | Unused |
| `GET /api/friends/:userId/relationship` | `usersApi.getRelationship` | Unused — the profile's `relationship` field is used instead |

---

## 6. API layer architecture

### `session.ts` — token lifecycle

Access and refresh tokens live **in memory** for the request path and in **SecureStore** (not AsyncStorage — these are bearer credentials) for reloads.

`hydrateSession()` is called once from the root layout before anything renders. Without it, a cold start queries with no token, draws the sign-in screen, and has its valid stored session deleted by the 401 that follows.

`refreshToken` is **rotating and single-use** — every refresh revokes the old one. Concurrent callers therefore share ONE in-flight refresh (`inFlightRefresh`), or the second request replays a dead token and logs the user out mid-session.

### `client.ts` — the fetch wrapper

Attaches the bearer token, retries **once** after a refresh, and classifies 401s by the server's error code:

| Code | Meaning | Action |
| --- | --- | --- |
| `INVALID_TOKEN` | Access token expired | Refresh, then retry the original request once |
| `UNAUTHORIZED` | Missing/malformed header | Clear session (retrying would burn the refresh token) |
| `INVALID_REFRESH_TOKEN` | Rotation replayed | Clear session |

A network failure throws before any status exists, so `isApiError()` is false — which is why transport errors and server faults are currently indistinguishable in the UI (see §9).

### `useApiQuery.ts` — every read

A small hook providing `loading` / `ready` / `empty` / `error` as first-class states so screens never fall back to mock content. Deliberately minimal — no cache, no background refetch, no dedup.

Its identity is `${key}#${reloadToken}`; changing `key` re-runs the fetch, and `refetch()` bumps the token. Pass `keepPreviousData` for same-query refetches (e.g. Circle on focus) so the old rows stay on screen while the new ones load.

### Error codes

All server codes are enumerated in `src/api/errors.ts` as a union, plus narrowing helpers: `hasCode`, `fieldErrors`, `requestIdFrom`, `isHiddenFromViewer`, `isMissing`. Callers branch on the **code**, never the message.

---

## 7. Database shape (server, for context)

| Table | Key columns |
| --- | --- |
| `users` | `id` uuid, `email` unique, `password_hash`, `name`, `avatar_path`, `bio` |
| `refresh_tokens` | `token_hash`, `expires_at`, `revoked_at` — rotating, revoked in place |
| `friendships` | `requester_id`, `addressee_id`, `status` (`pending`/`accepted`/`blocked`), unique per pair |
| `places` | PostGIS `geography(Point,4326)` — **always projected explicitly**, never lat/lng scalars |
| `experiences` | `rating` smallint, `review_text`, `visited_at` date, `visibility` enum, `photos[]` |

Auth is JWT access + opaque hashed refresh, split secrets (`JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`).

---

## 8. Work completed in this session

Chronological, all verified against the running server.

### Bugs found and fixed

| Bug | Cause | Fix |
| --- | --- | --- |
| **Infinite refetch loop** — `me` retried every ~300 ms forever | `isEmpty` was in the effect's dep array while every caller passes an inline `() => false`, so each render produced a new closure and re-armed the fetch | Read `isEmpty` through a ref, mirroring the existing `fetcherRef` |
| **Session never restored** — app logged itself out on every reload | `hydrateSession()` had **zero callers** | Call it from the root layout, gated before first render |
| **Suggestions never rendered** — the render gate was unreachable | `friends.status === 'empty' && !friends.data` can never be true: the `'empty'` state stores `[]`, which is truthy | Rewrote as a standalone always-rendered section |
| **Avatars silently broken in 7 places** | `SlimUser` has `avatarPath`, `Avatar` read `user.coverPhoto`; TS could not catch it because the field is optional | Reverted `AvatarUser` to `avatarPath`, deleting 4 mappings and repairing all 7 call sites |
| **Requests section lied on error** | Block gated only on `status !== 'loading'`, so a failed fetch rendered "No pending requests" | Explicit `status === 'error'` branch with retry |
| **No back button on place detail** | Never existed; the only "back" was a text link rendered **only in the error state** | `PlaceBackButton`, a floating control over the hero, present in every state |
| **Broken route paths** | `router.replace('/login')` and `'/register'` don't resolve — those routes live in the `(auth)` group | Group-qualified to `/(auth)/…` |
| **Guest mode was a dead end** | Server puts `requireAuth` on every module, but login offered "Browse as guest" | Removed the affordance; gated `(tabs)` and `(auth)` against each other |

### Features added

- **Map pins show `coverPhoto`** as circular images, monogram fallback, permanent fallback on load error.
- **Sign out** with confirmation, self-profile only. Verified that server logout revokes the refresh token but **leaves the access token valid** — so clearing local storage is what actually ends the session.
- **Searchable suggestions** with distinct empty states: "no suggestions" vs "nothing matches your filter".
- **Add to Circle / Remove from Circle** on profiles, branching exactly once per relationship state.
- **Profile tabs navigate** — experiences open the experience, places open the place, photos open a full-screen viewer.
- **Edit Profile** — name, bio, avatar, sending only changed fields.
- **Reviewer avatar tap** on the place screen.

### Server behaviour established (and worth not re-deriving)

- `avgRating` is `number | null`; `coverPhoto` is the place's own photo and is the same for every viewer.
- `/api/users/suggestions` excludes self, blocked pairs, existing friends, **and any pair with a request pending in either direction**. Tapping "Add" therefore removes someone from the list by design.
- `RelationshipType` has **no `pending` member**. Neither `/api/users/:id` nor `/api/friends/:userId/relationship` reports an open request — an in-flight pair reads as `none`. Any "Add" button must therefore render optimistically and let the response decide.
- `GET /api/users/:id/experiences` returns experiences *authored by* that user, so on a profile the reviewer is always the profile owner. The reviewer link is deliberately inert there.
- Removing a friend deletes the row outright, which hides their `circle`/`extended` posts from you. Reversible, hence the confirmation copy.

---

## 9. Known gaps

Honest list; none are hidden behind a stub that looks finished.

| Gap | Impact |
| --- | --- |
| **No location permission** | The map centre is hardcoded to Peshawar |
| **Network errors are indistinguishable from server faults** | A WiFi failure on login shows "We could not sign you in", sending the user to retype a correct password |
| **`EXPO_PUBLIC_API_URL` is a DHCP lease** (`http://192.168.18.21:3000`) | Silent breakage on any lease change. An Android emulator would use `10.0.2.2` |
| **`getRelationship` unused** | Pending-state detection is impossible from data alone, so friend buttons always show optimistically |
| **No cache / pagination** | Every screen refetches on mount; lists are capped server-side (search 50, suggestions 25, profile 30) |
| **Explore "layers" not built** | `exploreApi.exploreNearby` is dead code awaiting a layered explore view |
| **Photo viewer has no swipe** | Explicit prev/next only; a swipe would need deliberate gesture-handler wiring |
| **Blocking / unblocking unexposed** | Server supports it, no UI |
| **Experiences are write-once** | No edit/delete UI despite both endpoints existing |

---

## 10. Running it

```bash
# 1. server
cd ../server && npm run db:seed && npm run dev      # port 3000

# 2. app
npm install
npx expo start                                        # then press a / i
```

**Device networking** — `.env` must hold your machine's LAN IP, not `localhost`:

| Target | `EXPO_PUBLIC_API_URL` |
| --- | --- |
| Android emulator | `http://10.0.2.2:3000` |
| iOS simulator | `http://localhost:3000` |
| Physical device | `http://<your-machine-LAN-IP>:3000` |

On a physical Android device the app also needs cleartext HTTP permitted to that host, and the **host firewall must allow the port** — ufw defaults to dropping inbound, which produces a silent `ConnectException` rather than a refused connection.

```bash
# If a device cannot reach the server (silently hangs, ~30 s timeouts):
sudo ufw allow from 192.168.18.0/24 to any port 3000 proto tcp
```

The phone must be on the **same Wi-Fi SSID as the machine**. Two different SSIDs on one subnet will show identical-looking IPs while having no layer-2 path between them — `ping` gives `Destination Host Unreachable` and `ip neigh` shows `FAILED`.

**Useful checks**

```bash
curl -X POST localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"ahmed@trust.dev","password":"password123"}'

npm run typecheck && npm run lint
```

Seeded accounts are `ahmed@trust.dev`, `sara@trust.dev`, … plus `hey@gmail.com` — password `password123`.

---

## 11. Conventions worth knowing before editing

- **Copy lives inline** at the point of use. There is no central string table: text reads as part of the screen, which keeps a label and the layout around it in one place.
- **`src/components/` is presentational.** Domain components take callbacks; screens own navigation and data.
- **Callbacks passed to `useApiQuery` are read through refs**, never used as effect deps — inline closures would otherwise re-arm the fetch every render.
- **Never fabricate content.** An empty state says so and offers the next step.
- **`loading`, `empty` and `error` are separate states.** Note `'empty'` carries the fetched value (e.g. `[]`, which is truthy) — `status === 'empty' && !data` is never true.
- **Branch on error codes**, never messages.
- **`absoluteUrl()` resolves relative `/uploads/...` paths** against the API host. `/uploads` is mounted outside `requireAuth`, so images need no token.
