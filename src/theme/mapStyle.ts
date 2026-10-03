import type { StyleSpecification } from '@maplibre/maplibre-react-native';

/**
 * OpenStreetMap raster tiles, pushed through MapLibre raster paint properties
 * so the basemap reads as a warm sand wash rather than a cold clinical map.
 * No API key, no Google, fully open source.
 */
export const mapStyle: StyleSpecification = {
  version: 8,
  name: 'Sand Wash',
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 10,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'paper',
      type: 'background',
      paint: { 'background-color': '#eadfc8' },
    },
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
      paint: {
        'raster-saturation': -0.92,
        'raster-contrast': -0.18,
        'raster-brightness-min': 0.16,
        'raster-brightness-max': 0.95,
        'raster-hue-rotate': -12,
        'raster-opacity': 0.92,
      },
    },
  ],
};

/** Peshawar, framed on the Hayatabad / University Road cluster. */
export const peshawarOverview = {
  longitude: 71.4789,
  latitude: 34.0052,
  zoomLevel: 13.6,
  bearing: 0,
  pitch: 0,
};

/** Roughly 750 m across — close enough to read a venue and its neighbours. */
export const PLACE_FOCUS_ZOOM = 16;

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

export const attributionNotice = {
  text: '© OpenStreetMap',
  longText: '© OpenStreetMap contributors',
};
