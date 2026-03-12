/**
 * MapView Component — Leaflet map with WMS layers, GPS, and feature info.
 */
import L from 'leaflet';
import { LAYERS, getWmsTileUrl, getWmsParams, getFeatureInfo, formatFeatureInfoHtml } from '../services/wms.js';
import * as PetaGudang from '../services/peta-gudang.js';
import * as StatisticsPanel from './StatisticsPanel.js';

let map = null;
let wmsLayers = {};
let markersLayer = null;
let overlappingParcelsLayer = null;
let petaGudangData = [];
let petaGudangActive = false;
let isFetchingPetaGudang = false;
let activeLayerIds = new Set();
let gpsMarker = null;
let gpsCircle = null;
let gpsActive = false;

const BASEMAPS = {
  osm: {
    name: 'OSM',
    url: 'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    name: 'Satelit',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics',
  },
};

let currentBasemapLayer = null;
let currentBasemapId = 'osm';

export function render() {
  return `
    <div class="map-wrapper">
      <div id="map"></div>
      <div class="map-loading-overlay hidden" id="map-loading">
        <div class="map-loading-content">
          <div class="spinner"></div>
          <p id="map-loading-text">Memuat peta...</p>
        </div>
      </div>
      <div class="coord-display" id="coord-display">0.0000, 0.0000</div>
    </div>
  `;
}

export function init() {
  map = L.map('map', {
    center: [-2.5, 118.0],
    zoom: 5,
    zoomControl: true,
    attributionControl: true,
    preferCanvas: true,
  });

  // Set default basemap
  setBasemap('osm');

  // Markers and Overlapping layers
  markersLayer = L.layerGroup().addTo(map);
  overlappingParcelsLayer = L.geoJSON(null, {
    style: {
      color: '#fbbf24',
      weight: 3,
      fillColor: '#fbbf24',
      fillOpacity: 0.3,
    }
  }).addTo(map);

  // Labels overlay for satellite mode
  const labelsLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
    attribution: '',
    subdomains: 'abcd',
    maxZoom: 19,
    pane: 'overlayPane',
    opacity: 0,
  });
  labelsLayer.addTo(map);
  // Store for toggle on basemap switch
  map._labelsLayer = labelsLayer;

  // Create WMS tile layers (hidden by default)
  for (const [id, config] of Object.entries(LAYERS)) {
    const wmsUrl = getWmsTileUrl();

    // Use L.TileLayer.WMS with params matching exactly what Bhumi expects
    const layer = L.tileLayer.wms(wmsUrl, {
      layers: config.layerName,
      format: 'image/png',
      transparent: true,
      version: '1.3.0',
      crs: L.CRS.EPSG3857,
      styles: '',
      opacity: 0.8,
      maxZoom: 20,
      tileSize: 512,
      // Critical: these extra params match the real Bhumi website requests
      uppercase: true,
      TILED: true,
      SRS: 'EPSG:3857',
    });

    wmsLayers[id] = layer;
  }

  // Coordinate display on mouse move
  map.on('mousemove', (e) => {
    const el = document.getElementById('coord-display');
    if (el) {
      el.textContent = `${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`;
    }
  });

  // Feature info on click
  map.on('click', handleMapClick);

  // GPS control
  initGpsControl();

  // Delayed resize fix
  setTimeout(() => map.invalidateSize(), 200);
}

/**
 * Handle map click — query active WMS layers for feature info.
 */
async function handleMapClick(e) {
  if (activeLayerIds.size === 0) return;

  const popup = L.popup()
    .setLatLng(e.latlng)
    .setContent('<div class="popup-loading"><div class="spinner"></div><p>Memuat data...</p></div>')
    .openOn(map);

  let allHtml = '';

  for (const layerId of activeLayerIds) {
    const config = LAYERS[layerId];
    try {
      const features = await getFeatureInfo(e.latlng, config.layerName, map);
      const html = formatFeatureInfoHtml(features, config);
      allHtml += html;
    } catch (err) {
      console.error(`FeatureInfo error for ${layerId}:`, err);
    }
  }

  if (allHtml) {
    popup.setContent(allHtml);
  } else {
    popup.setContent('<div class="popup-content"><p style="text-align:center;color:var(--text-muted);padding:8px;">Tidak ada data di lokasi ini.</p></div>');
  }
}

