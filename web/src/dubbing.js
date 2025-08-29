const API = "https://api.elevenlabs.io/v1";
// Zugriff auf den gewählten Speicher immer dynamisch über window.storage
let csvLineEnding = (typeof window.storage !== "undefined" && window.storage.getItem("hla_lineEnding")) || (typeof global !== "undefined" && global.csvLineEnding) || "LF";

// =========================== SHOWDUBBINGSETTINGS START ======================
async function getDefaultVoiceSettings(apiKey) {
    const res = await fetch(`${API}/voices/settings/default`, {
        headers: { 'xi-api-key': apiKey }
    });
    if (!res.ok) throw new Error('Fehler beim Abrufen der Default-Settings');
    return await res.json();
}

async function showDubbingSettings(fileId, mode = currentDubMode) {
    currentDubbingFileId = fileId;
    currentDubMode = mode;
    const file = files.find(f => f.id === fileId) || {};
    const voiceId = folderCustomizations[file.folder]?.voiceId || '';
    let voiceName = voiceId;
    if (voiceId) {
        const v = availableVoices.find(v => v.voice_id === voiceId);
        if (v) voiceName = v.name;
    }
    let defaults = {
        stability: 1.0,
        similarity_boost: 1.0,
        style: 0.0,
        speed: 1.0,
        use_speaker_boost: true
    };
    if (storedVoiceSettings) {
        // Zuerst die gespeicherten Werte verwenden
        defaults = storedVoiceSettings;
    } else if (elevenLabsApiKey) {
        // Ansonsten Defaults von der API holen
        try {
            defaults = await getDefaultVoiceSettings(elevenLabsApiKey);
        } catch (e) {
            console.warn('Default-Settings konnten nicht geladen werden');
        }
    }

    const html = `
        <div class="dialog-overlay hidden" id="dubbingSettingsDialog">
            <div class="dialog dubbing-dialog">
                <button class="dialog-close-btn" onclick="closeDubbingSettings()">×</button>
                <h3>🎤 Dubbing-Einstellungen</h3>
                <p class="file-name"><strong>${file.filename || ''}</strong></p>
                <p class="current-voice-line">Aktuelle Stimme: <span class="current-voice">${voiceName || 'Keine'}</span></p>
                <div class="dub-settings-grid">
                    <label for="dubSetStability">Stability <span class="info-icon" onclick="openDubTooltip(event, 'stability')">ⓘ</span></label>
                    <div class="slider-wrapper"><input type="range" id="dubSetStability" min="0" max="1" step="0.01" value="${defaults.stability}"><span class="slider-value" id="valStability">${defaults.stability}</span></div>

                    <label for="dubSetSimilarity">Similarity Boost <span class="info-icon" onclick="openDubTooltip(event, 'similarity')">ⓘ</span></label>
                    <div class="slider-wrapper"><input type="range" id="dubSetSimilarity" min="0" max="1" step="0.01" value="${defaults.similarity_boost}"><span class="slider-value" id="valSimilarity">${defaults.similarity_boost}</span></div>

                    <label for="dubSetStyle">Style <span class="info-icon" onclick="openDubTooltip(event, 'style')">ⓘ</span></label>
                    <div class="slider-wrapper"><input type="range" id="dubSetStyle" min="0" max="1" step="0.01" value="${defaults.style}"><span class="slider-value" id="valStyle">${defaults.style}</span></div>

                    <label for="dubSetSpeed">Speed <span class="info-icon" onclick="openDubTooltip(event, 'speed')">ⓘ</span></label>
                    <div class="slider-wrapper"><input type="range" id="dubSetSpeed" min="0.5" max="2" step="0.05" value="${defaults.speed}"><span class="slider-value" id="valSpeed">${defaults.speed}</span></div>

                    <label for="dubSetSpeaker">use_speaker_boost <span class="info-icon" onclick="openDubTooltip(event, 'speaker')">ⓘ</span></label>
                    <div class="slider-wrapper"><input type="checkbox" id="dubSetSpeaker" ${defaults.use_speaker_boost ? 'checked' : ''}></div>
                </div>

                <button class="btn btn-primary preview-btn" onclick="playDubPreview()">Probe abspielen</button>

                <div class="advanced-block">
                    <div class="accordion-header" onclick="toggleDubAdvanced()">Fortgeschrittene Einstellungen ▸</div>
                    <div class="accordion-content" id="dubAdvanced">
                        <div class="customize-field"><label>disable_voice_cloning</label><input type="checkbox" id="dubOptVoiceClone"></div>
                        <div class="customize-field"><label>num_speakers</label><input type="number" id="dubOptNumSpeakers" min="1" max="10" value="1"></div>
                        <div class="customize-field"><label>seed</label><input type="number" id="dubOptSeed" value="0"></div>
                    </div>
                </div>

                <div class="dialog-buttons">
                    <button class="btn btn-warning" onclick="resetStoredVoiceSettings()">Reset</button>
                    <button class="btn btn-secondary" onclick="closeDubbingSettings()">Abbrechen</button>
                    <button class="btn btn-success" id="dubStartBtn" onclick="confirmDubbingSettings(${fileId})">Dubben</button>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    // Dialog sofort anzeigen
    document.getElementById('dubbingSettingsDialog').classList.remove('hidden');
    bindDubSettingListeners();
}

// =========================== SHOWEMODUBBINGSETTINGS START ====================
// Eigenes Einstellungsfenster für emotionales Dubbing
async function showEmoDubbingSettings(fileId) {
    currentDubbingFileId = fileId;
    currentDubMode = 'beta';
    const file = files.find(f => f.id === fileId) || {};
    const voiceId = folderCustomizations[file.folder]?.voiceId || '';
    let voiceName = voiceId;
    if (voiceId) {
        const v = availableVoices.find(v => v.voice_id === voiceId);
        if (v) voiceName = v.name;
    }
    let defaults = storedVoiceSettings || {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.4,
        speed: 1.0,
        use_speaker_boost: true
    };
    const html = `
        <div class="dialog-overlay hidden" id="emoDubbingDialog">
            <div class="dialog dubbing-dialog">
                <button class="dialog-close-btn" onclick="closeEmoDubbingSettings()">×</button>
                <h3>🎭 Emotionales Dubbing V3</h3>
                <p class="file-name"><strong>${file.filename || ''}</strong></p>
                <p class="current-voice-line">Aktuelle Stimme: <span class="current-voice">${voiceName || 'Keine'}</span></p>
                <div class="dub-settings-grid">
                    <label for="emoSetStability">Stability</label>
                    <div class="slider-wrapper"><input type="range" id="emoSetStability" min="0" max="1" step="0.01" value="${defaults.stability}"><span class="slider-value" id="emoValStability">${defaults.stability}</span></div>

                    <label for="emoSetSimilarity">Similarity Boost</label>
                    <div class="slider-wrapper"><input type="range" id="emoSetSimilarity" min="0" max="1" step="0.01" value="${defaults.similarity_boost}"><span class="slider-value" id="emoValSimilarity">${defaults.similarity_boost}</span></div>

                    <label for="emoSetStyle">Style</label>
                    <div class="slider-wrapper"><input type="range" id="emoSetStyle" min="0" max="1" step="0.01" value="${defaults.style}"><span class="slider-value" id="emoValStyle">${defaults.style}</span></div>

                    <label for="emoSetSpeed">Speed</label>
                    <div class="slider-wrapper"><input type="range" id="emoSetSpeed" min="0.5" max="2" step="0.05" value="${defaults.speed}"><span class="slider-value" id="emoValSpeed">${defaults.speed}</span></div>

                    <label for="emoSetSpeaker">use_speaker_boost</label>
                    <div class="slider-wrapper"><input type="checkbox" id="emoSetSpeaker" ${defaults.use_speaker_boost ? 'checked' : ''}></div>
                </div>
                <div class="dialog-buttons">
                    <button class="btn btn-secondary" onclick="closeEmoDubbingSettings()">Abbrechen</button>
                    <button class="btn btn-success" id="emoStartBtn" onclick="confirmEmoDubbingSettings(${fileId})">Dubben</button>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('emoDubbingDialog').classList.remove('hidden');
    const fields = [
        ['emoSetStability', 'emoValStability'],
        ['emoSetSimilarity', 'emoValSimilarity'],
        ['emoSetStyle', 'emoValStyle'],
        ['emoSetSpeed', 'emoValSpeed']
    ];
    for (const [inp, val] of fields) {
        const i = document.getElementById(inp);
        const v = document.getElementById(val);
        if (i && v) i.oninput = () => { v.textContent = i.value; };
    }
}

