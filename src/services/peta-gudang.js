/**
 * Peta Gudang Service — fetching marker data and point-in-polygon comparison.
 */

const IS_DEV = import.meta.env.DEV;
const BACKEND_URL = IS_DEV ? '' : (import.meta.env.VITE_API_URL || '');

/**
 * Fetch all markers from Peta Gudang via the proxy.
 * @returns {Promise<Object[]>} Array of marker data
 */
export async function fetchMarkers() {
  const url = `${BACKEND_URL}/api/peta-gudang/markers`;
  
  // 30s timeout for large payload
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Peta Gudang HTTP ${response.status}`);
    }
    
    const result = await response.json();
    if (result.success && Array.isArray(result.data)) {
      const data = result.data;
      const len = data.length;
      
      // Fast path parsing — avoids creating 30k intermediate objects
      for (let i = 0; i < len; i++) {
        const m = data[i];
        m.latNum = Number(m.lat);   // Number() is faster than parseFloat for simple strings
        m.lngNum = Number(m.lng);
        m.progressNum = Number(m.percentage_development_progress) || 0;
      }
      return data;
    }
    return [];
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Permintaan data statistik melebihi batas waktu (timeout).');
    }
    throw err;
  }
}

/**
 * Point-in-Polygon comparison using Ray-Casting algorithm.
 * @param {number[]} point - [lat, lng]
 * @param {number[][][]} polygon - Array of rings, each ring is an array of [lng, lat]
 * @returns {boolean} True if point is inside polygon
 */
export function isPointInPolygon(point, polygon) {
  const [lat, lng] = point;
  let inside = false;

  // GeoJSON polygons can have holes, the first ring is the exterior
  const exterior = polygon[0];

  for (let i = 0, j = exterior.length - 1; i < exterior.length; j = i++) {
    const xi = exterior[i][0], yi = exterior[i][1]; // xi=lng, yi=lat
    const xj = exterior[j][0], yj = exterior[j][1]; // xj=lng, yj=lat

    const intersect = ((yi > lat) !== (yj > lat)) &&
        (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  // If it's inside the exterior, check if it's inside any holes (interior rings)
  if (inside && polygon.length > 1) {
    for (let k = 1; k < polygon.length; k++) {
      if (isPointInPolygon(point, [polygon[k]])) {
        return false; // Point is in a hole
      }
    }
  }
  
  return inside;
}

/**
 * Categorize markers by building progress.
 * @param {Object[]} markers - Array of markers
 * @returns {Object} Grouped markers
 */
export function categorizeMarkers(markers) {
  const categories = {
    total: markers.length,
    inProgress: 0,
    completed: 0, // 100% progress
    byProgress: {}, // 0-10, 11-20, etc.
  };

  markers.forEach(m => {
    const progress = m.progressNum || 0;
    if (progress === 100) {
      categories.completed++;
    } else if (progress > 0) {
      categories.inProgress++;
    }
    
    const bin = Math.floor(progress / 10) * 10;
    const binKey = `${bin}-${bin + 10}%`;
    categories.byProgress[binKey] = (categories.byProgress[binKey] || 0) + 1;
  });

  return categories;
}
