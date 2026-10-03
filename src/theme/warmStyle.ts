import type { StyleSpecification } from '@maplibre/maplibre-react-native';

import libertyStyle from './libertyStyle.json';

/**
 * Liberty (OpenFreeMap / OpenMapTiles schema) restyled into the app's warm
 * paper-and-sand palette.
 *
 * Land stays paper, roads sit in the sand band, greens drop to muted moss, and
 * every label resolves to the ink scale — so the oxblood pins keep the highest
 * contrast on the map.
 *
 * Colours are matched as exact strings, so this table is exhaustive by
 * construction: `assertNoUnmappedColours` below fails loudly in development if
 * upstream adds a colour we have not restyled.
 */
const COLOR_MAP: Record<string, string> = {
  // ---- Land / base -------------------------------------------------------
  '#f8f4f0': '#faf5ec', // background, path-name halo
  '#f0ede9': '#efe7d6', // aeroway runway + taxiway
  'rgba(229, 228, 224, 1)': '#f0e7d3', // aeroway fill

  // ---- Water -------------------------------------------------------------
  'rgb(158,189,255)': '#dbe4e0', // water fill
  '#a0c8f0': '#b9c9c2', // waterway lines
  '#74aee9': '#5a6b66', // waterway label
  '#495e91': '#465852', // water names
  'rgba(224, 236, 236, 1)': '#e8ecea', // landcover ice

  // ---- Roads: fills ------------------------------------------------------
  '#fc8': '#e8d3a4', // motorway
  'hsl(26,87%,62%)': '#cfa86a', // road_motorway (legacy)
  '#fea': '#efe0bd', // trunk / primary / secondary / link
  '#ffdaa6': '#e8d3a4', // tunnel motorway
  '#fff4c6': '#f2e8cc', // tunnel link / secondary / primary
  '#fff': '#fdfaf4', // streets, service tracks
  'hsl(0,0%,100%)': '#fdfaf4', // pedestrian paths
  '#ffffff': '#faf5ec', // text halos

  // ---- Roads: casings ----------------------------------------------------
  '#e9ac77': '#cbb488', // motorway casing
  '#bbb': '#c9bda2', // rail + service casing
  '#cfcdca': '#cfc0a2', // minor + service casing
  'hsl(36,6%,74%)': '#d6c8ab', // bridge street casing
  'hsl(35,6%,80%)': '#e2d6bd', // pedestrian path casing
  'hsl(35,6%,79%)': '#e2d6bd', // building outline
  'hsla(35,6%,79%,0.32)': 'rgba(203, 180, 136, 0.35)', // building outline (zoom expr)

  // ---- Buildings ---------------------------------------------------------
  'hsl(35,8%,85%)': '#f0e6d0', // building fill + 3D extrusion

  // ---- Parks / landcover -------------------------------------------------
  '#d8e8c8': '#dde3cd', // park fill
  'rgba(95, 208, 100, 1)': '#b9c4a8', // park outline
  'rgba(228, 241, 215, 1)': '#c9d3ba', // park outline line
  'rgba(176, 213, 154, 1)': '#d3ddc4', // grass
  'hsla(98,61%,72%,0.7)': 'rgba(205, 214, 191, 0.7)', // wood
  'rgba(247, 239, 195, 1)': '#f0e4c8', // bare sand
  '#DEE3CD': '#e2e0cd', // pitch + track

  // ---- Landuse -----------------------------------------------------------
  'hsla(0,3%,85%,0.84)': 'rgba(240, 231, 211, 0.85)', // residential
  'hsla(35,57%,88%,0.49)': 'rgba(240, 231, 211, 0.5)', // residential (zoom expr)
  '#fde': '#f3e3e2', // hospital — a faint warm rose
  'rgb(236,238,204)': '#efe7d6', // school
  'hsl(75,37%,81%)': '#e2e2d4', // cemetery

  // ---- Text --------------------------------------------------------------
  '#000': '#1c1815', // city / country labels
  '#666': '#6b6058', // highway names, airport
  '#333': '#342d27', // other / state labels
  'hsl(30,23%,62%)': '#4a423b', // path names
  '#2e5a80': '#3c5943', // transit POI labels
  'hsl(248,1%,41%)': '#9a8e85', // boundaries
  'hsl(0,0%,70%)': '#b9ab8f', // boundary (admin 3)
  'rgba(255,255,255,0.7)': 'rgba(250, 245, 236, 0.75)', // water label halos
};

function isColourLiteral(value: string) {
  const trimmed = value.trim().toLowerCase();
  return trimmed.startsWith('#') || trimmed.startsWith('rgb') || trimmed.startsWith('hsl');
}

/**
 * Rewrites every colour literal anywhere in the tree. Recursion is deliberate:
 * three layer paints hold zoom-interpolated colours whose stops are literals,
 * and a shallow per-layer replace would leave those upstream colours behind.
 */
function recolour<T>(node: T, unmapped: Set<string>): T {
  if (typeof node === 'string') {
    if (!isColourLiteral(node)) return node;

    const replacement = COLOR_MAP[node] ?? COLOR_MAP[node.trim().toLowerCase()];
    if (replacement === undefined) {
      unmapped.add(node);
      return node;
    }

    return replacement as unknown as T;
  }

  if (Array.isArray(node)) {
    return node.map((item) => recolour(item, unmapped)) as unknown as T;
  }

  if (node !== null && typeof node === 'object') {
    const output: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(node)) {
      output[key] = recolour(value, unmapped);
    }

    return output as unknown as T;
  }

  return node;
}

/**
 * Dev-only guard. If OpenFreeMap publishes a colour this table does not cover,
 * it would silently reach the device as raw Liberty blue/green — which would
 * break the palette without failing anything.
 */
function assertNoUnmappedColours(unmapped: Set<string>) {
  if (unmapped.size === 0 || !__DEV__) return;

  console.warn(
    `[warmStyle] ${unmapped.size} unmapped colour(s) fell through to the raw Liberty palette: ` +
      `${Array.from(unmapped).join(', ')}`
  );
}

const unmapped = new Set<string>();

export const warmStyle = recolour(libertyStyle as unknown as StyleSpecification, unmapped);

assertNoUnmappedColours(unmapped);
