// Gemeinsame DOM-Helfer für Tests

function getProjectLoadingOverlayMarkup({ hidden = true } = {}) {
  const hiddenClass = hidden ? 'hidden' : '';
  return `
    <div id="projectLoadingOverlay" class="${hiddenClass}">
      <div class="loading-box">
        <div class="progress-bar"><div class="progress-fill"></div></div>
        <span id="projectLoadingText">Projekt wird geladen...</span>
        <ul id="projectLoadingSteps" class="loading-steps"></ul>
      </div>
    </div>
  `;
}

function setupProjectLoadingOverlay(extraHtml = '') {
  document.body.innerHTML = getProjectLoadingOverlayMarkup() + extraHtml;
}

module.exports = {
  getProjectLoadingOverlayMarkup,
  setupProjectLoadingOverlay
};
