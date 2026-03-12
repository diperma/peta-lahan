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
  // Use a small 2x2 image request to check for colored pixels (overlaps)
  const WIDTH = 2;
  const HEIGHT = 2;

  // Project point to EPSG:3857
  const point = map.options.crs.project(latlng);
  
  // Create a BBOX around the point (10 meter buffer for "near" detection)
  const buffer = 10.0; 
  const bbox = `${point.x - buffer},${point.y - buffer},${point.x + buffer},${point.y + buffer}`;

  const params = new URLSearchParams({
    VERSION: '1.3.0',
    REQUEST: 'GetMap', // Changed from GetFeatureInfo to GetMap
    LAYERS: layerName,
    FORMAT: 'image/png',
    TRANSPARENT: 'true',
    SRS: 'EPSG:3857',
    CRS: 'EPSG:3857',
    WIDTH: WIDTH.toString(),
    HEIGHT: HEIGHT.toString(),
    BBOX: bbox,
  });

  const url = `${BACKEND_URL}/api/wms/tiles?${params}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    // Parse the image blob
    const blob = await response.blob();
    const imageBitmap = await createImageBitmap(blob);
    
    // Draw to an offscreen canvas to check pixels
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(imageBitmap, 0, 0);
    
    // Check if any pixel is NOT fully transparent
    const imageData = ctx.getImageData(0, 0, WIDTH, HEIGHT).data;
    let hasColor = false;
    for (let i = 3; i < imageData.length; i += 4) {
      if (imageData[i] > 0) {
        hasColor = true;
        break;
      }
    }
    
    // If color was found, it's an overlap! Return a mock feature since we don't get JSON properties.
    if (hasColor) {
      return [{
        properties: {
          _visualOverlap: true,
          status: 'Terdeteksi (Visual 10m)'
        }
      }];
    }
    
    return [];
  } catch (err) {
    console.warn(`Visual check failed for ${layerName}:`, err);
    return [];
  }
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