function closeEmoDubbingSettings() {
    const dlg = document.getElementById('emoDubbingDialog');
    if (dlg) dlg.remove();
}

async function confirmEmoDubbingSettings(fileId) {
    const btn = document.getElementById('emoStartBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span>';
    }
    const settings = {
        stability: parseFloat(document.getElementById('emoSetStability').value),
        similarity_boost: parseFloat(document.getElementById('emoSetSimilarity').value),
        style: parseFloat(document.getElementById('emoSetStyle').value),
        speed: parseFloat(document.getElementById('emoSetSpeed').value),
        use_speaker_boost: document.getElementById('emoSetSpeaker').checked
    };
    await startEmoDubbing(fileId, settings);
    closeEmoDubbingSettings();
}
// =========================== SHOWEMODUBBINGSETTINGS END ======================

function closeDubbingSettings() {
    const dlg = document.getElementById('dubbingSettingsDialog');
    if (dlg) dlg.remove();
}

// Verbindet alle Slider mit der zugehörigen Anzeige
function bindDubSettingListeners() {
    const felder = [
        ['dubSetStability', 'valStability'],
        ['dubSetSimilarity', 'valSimilarity'],
        ['dubSetStyle', 'valStyle'],
        ['dubSetSpeed', 'valSpeed']
    ];
    for (const [inputId, valId] of felder) {
        const eingabe = document.getElementById(inputId);
        const anzeige = document.getElementById(valId);
        if (eingabe && anzeige) {
            eingabe.oninput = () => { anzeige.textContent = eingabe.value; };
        }
    }
}

async function confirmDubbingSettings(fileId) {
    const btn = document.getElementById('dubStartBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span>';
    }
    const settings = {
        stability: parseFloat(document.getElementById('dubSetStability').value),
        similarity_boost: parseFloat(document.getElementById('dubSetSimilarity').value),
        style: parseFloat(document.getElementById('dubSetStyle').value),
        speed: parseFloat(document.getElementById('dubSetSpeed').value),
        use_speaker_boost: document.getElementById('dubSetSpeaker').checked
    };
    // Erweiterte Optionen erfassen
    const adv = {
        disable_voice_cloning: document.getElementById('dubOptVoiceClone').checked,
        num_speakers: parseInt(document.getElementById('dubOptNumSpeakers').value, 10),
        seed: parseInt(document.getElementById('dubOptSeed').value, 10)
    };
    settings.advanced = adv;
    // Gewählte Einstellungen persistent speichern
    if (window.storage) window.storage.setItem('hla_voiceSettings', JSON.stringify(settings));
    storedVoiceSettings = settings;
    updateVoiceSettingsDisplay();
    await startDubbing(fileId, settings, currentDubLang, currentDubMode);
    closeDubbingSettings();
}

// Entfernt gespeicherte Voice-Settings und lädt den Dialog neu
function resetStoredVoiceSettings() {
    if (window.storage) window.storage.removeItem('hla_voiceSettings');
    storedVoiceSettings = null;
    updateVoiceSettingsDisplay();
    closeDubbingSettings();
    if (currentDubbingFileId !== null) {
        showDubbingSettings(currentDubbingFileId);
    }
}

// Schaltet den Abschnitt mit erweiterten Optionen ein oder aus
function toggleDubAdvanced() {
    const cont = document.getElementById('dubAdvanced');
    if (!cont) return;
    cont.style.display = cont.style.display === 'block' ? 'none' : 'block';
}

