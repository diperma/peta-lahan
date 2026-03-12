/**
 * StatisticsPanel Component — displays summary counts of markers and overlaps.
 */
import * as PetaGudang from '../services/peta-gudang.js';

let container = null;
let stats = null;

export function render() {
  return `
    <div class="stats-panel-overlay hidden" id="stats-panel-overlay">
      <div class="stats-panel">
        <div class="stats-header">
          <h3>Statistik Peta Gudang</h3>
          <button class="stats-close-btn" id="stats-close-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="stats-body" id="stats-body">
          <div class="stats-placeholder">Memuat data statistik...</div>
        </div>
      </div>
    </div>
    
    <button class="stats-toggle-btn hidden" id="stats-toggle-btn" title="Lihat Statistik">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
      </svg>
    </button>
  `;
}

export function init() {
  document.getElementById('stats-toggle-btn')?.addEventListener('click', () => {
    document.getElementById('stats-panel-overlay')?.classList.toggle('hidden');
  });
  
  document.getElementById('stats-close-btn')?.addEventListener('click', () => {
    document.getElementById('stats-panel-overlay')?.classList.add('hidden');
  });
}

export function showToggle(visible) {
  const btn = document.getElementById('stats-toggle-btn');
  if (btn) btn.classList.toggle('hidden', !visible);
}

export function showError(message) {
  const body = document.getElementById('stats-body');
  if (!body) return;
  body.innerHTML = `
    <div class="stats-error">
      <p>⚠️ ${message}</p>
    </div>
  `;
}

export function updateStats(markers) {
  if (!markers) return;
  
  const categories = PetaGudang.categorizeMarkers(markers);
  const body = document.getElementById('stats-body');
  if (!body) return;

  body.innerHTML = `
    <div class="stats-summary">
      <div class="stat-card">
        <div class="stat-value">${categories.total.toLocaleString()}</div>
        <div class="stat-label">Total Marker</div>
      </div>
      <div class="stat-card highlight">
        <div class="stat-value">${categories.completed.toLocaleString()}</div>
        <div class="stat-label">Selesai (100%)</div>
      </div>
    </div>
    
    <div class="stats-section-title">Progres Pembangunan</div>
    <div class="progress-list">
      ${Object.entries(categories.byProgress).sort((a,b) => parseInt(a[0]) - parseInt(b[0])).map(([key, count]) => `
        <div class="progress-row">
          <span class="progress-label">${key}</span>
          <div class="progress-bar-container">
            <div class="progress-bar" style="width: ${(count / categories.total * 100).toFixed(1)}%;"></div>
          </div>
          <span class="progress-count">${count.toLocaleString()}</span>
        </div>
      `).join('')}
    </div>

    <div class="stats-info">
      <p>⚠️ Data tumpang tindih dengan lahan pertanian hanya dapat dihitung secara manual per lokasi melalui marker di peta.</p>
    </div>
  `;
}
