import { warmStyle } from './warmStyle';

/**
 * Basemap: Liberty from OpenFreeMap, restyled to the app's warm sand palette in
 * `./warmStyle`. Vector tiles, so it stays sharp at every zoom — the previous
 * OpenStreetMap raster source blurred badly past ~z15 because a 256px tile
 * spans ~600m at that scale.
 */
export const mapStyle = warmStyle;

/** Peshawar, framed on the Hayatabad / University Road cluster. */
export const peshawarOverview = {
  longitude: 71.4789,
  latitude: 34.0052,
  zoomLevel: 13.6,
  bearing: 0,
  pitch: 0,
};

/** Roughly 380 m across — close enough to read a venue and its neighbours. */
export const PLACE_FOCUS_ZOOM = 17;

/**
 * Nudges the focal point below the viewport centre so the focused pin clears the
 * floating Map/List toggle and stays clear of the bottom chip.
 */
export const PLACE_FOCUS_PADDING = {
  top: 72,
  bottom: 44,
  left: 20,
  right: 20,
};

export const PLACE_FOCUS_DURATION = 850;

/** Split across two lines — the single-line form overruns the map viewport. */
export const attributionNotice = {
  lines: ['© OpenFreeMap · © OpenMapTiles', '© OpenStreetMap contributors'],
};