// Öffnet ein kleines Tooltip-Fenster mit einer Beschreibung
function openDubTooltip(ev, key) {
    const tips = {
        stability: 'Je höher, desto gleichmäßiger und weniger emotional klingt die Stimme. Niedrigere Werte bringen mehr Lebendigkeit.',
        similarity: 'Bestimmt, wie nah die Stimme am Original bleibt. Hohe Werte bewahren den Charakter besser.',
        style: 'Verstärkt den Sprechausdruck. Hohe Werte wirken dramatischer.',
        speed: 'Geschwindigkeit der Ausgabe. 1,0 ist unverändert.',
        speaker: 'Aktiviert zusätzliche Ähnlichkeit zum Sprecher.'
    };
    closeDubTooltip();
    const box = document.createElement('div');
    box.className = 'info-tooltip';
    box.id = 'dubTooltip';
    box.textContent = tips[key] || '';
    box.style.left = ev.clientX + 'px';
    box.style.top = ev.clientY + 'px';
    document.body.appendChild(box);
    document.addEventListener('keydown', escCloseDubTooltip);
}

// Schliesst das Tooltip-Fenster
function closeDubTooltip() {
    const box = document.getElementById('dubTooltip');
    if (box) box.remove();
    document.removeEventListener('keydown', escCloseDubTooltip);
}

function escCloseDubTooltip(e) { if (e.key === 'Escape') closeDubTooltip(); }

// Spielt ein kurzes Sample mit den aktuellen Einstellungen ab
async function playDubPreview() {
    const voiceId = folderCustomizations[files.find(f => f.id === currentDubbingFileId)?.folder]?.voiceId;
    if (!voiceId || !elevenLabsApiKey) return;
    const settings = {
        stability: parseFloat(document.getElementById('dubSetStability').value),
        similarity_boost: parseFloat(document.getElementById('dubSetSimilarity').value),
        style: parseFloat(document.getElementById('dubSetStyle').value),
        speed: parseFloat(document.getElementById('dubSetSpeed').value),
        use_speaker_boost: document.getElementById('dubSetSpeaker').checked
    };
    const body = {
        text: 'Dies ist eine Probe.',
        voice_settings: settings,
        model_id: 'eleven_monolingual_v1'
    };
    const res = await fetch(`${API}/text-to-speech/${voiceId}/stream`, {
        method: 'POST',
        headers: { 'xi-api-key': elevenLabsApiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
}

// Zeigt einen Hinweis an, dass das Studio geöffnet wurde
function showStudioOverlay() {
    const ov = document.createElement('div');
    ov.className = 'dialog-overlay hidden';
    ov.id = 'studioNoticeDialog';
    ov.innerHTML = `
        <div class="dialog">
            <h3>🎧 ElevenLabs Studio</h3>
            <p>Das Studio ist in einem neuen Tab geöffnet.<br>
               Klicken Sie dort auf „Generate Audio" und danach auf OK.</p>
            <div class="dialog-buttons">
                <button class="btn btn-success" onclick="closeStudioOverlay()">OK</button>
            </div>
        </div>`;
    document.body.appendChild(ov);
    ov.classList.remove('hidden');
}

// Schließt den Studio-Hinweis
function closeStudioOverlay() {
    const ov = document.getElementById('studioNoticeDialog');
    if (ov) ov.remove();
}

// Zeigt ein Dialogfenster, das auf die manuelle Datei wartet
// und blendet dabei Ordnername sowie EN- und DE-Text ein
// ID der Datei, auf deren Download gewartet wird
let waitDialogFileId = typeof window !== 'undefined' ? window.waitDialogFileId || null : null;
async function showDownloadWaitDialog(fileId, dubId) {
    waitDialogFileId = fileId;
    if (typeof window !== 'undefined') window.waitDialogFileId = fileId;
    const file = files.find(f => f.id === fileId) || {};
    const folder = escapeHtml(file.folder || '');
    // Ordnername in die Zwischenablage kopieren (nur letzter Teil)
    if (file.folder) {
        try {
            const baseFolder = file.folder.split(/[\\/]/).pop();
            if (await safeCopy(baseFolder)) {
                updateStatus('Ordner kopiert: ' + baseFolder);
            }
        } catch (err) {
            console.error('Kopieren fehlgeschlagen:', err);
        }
    }
    const enText = escapeHtml(file.enText || '');
    const deText = escapeHtml(file.deText || '');
    let dlPath = 'Download';
    if (window.electronAPI && window.electronAPI.getDownloadPath) {
        dlPath = await window.electronAPI.getDownloadPath();
    }
    const html = `
        <div class="dialog-overlay hidden" id="downloadWaitDialog">
            <div class="dialog">
                <h3>Alles gesendet</h3>
                <p>Bitte lege die fertige Datei in <code>${dlPath}</code>.</p>
                <div style="margin-bottom:10px;">
                    <p><strong>Ordner:</strong> ${folder}</p>
                    <p><strong>EN:</strong> ${enText}</p>
                    <p><strong>DE:</strong> ${deText}</p>
                    ${dubId ? `<p><strong>ID:</strong> ${dubId}</p>` : ''}
                </div>
                <p id="downloadFound" style="display:none;"></p>
                <div class="dialog-buttons" id="downloadWaitButtons">
                    ${dubId ? `<button class="btn btn-primary" onclick="openDubbingPage(${fileId})">Seite öffnen</button>` : ''}
                    ${dubId ? `<button class="btn btn-primary" onclick="startDubAutomation(${fileId})">Automatik</button>` : ''}
                    <button class="btn btn-secondary" id="copyFolderBtn" onclick="copyDownloadFolder()">Ordner kopieren</button>
                    <button class="btn btn-secondary" onclick="closeDownloadWaitDialog()">Abbrechen</button>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('downloadWaitDialog').classList.remove('hidden');
}

function updateDownloadWaitDialog(name, destRel) {
    const info = document.getElementById('downloadFound');
    if (info) {
        info.textContent = 'Datei gefunden: ' + name;
        info.style.display = 'block';
    }
    const btn = document.getElementById('downloadWaitButtons');
    if (btn) {
        let openBtn = '';
        if (destRel && window.electronAPI && window.electronAPI.openPath && debugInfo.projectRoot) {
            openBtn = `<button class="btn btn-primary" onclick="openLocalFile('${destRel.replace(/'/g, "\\'")}')">Datei öffnen</button>`;
        }
        btn.innerHTML = openBtn + '<button class="btn btn-success" onclick="closeDownloadWaitDialog()">OK</button>';
    }
    // Kurz anzeigen und danach automatisch schließen
    setTimeout(() => {
        closeDownloadWaitDialog();
        closeStudioModal();
        closeDubbingLog();
    }, 1500);
}

