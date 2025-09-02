// UI-Komponenten zur Anzeige und Verwaltung verwaister Vorschläge

(function(){
  // Öffnet die Quarantäne-Übersicht als Dialog
  window.openQuarantine = function() {
    if (!window.currentProject) {
      return;
    }
    const ov = window.showModal(`<h3>🦠 Quarantäne</h3>
      <div class="dialog-buttons">
        <button class="btn btn-secondary" onclick="exportQuarantine()">Alle exportieren</button>
        <button class="btn btn-secondary" onclick="confirmClearQuarantine()">Alle endgültig entfernen</button>
        <button class="btn btn-secondary" onclick="this.closest('.dialog-overlay').remove()">Schließen</button>
      </div>
      <table class="quarantine-table">
        <thead><tr><th>ID</th><th>Fehlende Datei</th><th>Erkannt</th><th>Vorschau</th><th>Aktion</th></tr></thead>
        <tbody id="quarantineTableBody"></tbody>
      </table>`);
    renderQuarantineTable();
  };

  // Rendert die Tabelle neu anhand der aktuellen Projektdaten
  window.renderQuarantineTable = function() {
    const body = document.getElementById('quarantineTableBody');
    if (!body || !window.currentProject) return;
    const list = (window.currentProject.meta?.quarantine?.orphanSuggestions) || [];
    body.innerHTML = list.map((o,i) => {
      const preview = typeof o.suggestion.payload === 'string' ? o.suggestion.payload : JSON.stringify(o.suggestion.payload);
      return `<tr>
        <td>${escapeHtml(o.suggestion.id)}</td>
        <td>${escapeHtml(o.missingFileId || '')}</td>
        <td>${escapeHtml(new Date(o.detectedAt).toLocaleString())}</td>
        <td>${escapeHtml(preview.substring(0,30))}</td>
        <td>
          <button class="btn btn-secondary" onclick="restoreOrphan(${i})">Wiederherstellen</button>
          <button class="btn btn-secondary" onclick="removeOrphan(${i})">Entfernen</button>
        </td>
      </tr>`;
    }).join('');
  };

  // Stellt einen einzelnen Eintrag wieder her
  window.restoreOrphan = function(index) {
    const q = window.currentProject?.meta?.quarantine?.orphanSuggestions;
    if (!q) return;
    const orphan = q[index];
    const options = (window.currentProject.files||[]).map(f => `<option value="${f.id}">${escapeHtml(f.filename||f.id)}</option>`).join('');
    const ov = window.showModal(`<h3>Vorschlag wiederherstellen</h3>
      <label>Datei wählen:</label>
      <select id="restoreTarget">${options}</select>
      <div class="dialog-buttons">
        <button class="btn btn-secondary" onclick="this.closest('.dialog-overlay').remove()">Abbrechen</button>
        <button class="btn btn-success" onclick="confirmRestore(${index})">Wiederherstellen</button>
      </div>`);
    const sel = ov.querySelector('#restoreTarget');
    if (sel && orphan.missingFileId) sel.value = orphan.missingFileId;
  };

  // Bestätigt das Wiederherstellen
  window.confirmRestore = function(index) {
    const q = window.currentProject?.meta?.quarantine?.orphanSuggestions;
    if (!q) return;
    const ov = document.getElementById('restoreTarget')?.closest('.dialog-overlay');
    const fileId = document.getElementById('restoreTarget')?.value;
    if (!fileId) return;
    const orphan = q[index];
    orphan.suggestion.fileId = fileId;
    window.currentProject.suggestions = window.currentProject.suggestions || [];
    window.currentProject.suggestions.push(orphan.suggestion);
    q.splice(index,1);
    if (typeof saveCurrentProject === 'function') saveCurrentProject();
    window.showToast('Vorschlag wiederhergestellt');
    if (ov) ov.remove();
    renderQuarantineTable();
  };

  // Entfernt einen Eintrag dauerhaft
  window.removeOrphan = function(index) {
    const q = window.currentProject?.meta?.quarantine?.orphanSuggestions;
    if (!q) return;
    q.splice(index,1);
    if (typeof saveCurrentProject === 'function') saveCurrentProject();
    renderQuarantineTable();
  };

  // Exportiert alle Waisen als JSON-Datei
  window.exportQuarantine = function() {
    const data = JSON.stringify(window.currentProject?.meta?.quarantine?.orphanSuggestions || [], null, 2);
    const blob = new Blob([data], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quarantine.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Fragt nach Bestätigung und leert die Quarantäne
  window.confirmClearQuarantine = function() {
    const ov = window.showModal(`<p>Alle Einträge endgültig entfernen?</p>
      <div class="dialog-buttons">
        <button class="btn btn-secondary" onclick="this.closest('.dialog-overlay').remove()">Abbrechen</button>
        <button class="btn btn-danger" onclick="clearQuarantine()">Entfernen</button>
      </div>`);
  };

  window.clearQuarantine = function() {
    const q = window.currentProject?.meta?.quarantine?.orphanSuggestions;
    if (!q) return;
    q.length = 0;
    if (typeof saveCurrentProject === 'function') saveCurrentProject();
    renderQuarantineTable();
    document.querySelector('.dialog-overlay')?.remove();
  };
})();
