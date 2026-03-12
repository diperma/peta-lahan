/**
 * Footer Component
 */
export function render() {
  return `
    <footer class="app-footer">
      <span>Sumber data: <a href="https://bhumi.atrbpn.go.id" target="_blank" class="footer-link">bhumi.atrbpn.go.id</a></span>
      <span id="footer-timestamp"></span>
    </footer>
  `;
}

export function updateTimestamp() {
  const el = document.getElementById('footer-timestamp');
  if (el) {
    const now = new Date();
    el.textContent = now.toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
}