function closeDownloadWaitDialog() {
    const dlg = document.getElementById('downloadWaitDialog');
    if (dlg) dlg.remove();
    waitDialogFileId = null;
    if (typeof window !== 'undefined') window.waitDialogFileId = null;
    // Nach dem Schließen zur Sicherheit den Dubbing-Status aller Dateien prüfen
    // So werden neu importierte Dateien auch dann erkannt, wenn das Watcher-Event
    // vor dem Öffnen des Dialogs ausgelöst wurde
    updateDubStatusForFiles();
}

// Kopiert einen Ordnernamen in die Zwischenablage (nur letzter Pfadteil)
async function copyFolderName(folder) {
    if (!folder) return;
    try {
        const base = folder.split(/[\\/]/).pop();
        if (await safeCopy(base)) {
            updateStatus('Ordner kopiert: ' + base);
        }
    } catch (err) {
        console.error('Kopieren fehlgeschlagen:', err);
    }
}

// Kopiert den Ordnernamen erneut in die Zwischenablage
async function copyDownloadFolder() {
    const file = files.find(f => f.id === waitDialogFileId);
    if (!file || !file.folder) return;
    await copyFolderName(file.folder);
}

// Öffnet die neue Dubbing-Seite und zeigt einen Hinweis mit Download-Pfad an
async function openStudioAndWait(dubId) {
    const url = `https://elevenlabs.io/v1/dubbing/${dubId}`;
    // Wenn moeglich, externen Browser nutzen, um kein neues Electron-Fenster
    // zu oeffnen
    if (window.electronAPI && window.electronAPI.openExternal) {
        await window.electronAPI.openExternal(url);
    } else {
        window.open(url, '_blank');
    }

    // Pfad aus Electron abrufen, falls verfügbar
    let dlPath = 'Download';
    if (window.electronAPI && window.electronAPI.getDownloadPath) {
        dlPath = await window.electronAPI.getDownloadPath();
    }

    studioModal = ui.showModal(`
        <h3>Studio geöffnet</h3>
        <p>Generiere die deutsche Spur,
        lade die WAV herunter und lege sie in
        <code>${dlPath}</code>.</p>
        <p>Das Tool erkennt die Datei automatisch.</p>
    `);

    const currentItem = files.find(f => f.dubbingId === dubId);
    if (currentItem) {
        currentItem.waitingForManual = true;
        ui.setActiveDubItem(currentItem);
        renderFileTable();
        saveCurrentProject();
    }
}

// Schließt das Studio-Hinweisfenster, falls vorhanden
function closeStudioModal() {
    if (studioModal) {
        studioModal.remove();
        studioModal = null;
    }
}

// Wird aufgerufen, wenn der gelbe Status-Punkt angeklickt wird
function dubStatusClicked(fileId) {
    const file = files.find(f => f.id === fileId);
    if (!file || !file.dubbingId || file.dubReady) return;
    openStudioAndWait(file.dubbingId);
}

// Hilfsfunktion für das Manual Dubbing
// Wandelt Millisekunden in Sekundenwerte mit drei Nachkommastellen um
function msToSeconds(ms) {
    const seconds = Math.max(0, ms) / 1000;
    return seconds.toFixed(3);
}

// Erstellt eine CSV-Zeile für das Manual Dubbing
function createDubbingCSV(file, durationMs, lang = 'de') {
    // Prüfen, ob beide Texte vorhanden sind
    let translation;
    if (lang === 'emo') translation = file.emotionalText;
    else translation = file[`${lang}Text`] || file.deText;
    if (!file.enText || !translation) {
        addDubbingLog('Übersetzung fehlt');
        return null;
    }
    // Kopfzeile wird immer vorangestellt
    const lineEnd = csvLineEnding === 'CRLF' ? '\r\n' : '\n';
    const header = 'speaker,start_time,end_time,transcription,translation' + lineEnd;
    const esc = t => '"' + String(t || '').replace(/"/g, '""') + '"';
    const startTime = msToSeconds(file.trimStartMs || 0);
    let endTime = '';
    if (typeof durationMs === 'number') {
        const endMs = durationMs - (file.trimEndMs || 0);
        endTime = msToSeconds(endMs);
    } else {
        endTime = msToSeconds(file.trimEndMs || 0);
    }
    const row = ['0', startTime, endTime, esc(file.enText), esc(translation)].join(',');
    // CSV-Zeile mit Zeilenende abschließen
    let csv = header + row + lineEnd;
    // Sicherheitshalber prüfen, ob ein Zeilenumbruch vorhanden ist
    if (!csv.endsWith('\n')) csv += '\n';
    // CSV-Blob jetzt mit UTF-8-Kodierung erzeugen
    return new Blob([csv], { type: 'text/csv;charset=utf-8' });
}

// Prüft den Aufbau einer CSV-Datei für Manual Dub
// Zerlegt einen CSV-Text in Zeilen, wobei Zeilenumbrüche in Anführungszeichen
// ignoriert werden
function splitCsvLines(text) {
    const lines = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {
            if (inQuotes && text[i + 1] === '"') {
                current += '""';
                i++;
            } else {
                current += '"';
                inQuotes = !inQuotes;
            }
        } else if ((c === '\n' || c === '\r') && !inQuotes) {
            if (c === '\r' && text[i + 1] === '\n') i++;
            lines.push(current);
            current = '';
        } else {
            current += c;
        }
    }
    if (current.length > 0) lines.push(current);
    return lines.filter(l => l.length > 0);
}

// Prüft den Aufbau einer CSV-Datei für Manual Dub
function validateCsv(csvText) {
    // Zeilen aufteilen (Leerzeilen ignorieren)
    const lines = splitCsvLines(csvText.trim());
    if (lines.length < 2) return false;
    // Kopfzeile muss exakt passen
    if (lines[0].trim() !== 'speaker,start_time,end_time,transcription,translation') {
        return false;
    }
    // Jede weitere Zeile muss genau 5 Spalten besitzen
    for (let i = 1; i < lines.length; i++) {
        const cells = lines[i].match(/(?:"(?:[^"]|"")*"|[^,]+)/g) || [];
        if (cells.length !== 5) return false;
    }
    return true;
}
// =========================== SHOWDUBBINGSETTINGS END ========================