/**
 * Toggle a WMS layer on/off.
 */
export function toggleLayer(layerId, visible) {
  const layer = wmsLayers[layerId];
  if (!layer || !map) return;

  if (visible) {
    layer.addTo(map);
    activeLayerIds.add(layerId);

    // Auto-zoom to appropriate level if current zoom is too low
    const config = LAYERS[layerId];
    const minZoom = config.minZoom || 5;
    if (map.getZoom() < minZoom) {
      zoomToLayer(layerId);
      // Set zoom to the minimum needed to see data
      setTimeout(() => {
        if (map.getZoom() < minZoom) {
          map.setZoom(minZoom);
        }
      }, 500);
    }
  } else {
    map.removeLayer(layer);
    activeLayerIds.delete(layerId);
  }
}

/**
 * Set opacity for a WMS layer.
 */
export function setLayerOpacity(layerId, opacity) {
  const layer = wmsLayers[layerId];
  if (layer) layer.setOpacity(opacity);
}

/**
 * Zoom to the extent of a layer.
 */
export function zoomToLayer(layerId) {
  const config = LAYERS[layerId];
  if (!config || !map) return;

  const bounds = L.latLngBounds(
    L.latLng(config.bounds.sw[1], config.bounds.sw[0]),
    L.latLng(config.bounds.ne[1], config.bounds.ne[0])
  );
  map.fitBounds(bounds, { padding: [30, 30] });
}

/**
 * Toggle Peta Gudang Markers layer on/off.
 */
export async function togglePetaGudang(visible) {
  petaGudangActive = visible;
  if (!map) return;

  StatisticsPanel.showToggle(visible);

  if (visible) {
    if (petaGudangData.length === 0 && !isFetchingPetaGudang) {
      isFetchingPetaGudang = true;
      StatisticsPanel.setLoading(true);
      try {
        const data = await PetaGudang.fetchMarkers();
        petaGudangData = data;
        if (petaGudangActive) {
          StatisticsPanel.updateStats(petaGudangData);
          renderPetaGudangMarkers();
        }
      } catch (err) {
        console.error('Failed to fetch peta-gudang data:', err);
        StatisticsPanel.showError('Gagal memuat data statistik.');
      } finally {
        isFetchingPetaGudang = false;
        StatisticsPanel.setLoading(false);
      }
    } else if (petaGudangData.length > 0) {
      StatisticsPanel.updateStats(petaGudangData);
      renderPetaGudangMarkers();
    }
    map.on('moveend', renderPetaGudangMarkers);
  } else {
    markersLayer.clearLayers();
    overlappingParcelsLayer.clearLayers();
    map.off('moveend', renderPetaGudangMarkers);
  }
}

/**
 * Render Peta Gudang markers in the current view.
 */
