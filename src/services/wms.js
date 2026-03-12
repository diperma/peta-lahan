/**
 * WMS Service — layer configuration and feature info fetching.
 */

const IS_DEV = import.meta.env.DEV;
const BACKEND_URL = IS_DEV ? '' : (import.meta.env.VITE_API_URL || '');

/**
 * Layer definitions for the two target layers.
 */
export const LAYERS = {
  lsd: {
    id: 'lsd',
    name: 'Lahan Sawah Dilindungi',
    layerName: 'umum:lsd_merge',
    color: '#e74c3c',
    fields: [
      { name: 'lsd', alias: 'LSD' },
      { name: 'hutan', alias: 'Hutan' },
      { name: 'provinsi', alias: 'Provinsi' },
      { name: 'kabupaten', alias: 'Kabupaten' },
      { name: 'luas', alias: 'Luas' },
    ],
    bounds: {
      sw: [91.3294, -12.1659],
      ne: [143.2395, 10.9038],
    },
    minZoom: 9,
    description: 'Hasil proses verifikasi lahan sawah yang dilindungi.',
    legend: [
      { color: '#e74c3c', label: 'Lahan Sawah Dilindungi' },
    ],
  },
  lbs: {
    id: 'lbs',
    name: 'Lahan Baku Sawah 2024',
    layerName: 'umum:lahanbakusawah_new',
    color: '#f39c12',
    fields: [
      { name: 'wadmpr', alias: 'Provinsi' },
      { name: 'wadmkk', alias: 'Kabupaten' },
      { name: 'luasha', alias: 'Luas (ha)' },
    ],
    bounds: {
      sw: [92.7612, -13.8400],
      ne: [143.2899, 11.9644],
    },
    minZoom: 13,
    description: 'Areal pertanian digenangi air secara periodik, ditanami padi.',
    legend: [
      { color: '#f39c12', label: 'Lahan Baku Sawah' },
    ],
  },
};

/**
 * Build the WMS tile URL template for Leaflet TileLayer.WMS.
 */
export function getWmsTileUrl() {
  return `${BACKEND_URL}/api/wms/tiles`;
}

/**
 * Build WMS parameters for a given layer.
 */
export function getWmsParams(layerName) {
  return {
    VERSION: '1.3.0',
    REQUEST: 'GetMap',
    FORMAT: 'image/png',
    TRANSPARENT: 'true',
    LAYERS: layerName,
    STYLES: '',
    SRS: 'EPSG:3857',
    CRS: 'EPSG:3857',
    TILED: 'true',
  };
}

/**
 * Fetch feature info for a click on the map.
 * @param {L.LatLng} latlng - Click position
 * @param {string} layerName - WMS layer name
 * @param {L.Map} map - Leaflet map
 * @returns {Promise<Object[]>} Array of feature objects
 */
export async function getFeatureInfo(latlng, layerName, map) {
  const size = map.getSize();
  const bounds = map.getBounds();
  const sw = map.options.crs.project(bounds.getSouthWest());
  const ne = map.options.crs.project(bounds.getNorthEast());

  const bbox = `${sw.x},${sw.y},${ne.x},${ne.y}`;
  const point = map.latLngToContainerPoint(latlng);

  const params = new URLSearchParams({
    VERSION: '1.3.0',
    REQUEST: 'GetFeatureInfo',
    SERVICE: 'WMS',
    LAYERS: layerName,
    QUERY_LAYERS: layerName,
    INFO_FORMAT: 'application/json',
    FEATURE_COUNT: '5',
    SRS: 'EPSG:3857',
    CRS: 'EPSG:3857',
    WIDTH: size.x.toString(),
    HEIGHT: size.y.toString(),
    BBOX: bbox,
    I: Math.round(point.x).toString(),
    J: Math.round(point.y).toString(),
  });

  const url = `${BACKEND_URL}/api/wms/featureinfo?${params}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`FeatureInfo HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.features || [];
}

/**
 * Get legend graphic URL for a layer.
 */
export function getLegendUrl(layerName) {
  const params = new URLSearchParams({
    VERSION: '1.3.0',
    REQUEST: 'GetLegendGraphic',
    SERVICE: 'WMS',
    FORMAT: 'image/png',
    LAYER: layerName,
    STYLE: '',
    LEGEND_OPTIONS: 'fontAntiAliasing:true;fontSize:11;forceLabels:on',
  });
  return `${BACKEND_URL}/api/wms/legend?${params}`;
}

/**
 * Format feature properties into HTML for popup display.
 */
export function formatFeatureInfoHtml(features, layerConfig) {
  if (!features || features.length === 0) {
    return '<div class="popup-content"><p style="text-align:center;color:var(--text-muted);padding:8px;">Tidak ada data di lokasi ini.</p></div>';
  }

  const feature = features[0];
  const props = feature.properties || {};

  let rows = '';
  for (const field of layerConfig.fields) {
    const value = props[field.name] ?? props[field.name.toUpperCase()] ?? props[field.name.toLowerCase()] ?? '-';
    rows += `<tr>
      <td class="popup-label">${field.alias}</td>
      <td class="popup-value">${value}</td>
    </tr>`;
  }

  return `
    <div class="popup-content">
      <h3 style="color: ${layerConfig.color};">${layerConfig.name}</h3>
      <table class="popup-table">${rows}</table>
    </div>
  `;
}