// =========================== STARTDUBBING START =============================
// Startet ElevenLabs-Dubbing für eine Datei und speichert das Ergebnis
async function startDubbing(fileId, settings = {}, targetLang = 'de', mode = 'beta') {
    const useEmo = targetLang === 'emo';
    const apiLang = 'de';
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    if (mode === 'manual') {
        await copyFolderName(file.folder);
    }
    // Ordnerspezifische Voice-ID ermitteln
    const folderVoiceId = folderCustomizations[file.folder]?.voiceId;
    // Log zu Beginn leeren
    dubbingLogMessages = [];
    const logPre = document.getElementById('dubbingLog');
    if (logPre) logPre.textContent = '';
    openDubbingLog();
    addDubbingLog(`Starte Dubbing für ${file.filename}`);
    if (!elevenLabsApiKey) {
        updateStatus('API-Key fehlt');
        addDubbingLog('API-Key fehlt');
        return;
    }

    const audioInfo = findAudioInFilePathCache(file.filename, file.folder);
    if (!audioInfo) {
        updateStatus('EN-Datei nicht gefunden');
        addDubbingLog('EN-Datei nicht gefunden');
        return;
    }

    let audioBlob;
    if (typeof audioInfo.audioFile === 'string') {
        try {
            const resp = await fetch(audioInfo.audioFile);
            if (!resp.ok) {
                const errText = await resp.text();
                updateStatus('EN-Datei nicht ladbar');
                addDubbingLog(`EN-Datei nicht ladbar: ${resp.status} ${errText}`);
                return;
            }
            audioBlob = await resp.blob();
            addDubbingLog('EN-Datei geladen');
        } catch (e) {
            addDubbingLog('Fehler: ' + e.message);
            updateStatus('EN-Datei nicht ladbar');
            return;
        }
    } else {
        audioBlob = audioInfo.audioFile;
        addDubbingLog('EN-Datei aus Cache geladen');
    }

    // Dauer der Audiodatei bestimmen
    const buffer = await loadAudioBuffer(audioBlob);
    const durationMs = buffer.length / buffer.sampleRate * 1000;

    // FormData für das Dubbing zusammenstellen
    const form = new FormData();
    form.append('file', audioBlob, file.filename);
    // Zielsprachen sowohl einzeln als auch als Liste übergeben
    form.append('target_lang', apiLang);
    form.append('target_languages', JSON.stringify([apiLang]));
    form.append('mode', 'manual');
    form.append('dubbing_studio', 'true');
    const csvBlob = createDubbingCSV(file, durationMs, targetLang);
    if (!csvBlob) {
        updateStatus('Übersetzung fehlt');
        addDubbingLog('Übersetzung fehlt');
        return;
    }
    // CSV-Text für Log und Fehlerausgabe zwischenspeichern
    const csvText = await csvBlob.text();
    addDubbingLog('CSV-Text: ' + csvText);
    // Vor dem Upload die CSV-Struktur prüfen
    if (!validateCsv(csvText)) {
        addDubbingLog('Ungültige CSV');
        return;
    }
    form.append('csv_file', csvBlob, 'input.csv');
    // 🟢 Neue Funktion: gewünschte Voice-Settings übermitteln
    if (settings && Object.keys(settings).length > 0) {
        form.append('voice_settings', JSON.stringify(settings));
    }
    // Bei vorhandener Ordner-Stimme Voice-ID übergeben und Voice Cloning abschalten
    const selectedVoiceId = (folderVoiceId || '').trim();
    if (selectedVoiceId) {
        form.append('voice_id', selectedVoiceId);
        form.append('disable_voice_cloning', 'true');
    }

    addDubbingLog(`POST ${API}/dubbing`);
    let res;
    try {
        res = await fetch(`${API}/dubbing`, {
            method: 'POST',
            headers: { 'xi-api-key': elevenLabsApiKey },
            body: form
        });
        logApiCall('POST', `${API}/dubbing`, res.status);
    } catch (e) {
        addDubbingLog('Fehler: ' + e.message);
        updateStatus('Dubbing fehlgeschlagen');
        return;
    }
    const resText = await res.text();
    addDubbingLog(`Antwort (${res.status}): ${resText}`);
    if (!res.ok) {
        let errorMsg = resText;
        try {
            const js = JSON.parse(resText);
            if (js.detail && js.detail.message) {
                errorMsg = js.detail.message;
            }
        } catch {}
        addDubbingLog(`Fehler: ${errorMsg}`);
        updateStatus('Dubbing fehlgeschlagen');
        showToast(errorMsg, 'error');
        addDubbingLog(`Dubbing fehlgeschlagen: ${res.status} ${resText}`);
        // Bei HTTP 400 den Anfang der CSV ausgeben
        if (res.status === 400) {
            addDubbingLog('CSV-Ausschnitt: ' + csvText.slice(0, 200));
        }
        return;
    }
    const data = JSON.parse(resText);
    // Vollständige Server-Antwort ausgeben
    addDubbingLog('Server-Antwort: ' + JSON.stringify(data));
    const id = data.dubbing_id || data.id;
    if (!id) {
        updateStatus('Keine Dubbing-ID erhalten');
        addDubbingLog('Keine Dubbing-ID erhalten');
        return;
    }

    addDubbingLog(`Dubbing-ID erhalten: ${id}`);

    // Dubbing-ID sofort merken und anzeigen
    if (useEmo) {
        file.emoDubbingId = id;
        file.emoDubReady = false;
    } else {
        file.dubbingId = id;
        file.dubReady = false;
    }
    saveCurrentProject();
    renderFileTable();

    // Hauptprozess über neuen Job informieren
    if (window.electronAPI && window.electronAPI.sendDubStart) {
        // Modus mitgeben, damit der Hauptprozess Beta- und manuelle Jobs unterscheiden kann
        window.electronAPI.sendDubStart({ id, fileId: file.id, relPath: getFullPath(file), mode });
    }

    if (mode === 'manual') {
        showToast('Alles gesendet. Bitte Datei in Download legen.');
        const currentItem = file;
        currentItem.waitingForManual = true;
        ui.setActiveDubItem(currentItem);
        renderFileTable();
        // Seite zum erzeugten Dubbing automatisch im Browser öffnen
        await openStudioAndWait(id);
        await showDownloadWaitDialog(file.id, id);
        return;
    }

    try {
        await renderLanguage(id);
        const url = await pollRender(id);
        const dubbedBlob = await fetch(url).then(r => r.blob());
        const relPath = getFullPath(file);
        // Vor dem Speichern prüfen, ob bereits eine DE-Datei existiert
        const vorhandene = getDeFilePath(file);
        if (window.electronAPI && window.electronAPI.saveDeFile) {
            const buffer = await dubbedBlob.arrayBuffer();
            await window.electronAPI.saveDeFile(relPath, new Uint8Array(buffer));
            deAudioCache[relPath] = `sounds/DE/${relPath}`;
            await updateHistoryCache(relPath);
        } else {
            await speichereUebersetzungsDatei(dubbedBlob, relPath);
        }
        // Versionsnummer erhöhen, falls eine Datei ersetzt wurde
        if (vorhandene) {
            file.version = (file.version || 1) + 1;
        }
        if (useEmo) {
            file.emoDubReady = true;
        } else {
            file.dubReady = true;
        }
        // Bearbeitungs-Status zurücksetzen, da es sich um eine neue Datei handelt
        file.trimStartMs = 0;
        file.trimEndMs = 0;
        file.volumeMatched = false;
        file.radioEffect = false;
        file.hallEffect = false;
        file.emiEffect = false;
        updateStatus('Download abgeschlossen');
        showToast('Auto-Download erfolgreich.');
        addDubbingLog('Auto-Download erfolgreich');
        renderFileTable();
    } catch (e) {
        if (e.message === 'BETA_LOCKED') {
            showToast('Kein Beta-Zugang – bitte Studio nutzen & Datei in Download-Ordner legen.');
            await openStudioAndWait(id);
        } else {
            addDubbingLog('Fehler: ' + e.message);
            showToast('Fehler beim Auto-Download: ' + e.message, 'error');
        }
    }
}

