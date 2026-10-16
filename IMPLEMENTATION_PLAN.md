# Implementation Plan

Two tracks: **A — device location** (what you asked for now) and **B — README gap audit**.

Status: proposed. Nothing implemented yet.

---

# Track A — Location permission

## Current state

- `expo-location` is **not installed**.
- No location code exists anywhere in `app/` or `src/`.
- `app/(tabs)/index.tsx:19` hardcodes `const CENTER = { lat: 34.015, lng: 71.58 }`.
- `src/theme/mapStyle.ts:12` hardcodes `peshawarOverview` as the fallback centre.
- `app.json` declares **no** location permission for either platform.
- `android/` is a committed prebuild directory — changing native config means a rebuild, not just a reload.

The Explore screen already sends `lat`/`lng` to `GET /api/places/search`, and the server already handles them via PostGIS `ST_DWithin`. **So the entire backend for this exists.** This is a client-only change.

## Server capability (verified, no work needed)

- `GET /api/places/search` — `radius` clamped 10–50,000 m, defaults 5,000 (`places.ts:22`).
- `GET /api/places/nearby` — same, `lat`+`lng` **required**.
- `GET /api/explore/nearby` — returns experiences with `place`, `reviewer`, `relationship`. Typed in the client as `exploreApi.exploreNearby` but **has zero call sites** (dead code until now).

## Proposed steps

### A1. Install and configure
- `npx expo install expo-location`
- Add the `expo-location` config plugin to `app.json` with permission strings:
  - iOS: `NSLocationWhenInUseUsageDescription`
  - Android: `ACCESS_COARSE_LOCATION` / `ACCESS_FINE_LOCATION`
- Because `android/` is committed, this needs a **rebuild** (`npx expo run:android`), not a Metro reload.

### A2. A permission hook — `src/lib/useUserLocation.ts`
States: `idle → requesting → granted → denied → unavailable`.

Decision: **request on first mount of the Explore screen, not at app launch.** Launch-time prompts are the pattern users reject; asking when they open a map is the contextual ask.

Graceful degradation is mandatory — the app must work with permission denied, which means the existing Peshawar fallback stays as the default centre.

### A3. Wire into Explore
- Replace the module-level `CENTER` constant with the resolved location.
- Pass it to `fetchPlaces`, and to the map's `Camera` fallback centre.
- Keep the hardcoded centre as the fallback so a denied permission is invisible to the user.
- Radius: start at 20 km (current behaviour) — this matches "reviews around my area" without a re-tune.

### A4. Map controls
`app/(tabs)/index.tsx:101` renders a **"Recenter on me" button that is already dead** — `OverlayButton` takes an `onPress` but the call sites omit it. Wiring it to recentre on the resolved location is nearly free once A3 exists.

### A5. Verify
- Granted → places near the device appear, distances recalculate.
- Denied → Peshawar fallback, no crash, no repeated prompt.
- Blocked in OS settings → same as denied.

## Decisions I need from you

1. **Precision.** Coarse (city/block level, less battery) or fine (precise, standard)? Coarse is the better default for a discovery map.
2. **Prompt timing.** On opening Explore (my recommendation) vs. at app launch.
3. **Fallback when denied.** Silent Peshawar fallback (current plan), or an explicit "showing Peshawar — enable location" banner?
4. **How often to refresh.** Once on mount, or re-read when the screen regains focus?

## Risks

- A rebuild is required (committed `android/`). Anyone else on the repo needs the same step.
- A permission prompt appearing for the first time on a dev device can stall testing if the emulator has no location set.

---

# Track B — README gap audit

Every row verified against the code. 🔴 missing entirely · 🟡 partial/stub · ✅ done.

## B1. Location (README §9, §12, §21, §29)

| Requirement | Status | Note |
| --- | --- | --- |
| Use user's location for nearby discovery | 🔴 | Track A |
| Recentre control | 🟡 | Button rendered, `onPress` never wired |
| `GET /api/explore/nearby` | 🟡 | Server + client wrapper exist, **zero call sites** |

## B2. Map shows experiences, not places (README §9, §30)