function renderPetaGudangMarkers() {
  if (!petaGudangActive || !map) return;
  
  const bounds = map.getBounds();
  markersLayer.clearLayers();
  
  // Performance: only render what's in view
  const visibleMarkers = [];
  for (let i = 0; i < petaGudangData.length; i++) {
    const m = petaGudangData[i];
    // Check bounds using pre-parsed numbers to avoid object creation
    if (m.latNum >= bounds.getSouth() && m.latNum <= bounds.getNorth() &&
        m.lngNum >= bounds.getWest() && m.lngNum <= bounds.getEast()) {
      visibleMarkers.push(m);
      if (visibleMarkers.length >= 1000) break; // Limit for performance
    }
  }

  visibleMarkers.forEach(m => {
    const latlng = [m.latNum, m.lngNum];
    const progress = m.progressNum || 0;
    
    // Color based on progress
    const color = progress === 100 ? '#10b981' : (progress > 0 ? '#3b82f6' : '#94a3b8');
    
    L.circleMarker(latlng, {
      radius: 6,
      fillColor: color,
      color: '#fff',
      weight: 1.5,
      fillOpacity: 0.8,
    }).addTo(markersLayer)
      .bindPopup(`
        <div class="popup-content">
          <h3 style="color: ${color};">Marker Peta Gudang</h3>
          <table class="popup-table">
            <tr><td class="popup-label">ID</td><td class="popup-value">${m.id}</td></tr>
            <tr><td class="popup-label">Status</td><td class="popup-value">${m.status}</td></tr>
            <tr><td class="popup-label">Progres</td><td class="popup-value">${progress}%</td></tr>
          </table>
          <button class="check-overlap-btn" onclick="window.checkMarkerOverlap(${m.id}, ${m.lat}, ${m.lng})">
            🔍 Cek Tumpang Tindih
          </button>
        </div>
      `);
  });
}

// Global function for checking overlap from popup
window.checkMarkerOverlap = async (id, lat, lng) => {
  if (!map) return;
  
  const latlng = L.latLng(lat, lng);
  let allParcels = [];
  
  // Try to find overlap with all active WMS layers
  for (const layerId of activeLayerIds) {
    const config = LAYERS[layerId];
    try {
      const features = await getFeatureInfo(latlng, config.layerName, map);
      if (features && features.length > 0) {
        allParcels.push(...features);
      }
    } catch (err) {
      console.error('Overlap check error:', err);
    }
  }
  
  if (allParcels.length > 0) {
    overlappingParcelsLayer.clearLayers();
    allParcels.forEach(f => overlappingParcelsLayer.addData(f));
    alert(`Ditemukan ${allParcels.length} bidang tumpang tindih.`);
  } else {
    alert('Tidak ditemukan tumpang tindih di lokasi ini.');
  }
};

/**
 * Switch basemap.
 */
export function setBasemap(basemapId) {
  const config = BASEMAPS[basemapId];
  if (!config || !map) return;

  if (currentBasemapLayer) {
    map.removeLayer(currentBasemapLayer);
  }

  currentBasemapLayer = L.tileLayer(config.url, {
    attribution: config.attribution,
    maxZoom: 19,
  });
  currentBasemapLayer.addTo(map);
  currentBasemapId = basemapId;

  // Show labels on satellite, hide on OSM
  if (map._labelsLayer) {
    map._labelsLayer.setOpacity(basemapId === 'satellite' ? 1 : 0);
  }
}

export function getCurrentBasemap() {
  return currentBasemapId;
}

export function isLayerActive(layerId) {
  return activeLayerIds.has(layerId);
}

/* =====================
   GPS Control
   ===================== */