// =========================== STARTEMODUBBING START ==========================
// Erstellt eine emotionale Spur über Text-to-Speech V3
async function startEmoDubbing(fileId, settings = {}) {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    if (!elevenLabsApiKey) {
        updateStatus('API-Key fehlt');
        return;
    }
    const voiceId = folderCustomizations[file.folder]?.voiceId;
    const text = (file.emotionalText || '').trim();
    if (!voiceId || !text) {
        updateStatus('Voice oder Text fehlt');
        return;
    }
    dubbingLogMessages = [];
    const logPre = document.getElementById('dubbingLog');
    if (logPre) logPre.textContent = '';
    openDubbingLog();
    addDubbingLog(`Starte Emo-Dubbing für ${file.filename}`);

    const body = {
        text,
        // Nur der neue V3-Endpunkt nutzt dieses Model
        model_id: 'eleven_v3',
        voice_settings: settings
    };

    addDubbingLog(`POST ${API}/text-to-speech/${voiceId}/stream`);
    let res;
    try {
        res = await fetch(`${API}/text-to-speech/${voiceId}/stream`, {
            method: 'POST',
            headers: {
                'xi-api-key': elevenLabsApiKey,
                'Content-Type': 'application/json',
                'Accept': 'audio/mpeg'
            },
            body: JSON.stringify(body)
        });
        logApiCall('POST', `${API}/text-to-speech/${voiceId}/stream`, res.status);
    } catch (err) {
        addDubbingLog('Fehler: ' + err.message);
        updateStatus('Emo-Dubbing fehlgeschlagen');
        return;
    }
    if (!res.ok) {
        const txt = await res.text();
        addDubbingLog(txt);
        updateStatus('Emo-Dubbing fehlgeschlagen');
        return;
    }

    const buffer = await res.arrayBuffer();
    const id = res.headers.get('x-request-id') || Date.now().toString();
    const relPath = getFullPath(file);
    const cleanPath = relPath.replace(/^([\\/]*sounds[\\/])?de[\\/]/i, '');
    const vorhandene = getDeFilePath(file);

    if (window.electronAPI && window.electronAPI.saveDeFile) {
        await window.electronAPI.saveDeFile(relPath, new Uint8Array(buffer));
        deAudioCache[cleanPath] = `sounds/DE/${relPath}`;
        await updateHistoryCache(cleanPath);
    } else {
        await speichereUebersetzungsDatei(new Blob([buffer]), relPath);
    }
    if (vorhandene) file.version = (file.version || 1) + 1;
    file.emoDubbingId = id;
    file.emoDubReady = true;
    file.trimStartMs = 0;
    file.trimEndMs = 0;
    file.volumeMatched = false;
    file.radioEffect = false;
    file.emiEffect = false;
    updateStatus('Emo-Download abgeschlossen');
    renderFileTable();
    saveCurrentProject();
    addDubbingLog('Fertig.');
}
// =========================== STARTEMODUBBING END ============================
// =========================== STARTDUBBING END ===============================

// =========================== ISDUBREADY START ===============================
// Prüft, ob eine Dub-Datei fertig ist
async function isDubReady(id, lang = 'de') {
    const hdr = { headers: { 'xi-api-key': elevenLabsApiKey } };
    const metaRes = await fetch(`${API}/dubbing/${id}`, hdr);
    logApiCall('GET', `${API}/dubbing/${id}`, metaRes.status);
    if (!metaRes.ok) return false;
    const meta = await metaRes.json();
    return meta.status === 'dubbed' && (meta.target_languages || []).includes(lang);
}
// =========================== ISDUBREADY END =================================