| Requirement | Status | Note |
| --- | --- | --- |
| Markers show relationship colour (🔴/🟠/🟡) | 🔴 | `ExploreMap` renders `places.map(...)`. Markers are place pins with no relationship or rating information |
| Markers show star rating | 🔴 | Not rendered |
| Markers show reviewer identity | 🔴 | Not rendered |
| Bottom sheet on marker tap (§10) | 🟡 | A fixed `PlaceSummary` card exists — not a sheet, and it only shows the selected place, never a review |

This is the **largest gap**: §9 and §30 are the product's signature interaction and the map currently cannot express it. `GET /api/explore/nearby` returns exactly the shape needed; the client wrapper exists and is unused.

## B3. Experience CRUD (README §14, §32)

| Requirement | Status | Note |
| --- | --- | --- |
| Create experience | ✅ | `write/preview.tsx` |
| Edit experience | 🟡 | `PATCH /api/experiences/:id` works, wrapper `updateExperience` has **zero call sites**. No edit UI |
| Delete experience | 🟡 | `DELETE` works, wrapper `deleteExperience` unused. No delete UI |
| `updatedAt` on experience | ✅ | Schema + server |
| Photo reorder (§15) | 🟡 | `position` column and server ordering exist; no drag UI |
| Photo delete (§15) | 🟡 | `deletePhoto` wrapper unused |

§32 lists both edit and delete as **required for MVP**.

## B4. Social (§8)

| Requirement | Status | Note |
| --- | --- | --- |
| Send / accept / reject request | ✅ | Circles screen |
| Search people | ✅ | `profile/search.tsx` |
| Remove connection | ✅ | Added this session |
| **Block user** | 🟡 | `blockUser` / `unblockUser` wrappers exist, **no UI** |
| Blocked users excluded from reads | ✅ | Server-side |

§8 explicitly lists "Block users" as a capability.

## B5. Places (§13)

| Requirement | Status | Note |
| --- | --- | --- |
| Create place | ✅ | `write/new-place.tsx` |
| Fuzzy duplicate detection (§13) | ✅ | Server returns `meta.created: false` + the existing place |
| **Update place** | 🔴 | No `PATCH /api/places/:id` endpoint exists at all |

## B6. Profile (§24)

| Requirement | Status | Note |
| --- | --- | --- |
| Experiences / Places / Photos tabs | ✅ | Added this session |
| Edit name, bio, avatar | ✅ | Added this session |
| Friends count | ✅ | Server viewer-aware |
| **Saved experiences** | 🟡 | `PlaceActionBar` toggles a **local `useState`** named `saved`. Not persisted, not per-place, no backend. Reads as a real feature and is not one |

§24 lists "Saved experiences" as a profile section.

## B7. Deferred by design (§25–§28)

These are explicitly "can later" in the README and were deliberately removed rather than stubbed:

| Feature | Status | Note |
| --- | --- | --- |
| Saved (§25) | 🔴 | Deferred — but see B6, a fake button remains |
| Activity feed (§26) | 🔴 | Deferred. `activity.tsx` was deleted |
| Notifications (§27) | 🔴 | Deferred. No backend either |
| Experience search (§28) | 🔴 | Deferred. Place + people search only |

## B8. Backend gaps (README §20)

| Requirement | Status | Note |
| --- | --- | --- |
| `POST /api/uploads/presign` | 🔴 | Not implemented, and not needed — multipart upload works and is simpler for this stack |
| Object storage (§15) | 🟡 | Files on local disk (`UPLOAD_DIR`), not object storage. Fine for dev, breaks on multi-instance deploy |

## B9. Correctly built — no action

Worth stating so it isn't re-audited: visibility enforcement (§16, §17) is server-side and per-viewer; relationship labels are computed, never stored on the experience; ratings are constrained 1–5 server-side; `reviewText` is 1–2000 chars; visit dates cannot be future-dated.

---

## Proposed order

1. **Track A** — location permission (your current ask).
2. **B2** — relationship-coloured, rated map markers. Biggest gap against the product's core claim.
3. **B6** — remove the fake "Save Place" button, or implement saving properly.
4. **B3/B4** — edit/delete experience UI, block UI.
5. **B5/B7/B8** — as capacity allows.

## What I did not plan to build

Saved experiences, activity feed, notifications, and experience search are all "can later" in the README. I'll leave them out unless you say otherwise — building stubs for them is what caused the fake Save button in the first place.

---

Nothing above is implemented. Tell me which track to start with and answer the four location questions, and I'll build it.
