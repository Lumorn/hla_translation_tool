let systemPrompt = '';
let promptReady;

// Liefert den geladenen System-Prompt
function getSystemPrompt() {
    return systemPrompt;
}

if (typeof window !== 'undefined' && typeof fetch === 'function') {
    // Im Browser: Prompt per Fetch laden
    const url = '../prompts/gpt_score.txt';
    promptReady = fetch(url)
        .then(r => r.ok ? r.text() : '')
        .then(t => { systemPrompt = t.trim(); })
        .catch(() => { systemPrompt = ''; });
} else {
    // Unter Node: Prompt direkt von der Festplatte lesen
    const fs = require('fs');
    const path = require('path');
    try {
        const localPath = path.join(__dirname, '..', 'prompts', 'gpt_score.txt');
        const rootPath  = path.join(__dirname, '..', '..', 'prompts', 'gpt_score.txt');
        const filePath  = fs.existsSync(localPath) ? localPath : rootPath;
        systemPrompt = fs.readFileSync(filePath, 'utf8').trim();
    } catch (e) {
        console.error('Prompt konnte nicht geladen werden', e);
    }
    promptReady = Promise.resolve();
}

// Bewertet eine Szene mit GPT und liefert ein Array
// [{id, score, comment, suggestion}]
async function evaluateScene({ scene, lines, key, model = 'gpt-4o-mini' }) {
    await promptReady;

    // Kosten grob abschaetzen (3 Tokens je Zeichen)
    const charCount = lines.reduce((s, l) =>
        s + (l.character || '').length + (l.en || '').length + (l.de || '').length, 0);
    const estimatedTokens = charCount * 3;
    if (estimatedTokens > 75000) {
        if (typeof window !== 'undefined' && window.showToast) {
            window.showToast(`Warnung: etwa ${estimatedTokens} Tokens`, 'error');
        } else {
            console.warn(`Warnung: etwa ${estimatedTokens} Tokens`);
        }
    }

    const results = [];
    const chunkSize = 250;
    let canceled = false;
    let ui = null;

    // Fortschrittsdialog mit Loganzeige nur im Browser
    if (typeof document !== 'undefined') {
        ui = createProgressDialog(lines.length);
        ui.cancelBtn.onclick = () => { canceled = true; ui.overlay.remove(); };
    }

    for (let i = 0; i < lines.length && !canceled; i += chunkSize) {
        const chunk = lines.slice(i, i + chunkSize);
        if (ui) updateProgressDialog(ui, i, lines.length);
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: JSON.stringify({ scene, lines: chunk }) }
        ];
        const reqText = JSON.stringify({ model, messages });
        if (typeof window !== 'undefined' && window.debugLog) {
            window.debugLog('[GPT REQUEST]', reqText);
        }
        console.log('[GPT REQUEST]', { model, messages });
        if (ui) appendGptLog(ui, '>> ' + reqText);
        try {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + key
                },
                body: JSON.stringify({ model, messages, temperature: 0 })
            });
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            const data = await res.json();
            const arr = JSON.parse(data.choices[0].message.content);
            const resText = JSON.stringify(arr);
            if (typeof window !== 'undefined' && window.debugLog) {
                window.debugLog('[GPT RESPONSE]', resText);
            }
            console.log('[GPT RESPONSE]', arr);
            if (ui) appendGptLog(ui, '<< ' + resText);
            results.push(...arr);
        } catch (e) {
            if (ui) ui.overlay.remove();
            throw new Error('API-Fehler: ' + (e && e.message ? e.message : e));
        }
    }

    if (ui) ui.overlay.remove();
    if (canceled) throw new Error('Abgebrochen');
    return results;
}

function createProgressDialog(total) {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.innerHTML = `<div class="dialog gpt-progress">
        <div class="gpt-status" id="gptStatus">0 / ${total}</div>
        <pre class="gpt-console" id="gptConsole"></pre>
        <div class="progress-bar"><div class="progress-fill" id="gptFill"></div></div>
        <button id="gptCancelBtn">Abbrechen</button>
    </div>`;
    document.body.appendChild(overlay);
    const fill = overlay.querySelector('#gptFill');
    const status = overlay.querySelector('#gptStatus');
    const cancelBtn = overlay.querySelector('#gptCancelBtn');
    const consoleBox = overlay.querySelector('#gptConsole');
    return { overlay, fill, status, cancelBtn, console: consoleBox };
}

function updateProgressDialog(ui, done, total) {
    ui.status.textContent = `${done} / ${total}`;
    ui.fill.style.width = `${Math.round((done / total) * 100)}%`;
}

function appendGptLog(ui, text) {
    const log = ui.console;
    if (!log) return;
    log.textContent += text + '\n';
    log.scrollTop = log.scrollHeight;
}

// Prueft, ob der uebergebene API-Key gueltig ist
async function testKey(key) {
    try {
        const res = await fetch('https://api.openai.com/v1/models', {
            headers: { 'Authorization': 'Bearer ' + key }
        });
        return res.ok;
    } catch {
        return false;
    }
}

// Verfügbare Modelle vom Server laden, optional Cache verwenden
async function fetchModels(apiKey, ignoreCache = false) {
    if (!apiKey) throw new Error('API-Key fehlt');
    if (typeof window !== 'undefined' && window.electronAPI?.loadOpenaiModels && !ignoreCache) {
        try {
            const cache = await window.electronAPI.loadOpenaiModels();
            if (cache && Array.isArray(cache.data) && cache.time && Date.now() - cache.time < 86400000) {
                return cache.data;
            }
        } catch {}
    }
    const res = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': 'Bearer ' + apiKey }
    });
    if (!res.ok) {
        throw new Error(await res.text());
    }
    const json = await res.json();
    const models = json.data
        .filter(m => m.id && m.id.startsWith('gpt'))
        .map(m => ({ id: m.id, owned_by: m.owned_by }));
    if (typeof window !== 'undefined' && window.electronAPI?.saveOpenaiModels) {
        try { await window.electronAPI.saveOpenaiModels(models); } catch {}
    }
    return models;
}

// Kompatibilität für CommonJS
// Exporte für Node und Browser bereitstellen
if (typeof module !== 'undefined') {
    module.exports = { evaluateScene, testKey, fetchModels, getSystemPrompt };
}
if (typeof window !== 'undefined') {
    window.evaluateScene = evaluateScene;
    window.testGptKey = testKey;
    window.fetchGptModels = fetchModels;
    window.getSystemPrompt = getSystemPrompt;
}