// =========================== REDOWNLOADDUBBING START ========================
// Lädt bereits erzeugtes Dubbing mithilfe der gespeicherten ID erneut herunter
async function redownloadDubbing(fileId, mode = 'beta', lang = 'de') {
    const file = files.find(f => f.id === fileId);
    const useEmo = lang === 'emo';
    const dubId = useEmo ? file.emoDubbingId : file.dubbingId;
    if (!file || !dubId) return;
    if (mode === 'manual') {
        await copyFolderName(file.folder);
    }
    // Log zu Beginn leeren
    dubbingLogMessages = [];
    const logPre = document.getElementById('dubbingLog');
    if (logPre) logPre.textContent = '';
    openDubbingLog();
    addDubbingLog(`Lade Dubbing ${dubId} erneut`);
    if (mode === 'manual') {
        showToast('Bitte Spur manuell generieren und in den Download-Ordner legen.');
        await openStudioAndWait(dubId);
        await showDownloadWaitDialog(file.id, dubId);
        return;
    }

    if (!elevenLabsApiKey) {
        updateStatus('API-Key fehlt');
        addDubbingLog('API-Key fehlt');
        return;
    }

    if (!(await isDubReady(dubId))) {
        alert('Deutsch noch nicht fertig – erst im Studio generieren!');
        return;
    }

    const audioRes = await fetch(`${API}/dubbing/${dubId}/audio/de`, {
        headers: { 'xi-api-key': elevenLabsApiKey }
    });
    logApiCall('GET', `${API}/dubbing/${dubId}/audio/de`, audioRes.status);
    if (!audioRes.ok) {
        const errText = await audioRes.text();
        updateStatus('Download fehlgeschlagen');
        addDubbingLog(errText);
        if (errText.includes('dubbing_not_found')) {
            const msg = 'Spur manuell generieren oder Beta freischalten';
            showToast(msg, 'error');
            addDubbingLog(msg);
        }
        return;
    }
    const dubbedBlob = await audioRes.blob();
    const relPath = getFullPath(file);
    // Prüfen, ob bereits eine Datei vorhanden ist
    const vorhandene = getDeFilePath(file);
    if (window.electronAPI && window.electronAPI.saveDeFile) {
        const buffer = await dubbedBlob.arrayBuffer();
        await window.electronAPI.saveDeFile(relPath, new Uint8Array(buffer));
        // Bereinigter Pfad vermeidet doppelte Schlüssel im Cache
        deAudioCache[cleanPath] = `sounds/DE/${relPath}`;
        await updateHistoryCache(cleanPath);
        addDubbingLog('Datei in Desktop-Version gespeichert');
    } else {
        await speichereUebersetzungsDatei(dubbedBlob, relPath);
        addDubbingLog('Datei im Browser gespeichert');
    }
    // Versionsnummer erhöhen, falls die alte Datei ersetzt wurde
    if (vorhandene) {
        file.version = (file.version || 1) + 1;
    }
    if (useEmo) {
        file.emoDubReady = true; // Nach erneutem Download fertig
    } else {
        file.dubReady = true; // Nach erneutem Download fertig
    }
    // Bearbeitungs-Status zurücksetzen, da eine frische Datei geladen wurde
    file.trimStartMs = 0;
    file.trimEndMs = 0;
    file.volumeMatched = false;
    file.radioEffect = false;
    file.hallEffect = false;
    file.emiEffect = false;
    updateStatus('Download abgeschlossen');
    addDubbingLog('Fertig.');
    renderFileTable();
    saveCurrentProject();
}

// =========================== REDOWNLOADEMO START ============================
// Lädt eine emotionale Audiodatei über die History-ID
async function redownloadEmo(fileId) {
    const file = files.find(f => f.id === fileId);
    if (!file || !file.emoDubbingId) return;
    if (!elevenLabsApiKey) {
        updateStatus('API-Key fehlt');
        return;
    }
    dubbingLogMessages = [];
    const logPre = document.getElementById('dubbingLog');
    if (logPre) logPre.textContent = '';
    openDubbingLog();
    addDubbingLog(`Lade Emo-Dubbing ${file.emoDubbingId} erneut`);
    const res = await fetch(`${API}/history/${file.emoDubbingId}/audio`, {
        headers: { 'xi-api-key': elevenLabsApiKey }
    });
    logApiCall('GET', `${API}/history/${file.emoDubbingId}/audio`, res.status);
    if (!res.ok) {
        const txt = await res.text();
        addDubbingLog(txt);
        updateStatus('Download fehlgeschlagen');
        return;
    }
    const blob = await res.blob();
    const relPath = getFullPath(file);
    const cleanPath = relPath.replace(/^([\\/]*sounds[\\/])?de[\\/]/i, '');
    const vorhandene = getDeFilePath(file);
    if (window.electronAPI && window.electronAPI.saveDeFile) {
        const buf = await blob.arrayBuffer();
        await window.electronAPI.saveDeFile(relPath, new Uint8Array(buf));
        deAudioCache[cleanPath] = `sounds/DE/${relPath}`;
        await updateHistoryCache(cleanPath);
    } else {
        await speichereUebersetzungsDatei(blob, relPath);
    }
    if (vorhandene) file.version = (file.version || 1) + 1;
    file.emoDubReady = true;
    file.trimStartMs = 0;
    file.trimEndMs = 0;
    file.volumeMatched = false;
    file.radioEffect = false;
    file.emiEffect = false;
    updateStatus('Download abgeschlossen');
    addDubbingLog('Fertig.');
    renderFileTable();
    saveCurrentProject();
}
// =========================== REDOWNLOADEMO END ==============================
// =========================== OPENDUBBINGPAGE START ==========================
// Öffnet die Dubbing-Seite von ElevenLabs für die gespeicherte ID
function openDubbingPage(fileId, lang = 'de') {
    const file = files.find(f => f.id === fileId);
    const id = lang === 'emo' ? file.emoDubbingId : file.dubbingId;
    if (!file || !id) return;
    // Direkt zum passenden Endpunkt springen
    const url = lang === 'emo'
        ? `https://elevenlabs.io/history/${id}`
        : `https://elevenlabs.io/v1/dubbing/${id}`;
    if (window.electronAPI && window.electronAPI.openExternal) {
        window.electronAPI.openExternal(url);
    } else {
        window.open(url, '_blank');
    }
}
// Öffnet eine lokale Datei über den IPC-Kanal
function openLocalFile(rel) {
    if (!debugInfo.projectRoot) return;
    const abs = window.electronAPI.join(debugInfo.projectRoot, rel);
    if (window.electronAPI && window.electronAPI.openPath) {
        window.electronAPI.openPath(abs);
    } else if (window.electronAPI && window.electronAPI.openExternal) {
        window.electronAPI.openExternal('file://' + abs);
    } else {
        window.open('file://' + abs, '_blank');
    }
}

