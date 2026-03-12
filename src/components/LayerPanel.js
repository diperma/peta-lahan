/**
 * LayerPanel Component — slide-out panel for toggling WMS layers and basemap.
 */
import { LAYERS } from '../services/wms.js';
import * as MapView from './MapView.js';

let panelOpen = false;

export function render() {
  const layerItems = Object.entries(LAYERS).map(([id, config]) => `
    <div class="layer-item" id="layer-item-${id}" data-layer="${id}">
      <div class="layer-item-header">
        <div class="layer-color-dot" style="background: ${config.color};"></div>
        <span class="layer-name">${config.name}</span>
        <label class="toggle-switch">
          <input type="checkbox" id="layer-toggle-${id}" data-layer="${id}" />
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="layer-opacity">
        <div class="opacity-label">
          <span>Opasitas</span>
          <span id="opacity-val-${id}">80%</span>
        </div>
        <input type="range" class="opacity-slider" id="opacity-slider-${id}"
               data-layer="${id}" min="0" max="100" value="80" />
      </div>
      <button class="zoom-extent-btn" data-layer="${id}" title="Zoom ke area cakupan">
        🔍 Zoom ke Cakupan
      </button>
    </div>
  `).join('');

  return `
    <div class="layer-panel-overlay" id="layer-panel-overlay">
      <div class="layer-panel-backdrop" id="layer-panel-backdrop"></div>
      <div class="layer-panel">
        <div class="panel-header">
          <h2>Pengaturan Peta</h2>
          <button class="panel-close-btn" id="panel-close-btn" title="Tutup">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="panel-body">

          <div class="panel-section">
            <div class="panel-section-title">Layer Data</div>
            ${layerItems}
          </div>

          <div class="panel-section">
            <div class="panel-section-title">Peta Dasar</div>
            <div class="basemap-options">
              <button class="basemap-btn active" data-basemap="osm">🗺️ OSM</button>
              <button class="basemap-btn" data-basemap="satellite">🛰️ Satelit</button>
            </div>
          </div>

          <div class="panel-section" id="legend-section">
            <div class="panel-section-title">Legenda</div>
            <div class="legend-placeholder" id="legend-container">
              Aktifkan layer untuk melihat legenda.
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
}

export function init() {
  // Panel toggle
  document.getElementById('panel-toggle-btn')?.addEventListener('click', togglePanel);
  document.getElementById('panel-close-btn')?.addEventListener('click', closePanel);
  document.getElementById('layer-panel-backdrop')?.addEventListener('click', closePanel);

  // Layer toggles
  document.querySelectorAll('.toggle-switch input[data-layer]').forEach(input => {
    input.addEventListener('change', (e) => {
      const layerId = e.target.dataset.layer;
      const visible = e.target.checked;
      MapView.toggleLayer(layerId, visible);

      // Toggle active class on item
      const item = document.getElementById(`layer-item-${layerId}`);
      if (item) item.classList.toggle('active', visible);

      updateLegends();
    });
  });

  // Opacity sliders
  document.querySelectorAll('.opacity-slider[data-layer]').forEach(slider => {
    slider.addEventListener('input', (e) => {
      const layerId = e.target.dataset.layer;
      const opacity = parseInt(e.target.value) / 100;
      MapView.setLayerOpacity(layerId, opacity);

      const valEl = document.getElementById(`opacity-val-${layerId}`);
      if (valEl) valEl.textContent = `${e.target.value}%`;
    });
  });

  // Zoom-to-extent buttons
  document.querySelectorAll('.zoom-extent-btn[data-layer]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const layerId = e.target.closest('[data-layer]').dataset.layer;
      MapView.zoomToLayer(layerId);
      closePanel();
    });
  });

  // Basemap buttons
  document.querySelectorAll('.basemap-btn[data-basemap]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const basemapId = e.target.dataset.basemap;
      MapView.setBasemap(basemapId);

      // Update active state
      document.querySelectorAll('.basemap-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
    });
  });

  // Keyboard: Escape to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panelOpen) closePanel();
  });
}

function togglePanel() {
  panelOpen = !panelOpen;
  const overlay = document.getElementById('layer-panel-overlay');
  if (overlay) overlay.classList.toggle('open', panelOpen);
}

function closePanel() {
  panelOpen = false;
  const overlay = document.getElementById('layer-panel-overlay');
  if (overlay) overlay.classList.remove('open');
}

function updateLegends() {
  const container = document.getElementById('legend-container');
  if (!container) return;

  const activeIds = Object.keys(LAYERS).filter(id => {
    const input = document.getElementById(`layer-toggle-${id}`);
    return input?.checked;
  });

  if (activeIds.length === 0) {
    container.innerHTML = '<div class="legend-placeholder">Aktifkan layer untuk melihat legenda.</div>';
    return;
  }

  let html = '';
  for (const id of activeIds) {
    const config = LAYERS[id];

    html += `<div style="margin-bottom: 12px;">
      <div style="font-size: 0.78rem; font-weight: 600; color: ${config.color}; margin-bottom: 6px;">
        ${config.name}
      </div>`;

    // Render static legend items from config
    if (config.legend && config.legend.length > 0) {
      for (const item of config.legend) {
        html += `<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <div style="width: 18px; height: 14px; background: ${item.color}; border-radius: 3px; border: 1px solid rgba(255,255,255,0.2); flex-shrink: 0;"></div>
          <span style="font-size: 0.72rem; color: var(--text-secondary);">${item.label}</span>
        </div>`;
      }
    }

    // Show zoom hint
    if (config.minZoom) {
      html += `<div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 4px; font-style: italic;">
        Tampil pada zoom ≥ ${config.minZoom}
      </div>`;
    }

    html += `</div>`;
  }

  container.innerHTML = html;
}
