/**
 * StatisticsPanel Component — displays summary counts of markers and overlaps.
 */
import * as PetaGudang from '../services/peta-gudang.js';

let container = null;
let stats = null;

export function render() {
  return `
    <div class="stats-bar hidden" id="stats-bar">
      <div class="stats-bar-content" id="stats-bar-content">
        <div class="stats-placeholder">Memuat statistik peta...</div>
      </div>
    </div>
  `;
}

export function init() {
  // No explicit toggle buttons needed anymore as it's a sticky bar
}

export function showToggle(visible) {
  const bar = document.getElementById('stats-bar');
  if (bar) bar.classList.toggle('hidden', !visible);
}

export function showError(message) {
  const content = document.getElementById('stats-bar-content');
  if (!content) return;
  content.innerHTML = `
    <div class="stats-error">⚠️ ${message}</div>
  `;
}

export function setLoading(loading) {
  const content = document.getElementById('stats-bar-content');
  const btn = document.getElementById('stats-toggle-btn');
  if (!content) return;
  
  if (loading) {
    btn?.classList.add('loading-pulse');
    content.innerHTML = `
      <div class="stats-loading">
        <div class="spinner-sm"></div>
        <span>Memproses data statistik (${PetaGudang.BACKEND_URL ? 'Remote' : 'Local'})...</span>
      </div>
    `;
  } else {
    btn?.classList.remove('loading-pulse');
  }
}

export function updateStats(markers, overlapCount = null) {
  if (!markers) return;
  
  const categories = PetaGudang.categorizeMarkers(markers);
  const content = document.getElementById('stats-bar-content');
  if (!content) return;

  // Render horizontal stats
  content.innerHTML = `
    <div class="stats-group">
      <div class="stats-item">
        <span class="stats-label">Total Marker:</span>
        <span class="stats-value">${categories.total.toLocaleString()}</span>
      </div>
      <div class="stats-divider"></div>
      <div class="stats-item">
        <span class="stats-label">Selesai (100%):</span>
        <span class="stats-value highlight">${categories.completed.toLocaleString()}</span>
      </div>
      <div class="stats-divider"></div>
      <div class="stats-item progress-item">
        <span class="stats-label">Progres:</span>
        <div class="stats-mini-chart">
          ${Object.entries(categories.byProgress)
            .sort((a,b) => parseInt(a[0]) - parseInt(b[0]))
            .map(([key, count]) => {
              const pct = (count / categories.total * 100).toFixed(1);
              return `<div class="stats-mini-bar" style="width: ${pct}%;" title="${key}: ${count.toLocaleString()} (${pct}%)"></div>`;
            }).join('')}
        </div>
      </div>
      <div class="stats-divider"></div>
      <div class="stats-item overlap-item">
        <span class="stats-label">Tumpang Tindih (View):</span>
        <span class="stats-value highlight-warn" id="overlap-count">${overlapCount !== null ? overlapCount : '-'}</span>
        <button class="stats-scan-btn" onclick="window.scanOverlapsInView()" title="Scan tumpang tindih lahan sawah di area ini">
          🔍 Scan Area
        </button>
      </div>
    </div>
  `;
}
