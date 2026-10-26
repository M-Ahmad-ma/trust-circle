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

/**
 * The frame a place sits in — roughly 1.5 km across on a phone.
 *
 * It was 17, which framed about 380 m: a couple of doorways, with the pin
 * filling the screen and its neighbours off the edge entirely. That is the
 * wrong scale for reading a map. Dropping to 15 puts the place in its
 * surroundings — the street it is on, the block around it — while still
 * naming it, and the map stays pinch-zoomable for anyone who needs closer.
 */
export const PLACE_FOCUS_ZOOM = 15;

/**
 * Explore flies to a tapped pin at the same frame. It has its own constant so
 * the two surfaces can drift apart deliberately rather than by accident.
 */
export const EXPLORE_FOCUS_ZOOM = 15;

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