// Startet den Playwright-Ablauf im Hauptprozess
function startDubAutomation(fileId, lang = 'de') {
    const file = files.find(f => f.id === fileId);
    const id = lang === 'emo' ? file.emoDubbingId : file.dubbingId;
    if (!file || !id || !window.electronAPI || !window.electronAPI.autoDub) return;
    const folder = file.folder || '';
    window.electronAPI.autoDub({ id, folder });
}
// =========================== OPENDUBBINGPAGE END ============================

// =========================== DOWNLOADDE START ===============================
// Lädt die fertige DE-Audiodatei ohne Protokoll herunter
async function downloadDe(fileId, lang = 'de') {
    const file = files.find(f => f.id === fileId);
    const useEmo = lang === 'emo';
    const dubId = useEmo ? file.emoDubbingId : file.dubbingId;
    if (!file || !dubId) return;
    if (!elevenLabsApiKey) {
        updateStatus('API-Key fehlt');
        return;
    }
    if (!(await isDubReady(dubId))) {
        alert('Deutsch noch nicht fertig – erst im Studio generieren!');
        return;
    }
    const blob = await downloadDubbingAudio(elevenLabsApiKey, dubId, 'de');
    const relPath = getFullPath(file);
    // Existiert bereits eine DE-Datei, soll die Version steigen
    const vorhandene = getDeFilePath(file);
    if (window.electronAPI && window.electronAPI.saveDeFile) {
        const buffer = await blob.arrayBuffer();
        await window.electronAPI.saveDeFile(relPath, new Uint8Array(buffer));
        // Bereinigter Pfad vermeidet doppelte Schlüssel im Cache
        deAudioCache[cleanPath] = `sounds/DE/${relPath}`;
        await updateHistoryCache(cleanPath);
    } else {
        await speichereUebersetzungsDatei(blob, relPath);
    }
    if (vorhandene) {
        file.version = (file.version || 1) + 1;
    }
    if (useEmo) {
        file.emoDubReady = true; // Status auf fertig setzen
    } else {
        file.dubReady = true; // Status auf fertig setzen
    }
    // Bearbeitungs-Status zurücksetzen, da eine neue Datei gespeichert wurde
    file.trimStartMs = 0;
    file.trimEndMs = 0;
    file.volumeMatched = false;
    file.radioEffect = false;
    file.hallEffect = false;
    file.emiEffect = false;
    updateStatus('Deutsche Audiodatei gespeichert.');
    renderFileTable();
    saveCurrentProject();
}
// =========================== DOWNLOADDE END =================================
// =========================== REDOWNLOADDUBBING END ==========================

if (typeof module !== 'undefined' && module.exports) {
    // Exporte für Node-Umgebung (z.B. Tests)
    module.exports = {
        getDefaultVoiceSettings,
        showDubbingSettings,
        showEmoDubbingSettings,
        closeDubbingSettings,
        closeEmoDubbingSettings,
        bindDubSettingListeners,
        confirmDubbingSettings,
        confirmEmoDubbingSettings,
        resetStoredVoiceSettings,
        toggleDubAdvanced,
        openDubTooltip,
        closeDubTooltip,
        escCloseDubTooltip,
        playDubPreview,
        showStudioOverlay,
        closeStudioOverlay,
        showDownloadWaitDialog,
        updateDownloadWaitDialog,
        closeDownloadWaitDialog,
        copyFolderName,
        copyDownloadFolder,
        openStudioAndWait,
        dubStatusClicked,
        msToSeconds,
        createDubbingCSV,
        splitCsvLines,
        validateCsv,
        startDubbing,
        startEmoDubbing,
        isDubReady,
        redownloadDubbing,
        redownloadEmo,
        openDubbingPage,
        openLocalFile,
        startDubAutomation,
        downloadDe,
        waitDialogFileId
    };
}
// Funktionen auch im Browser global verfügbar machen
if (typeof window !== 'undefined') {
    window.getDefaultVoiceSettings = getDefaultVoiceSettings;
    window.showDubbingSettings = showDubbingSettings;
    window.showEmoDubbingSettings = showEmoDubbingSettings;
    window.closeDubbingSettings = closeDubbingSettings;
    window.closeEmoDubbingSettings = closeEmoDubbingSettings;
    window.bindDubSettingListeners = bindDubSettingListeners;
    window.confirmDubbingSettings = confirmDubbingSettings;
    window.confirmEmoDubbingSettings = confirmEmoDubbingSettings;
    window.resetStoredVoiceSettings = resetStoredVoiceSettings;
    window.toggleDubAdvanced = toggleDubAdvanced;
    window.openDubTooltip = openDubTooltip;
    window.closeDubTooltip = closeDubTooltip;
    window.escCloseDubTooltip = escCloseDubTooltip;
    window.playDubPreview = playDubPreview;
    window.showStudioOverlay = showStudioOverlay;
    window.closeStudioOverlay = closeStudioOverlay;
    window.showDownloadWaitDialog = showDownloadWaitDialog;
    window.updateDownloadWaitDialog = updateDownloadWaitDialog;
    window.closeDownloadWaitDialog = closeDownloadWaitDialog;
    window.copyFolderName = copyFolderName;
    window.copyDownloadFolder = copyDownloadFolder;
    window.openStudioAndWait = openStudioAndWait;
    window.dubStatusClicked = dubStatusClicked;
    window.msToSeconds = msToSeconds;
    window.createDubbingCSV = createDubbingCSV;
    window.splitCsvLines = splitCsvLines;
    window.validateCsv = validateCsv;
    window.startDubbing = startDubbing;
    window.startEmoDubbing = startEmoDubbing;
    window.isDubReady = isDubReady;
    window.redownloadDubbing = redownloadDubbing;
    window.redownloadEmo = redownloadEmo;
    window.openDubbingPage = openDubbingPage;
    window.openLocalFile = openLocalFile;
    window.startDubAutomation = startDubAutomation;
    window.downloadDe = downloadDe;
    window.waitDialogFileId = waitDialogFileId;
}