function initGpsControl() {
  const GpsControl = L.Control.extend({
    options: { position: 'bottomright' },
    onAdd() {
      const container = L.DomUtil.create('div', 'gps-control');
      container.id = 'gps-btn';
      container.title = 'Temukan lokasi saya';
      container.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <line x1="12" y1="2" x2="12" y2="6"></line>
          <line x1="12" y1="18" x2="12" y2="22"></line>
          <line x1="2" y1="12" x2="6" y2="12"></line>
          <line x1="18" y1="12" x2="22" y2="12"></line>
        </svg>`;
      L.DomEvent.disableClickPropagation(container);
      container.addEventListener('click', handleGpsClick);
      return container;
    },
  });

  map.addControl(new GpsControl());
  map.on('locationfound', onLocationFound);
  map.on('locationerror', onLocationError);
}

function handleGpsClick() {
  const btn = document.getElementById('gps-btn');

  if (gpsActive) {
    if (gpsMarker) { map.removeLayer(gpsMarker); gpsMarker = null; }
    if (gpsCircle) { map.removeLayer(gpsCircle); gpsCircle = null; }
    gpsActive = false;
    btn.classList.remove('active', 'locating');
    return;
  }

  btn.classList.add('locating');
  map.locate({ setView: true, maxZoom: 16, enableHighAccuracy: true });
}

function onLocationFound(e) {
  const btn = document.getElementById('gps-btn');
  btn.classList.remove('locating');
  btn.classList.add('active');
  gpsActive = true;

  const radius = e.accuracy / 2;

  if (gpsMarker) map.removeLayer(gpsMarker);
  if (gpsCircle) map.removeLayer(gpsCircle);

  const gpsIcon = L.divIcon({
    html: '<div class="gps-marker"><div class="gps-marker-pulse"></div><div class="gps-marker-dot"></div></div>',
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  gpsMarker = L.marker(e.latlng, { icon: gpsIcon, zIndexOffset: 1000 })
    .addTo(map)
    .bindPopup(`<div style="text-align:center;padding:4px;"><strong>Lokasi Anda</strong><br><span style="font-size:11px;color:var(--text-muted);">Akurasi: ±${Math.round(radius)} m</span></div>`);

  gpsCircle = L.circle(e.latlng, {
    radius, color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1,
  }).addTo(map);
}

function onLocationError(e) {
  const btn = document.getElementById('gps-btn');
  btn.classList.remove('locating');
  alert('Gagal mendapatkan lokasi: ' + e.message);
}

// Global function for background scanning of overlaps in view
window.scanOverlapsInView = async () => {
  if (isFetchingPetaGudang || !map) return;
  
  const bounds = map.getBounds();
  const visibleMarkers = [];
  for (let i = 0; i < petaGudangData.length; i++) {
    const m = petaGudangData[i];
    if (m.latNum >= bounds.getSouth() && m.latNum <= bounds.getNorth() &&
        m.lngNum >= bounds.getWest() && m.lngNum <= bounds.getEast()) {
      visibleMarkers.push(m);
    }
  }

  if (visibleMarkers.length === 0) {
    alert('Tidak ada marker di area ini untuk di-scan.');
    return;
  }

  const toScan = visibleMarkers;
  
  const scanBtn = document.querySelector('.stats-scan-btn');
  if (scanBtn) {
    scanBtn.disabled = true;
    scanBtn.textContent = 'Scanning...';
  }

  let overlapCount = 0;
  const activeWmsIds = Array.from(activeLayerIds);
  
  // Progress tracking
  let processed = 0;
  const countEl = document.getElementById('overlap-count');

  // Process in parallel chunks to be efficient
  const CHUNK_SIZE = 15;
  for (let i = 0; i < toScan.length; i += CHUNK_SIZE) {
    const chunk = toScan.slice(i, i + CHUNK_SIZE);
    
    await Promise.all(chunk.map(async (m) => {
      const latlng = L.latLng(m.latNum, m.lngNum);
      let found = false;
      
      for (const layerId of activeWmsIds) {
        try {
          // Use specific layer name for better targeting
          const features = await getFeatureInfo(latlng, LAYERS[layerId].layerName, map);
          if (features && features.length > 0) {
            found = true;
            break; 
          }
        } catch (e) { /* ignore */ }
      }
      
      if (found) overlapCount++;
      processed++;
      if (countEl) countEl.textContent = `${overlapCount} found (${processed}/${toScan.length})`;
    }));
  }

  StatisticsPanel.updateStats(petaGudangData, overlapCount);
  
  if (scanBtn) {
    scanBtn.disabled = false;
    scanBtn.textContent = '🔍 Scan Area';
  }
  
  alert(`Scan selesai. Ditemukan ${overlapCount} dari ${toScan.length} marker tumpang tindih.`);
};

export function showLoading(text) {
  const el = document.getElementById('map-loading');
  const textEl = document.getElementById('map-loading-text');
  if (el) el.classList.remove('hidden');
  if (textEl) textEl.textContent = text || 'Memuat peta...';
}

export function hideLoading() {
  const el = document.getElementById('map-loading');
  if (el) el.classList.add('hidden');
}
