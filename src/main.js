/**
 * Main Application Entry Point
 * Peta Lahan Sawah Indonesia v1.0
 */

// --- Styles ---
import 'leaflet/dist/leaflet.css';
import './styles/index.css';
import './styles/map.css';
import './styles/components.css';

// --- Fix Leaflet default icon paths for Vite ---
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// --- Components ---
import * as Header from './components/Header.js';
import * as MapView from './components/MapView.js';
import * as LayerPanel from './components/LayerPanel.js';
import * as StatisticsPanel from './components/StatisticsPanel.js';
import * as Footer from './components/Footer.js';

/**
 * Build the app layout.
 */
function buildLayout() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="app-layout">
      ${Header.render()}
      ${MapView.render()}
      ${LayerPanel.render()}
      ${StatisticsPanel.render()}
      ${Footer.render()}
    </div>
  `;
}

/**
 * Initialize the application.
 */
async function initApp() {
  buildLayout();

  // Init components
  MapView.init();
  LayerPanel.init();
  StatisticsPanel.init();
  Footer.updateTimestamp();

  // Hide initial loader
  const loader = document.getElementById('initial-loader');
  if (loader) loader.classList.add('hidden');
}

// --- Boot ---
document.addEventListener('DOMContentLoaded', initApp);
