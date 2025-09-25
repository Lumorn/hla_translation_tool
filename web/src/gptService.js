let systemPrompt = '';
let emotionPrompt = '';
let promptReady;
// Merker, ob die Zeilen innerhalb eines Projekts fragmentiert sind
let restMode = false;
// Zwischenspeicher, um zu erkennen, welche Modelle den neuen Responses-Endpunkt benötigen
const responsesModelPattern = /^(gpt-4\.1|gpt-5)/i;

// Aktiviert oder deaktiviert den Reste-Modus
function setRestMode(flag) {
    restMode = !!flag;
    if (typeof window !== 'undefined') {
        window.restTranslationFlag = restMode;
    }
}

// Bereits gesetzten Zustand aus dem Fenster übernehmen
if (typeof window !== 'undefined' && typeof window.restTranslationFlag !== 'undefined') {
    restMode = !!window.restTranslationFlag;
}

// Entfernt Codeblock-Markierungen und prüft grob auf JSON
function sanitizeJSONResponse(content) {
    if (typeof content !== 'string') return content;
    let text = content.trim();
    if (text.startsWith('```')) {
        text = text.replace(/^```[a-zA-Z0-9]*\s*/, '').replace(/```\s*$/, '');
    }
    text = text.trim();
    if (!text.startsWith('[') && !text.startsWith('{')) {
        console.warn('Unerwartetes Antwortformat', text.slice(0, 30));
    }
    return text;
}

// Prüft, ob ein Modell den neuen Responses-Endpunkt benötigt
function usesResponsesEndpoint(model) {
    return responsesModelPattern.test(model || '');
}

// Wandelt Chat-Nachrichten in das Responses-Format um
function toResponsesInput(messages) {
    return messages.map(msg => ({
        role: msg.role,
        content: [{ type: 'input_text', text: msg.content }]
    }));
}

// Extrahiert den eigentlichen Antworttext aus beiden API-Varianten
function extractAssistantText(data) {
    if (data?.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
    }
    if (typeof data?.output_text === 'string' && data.output_text.trim().length > 0) {
        return data.output_text;
    }
    if (Array.isArray(data?.output)) {
        for (const item of data.output) {
            if (!item || !Array.isArray(item.content)) continue;
            for (const entry of item.content) {
                if (typeof entry?.text === 'string' && entry.text.trim().length > 0) {
                    return entry.text;
                }
            }
        }
    }
    throw new Error('Antwort enthielt keinen Text');
}

// Sendet eine Anfrage an die passende OpenAI-API und liefert den Antworttext
async function requestAssistantText({ messages, key, model, temperature = 0, retries = 5 }) {
    const useResponses = usesResponsesEndpoint(model);
    const url = useResponses
        ? 'https://api.openai.com/v1/responses'
        : 'https://api.openai.com/v1/chat/completions';
    const payload = useResponses
        ? { model, input: toResponsesInput(messages), temperature }
        : { model, messages, temperature };
    const response = await queuedFetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + key
        },
        body: JSON.stringify(payload)
    }, retries);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return extractAssistantText(data);
}

// Liefert den geladenen System-Prompt
function getSystemPrompt() {
    return systemPrompt;
}

if (typeof window !== 'undefined' && typeof fetch === 'function') {
    // Im Browser: Prompts per Fetch laden
    const urlScore = '../prompts/gpt_score.txt';
    const urlEmo   = '../prompts/gpt_emotions.txt';
    promptReady = Promise.all([
        fetch(urlScore).then(r => r.ok ? r.text() : ''),
        fetch(urlEmo).then(r => r.ok ? r.text() : '')
    ]).then(([score, emo]) => {
        systemPrompt  = score.trim();
        emotionPrompt = emo.trim();
    }).catch(() => { systemPrompt = ''; emotionPrompt = ''; });
} else {
    // Unter Node: Prompts direkt von der Festplatte lesen
    const fs = require('fs');
    const path = require('path');
    try {
        const scoreLocal = path.join(__dirname, '..', 'prompts', 'gpt_score.txt');
        const scoreRoot  = path.join(__dirname, '..', '..', 'prompts', 'gpt_score.txt');
        const emoLocal   = path.join(__dirname, '..', 'prompts', 'gpt_emotions.txt');
        const emoRoot    = path.join(__dirname, '..', '..', 'prompts', 'gpt_emotions.txt');
        const scorePath  = fs.existsSync(scoreLocal) ? scoreLocal : scoreRoot;
        const emoPath    = fs.existsSync(emoLocal) ? emoLocal : emoRoot;
        systemPrompt  = fs.readFileSync(scorePath, 'utf8').trim();
        emotionPrompt = fs.readFileSync(emoPath, 'utf8').trim();
    } catch (e) {
        console.error('Prompt konnte nicht geladen werden', e);
    }
    promptReady = Promise.resolve();
}

// *** Einfache Warteschlange, um API-Aufrufe zu drosseln ***
const queue = [];
let queueActive = false;
// Merkt alle aktiven AbortController, damit laufende Anfragen abgebrochen werden können
const controllers = new Set();

// Startet den nächsten Eintrag der Warteschlange
async function processQueue() {
    if (queue.length === 0) { queueActive = false; return; }
    queueActive = true;
    const job = queue.shift();
    try {
        const res = await fetchWithRetry(job.url, job.options, job.retries);
        job.resolve(res);
    } catch (e) {
        // Bei Abbruch deutliche Warnung ausgeben
        if (e && e.name === 'AbortError') {
            console.warn('GPT-Anfrage abgebrochen', job.url);
        }
        job.reject(e);
    } finally {
        controllers.delete(job.controller);
    }
    setTimeout(processQueue, 1000); // kleine Pause zwischen den Anfragen
}

// Legt einen Aufruf in die Warteschlange und gibt ein Promise zurück
function queuedFetch(url, options = {}, retries = 5) {
    return new Promise((resolve, reject) => {
        const controller = new AbortController();
        controllers.add(controller);
        const opts = { ...options, signal: controller.signal };
        queue.push({ url, options: opts, retries, resolve, reject, controller });
        if (!queueActive) processQueue();
    });
}

// Bricht alle laufenden und wartenden GPT-Anfragen ab
function cancelGptRequests(grund = 'Projektwechsel') {
    // Wartende Jobs mit einer Fehlermeldung ablehnen
    const wartend = queue.splice(0, queue.length);
    for (const job of wartend) {
        console.warn('Verwerfe GPT-Job wegen Abbruch:', job.url);
        job.reject(new Error('Abgebrochen: ' + grund));
    }
    // Laufende Fetches abbrechen
    const laufend = controllers.size;
    controllers.forEach(c => c.abort());
    controllers.clear();
    queueActive = false;
    if (wartend.length > 0 || laufend > 0) {
        console.warn(`Abbruch ausgelöst (${grund}).`);
    }
}

// Hilfsfunktion mit erweiterten Wiederholungen bei 429 oder 503
// Beachtet den Header "Retry-After" und nutzt exponentielles Backoff
async function fetchWithRetry(url, options, retries = 5) {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, options);
            if (res.ok || (res.status !== 429 && res.status !== 503)) {
                return res;
            }
            lastError = new Error('HTTP ' + res.status);
            // Vom Server empfohlene Wartezeit verwenden, falls vorhanden
            let retryAfter = parseInt(res.headers.get('retry-after'), 10);
            if (isNaN(retryAfter)) retryAfter = Math.pow(2, i); // 1,2,4,8,... Sekunden
            await new Promise(r => setTimeout(r, retryAfter * 1000));
            continue;
        } catch (e) {
            lastError = e;
            if (e.name === 'AbortError') break; // Bei Abbruch keine weiteren Versuche
        }
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
    throw lastError;
}

// Bewertet eine Szene mit GPT und liefert ein Array
// [{id, score, comment, suggestion}]
async function evaluateScene({ scene, lines, key, model = 'gpt-4o-mini', retries = 5, projectId }) {
    await promptReady;

    // Doppelte Zeilen zusammenfassen
    const uniqueLines = [];
    const map = new Map(); // key -> index in uniqueLines
    const link = [];       // Index in uniqueLines je Originalzeile
    for (const l of lines) {
        const key = `${l.en}\u0000${l.de}`;
        if (map.has(key)) {
            link.push(map.get(key));
        } else {
            map.set(key, uniqueLines.length);
            uniqueLines.push(l);
            link.push(uniqueLines.length - 1);
        }
    }

    // Kosten grob abschaetzen (3 Tokens je Zeichen)
    const charCount = uniqueLines.reduce((s, l) =>
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
        ui = createProgressDialog(uniqueLines.length);
        ui.cancelBtn.onclick = () => { canceled = true; ui.overlay.remove(); };
    }

    for (let i = 0; i < uniqueLines.length && !canceled; i += chunkSize) {
        const chunk = uniqueLines.slice(i, i + chunkSize);
        if (ui) updateProgressDialog(ui, i, uniqueLines.length);
        // Bei aktivem Reste-Modus Hinweis anhängen
        const sys = restMode
            ? systemPrompt + "\nHinweis: Die folgenden Zeilen sind Restbestände und stehen nicht in chronologischer Reihenfolge. Behandle jede Zeile unabhängig."
            : systemPrompt;
        const messages = [
            { role: 'system', content: sys },
            { role: 'user', content: JSON.stringify({ scene, lines: chunk }) }
        ];
        const endpoint = usesResponsesEndpoint(model) ? 'responses' : 'chat';
        const reqText = JSON.stringify({ endpoint, model, messages });
        if (typeof window !== 'undefined' && window.debugLog) {
            window.debugLog('[GPT REQUEST]', reqText);
        }
        console.log('[GPT REQUEST]', { endpoint, model, messages });
        if (ui) appendGptLog(ui, '>> ' + reqText);
        try {
            const raw = await requestAssistantText({ messages, key, model, temperature: 0, retries });
            const clean = sanitizeJSONResponse(raw);
            const arr = JSON.parse(clean);
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

    // Ergebnisse auf alle Originalzeilen übertragen
    const expanded = [];
    link.forEach((uIdx, i) => {
        const base = results[uIdx] || {};
        // projectId zur Ergebniszeile hinzufügen, damit nur passende Projekte Daten übernehmen
        expanded.push({ ...base, id: lines[i].id, projectId });
    });
    return expanded;
}

// Erzeugt einen emotional getaggten Text für eine Zeile unter Berücksichtigung des kompletten Szenenverlaufs
async function generateEmotionText({ meta, lines, targetPosition, key, model = 'gpt-4o-mini', retries = 5 }) {
    await promptReady;
    // Emotionstags müssen in Deutsch zurückgegeben werden und dürfen nie direkt aufeinander folgen
    const payload = {
        ...meta,
        lines,
        target_position: targetPosition,
        instructions: 'Analysiere die Szene und gib den Text komplett auf Deutsch zurück. Setze niemals zwei Emotionstags hintereinander und platziere jeden Tag direkt vor der passenden Textstelle. Schreibe alle Tags auf Deutsch.'
    };
    const emoSys = restMode
        ? emotionPrompt + "\nHinweis: Die folgenden Zeilen sind Restbestände und müssen nicht in chronologischer Reihenfolge stehen. Behandle jede Zeile für sich."
        : emotionPrompt;
    const messages = [
        { role: 'system', content: emoSys },
        { role: 'user', content: JSON.stringify(payload) }
    ];
    const raw = await requestAssistantText({ messages, key, model, temperature: 0, retries });
    const clean = sanitizeJSONResponse(raw);
    const obj = JSON.parse(clean);
    return obj;
}

// Passt den bestehenden Emotional-Text auf eine Ziel-Länge an
async function adjustEmotionText({ meta, lines, targetPosition, lengthSeconds, key, model = 'gpt-4o-mini', retries = 5 }) {
    await promptReady;
    const payload = {
        ...meta,
        lines,
        target_position: targetPosition,
        length_seconds: lengthSeconds,
        // Beim Kürzen sollen Abbrüche und Fülllaute erhalten bleiben
        instructions: `Analysiere die Szene und gib den Text komplett auf Deutsch zurück. Setze niemals zwei Emotionstags hintereinander und platziere jeden Tag direkt vor der passenden Textstelle. Schreibe alle Tags auf Deutsch. Kürze den Text so, dass die vorgelesene Länge ungefähr ${lengthSeconds.toFixed(2)} Sekunden beträgt und diese Dauer keinesfalls unterschreitet. Dabei darfst du Formulierungen ändern und unwichtige Details weglassen, solange die Aussage erhalten bleibt, der Stil des englischen Originals gewahrt bleibt und der Text natürlich klingt. Eigenheiten wie abgebrochene Sätze oder Fülllaute ("äh", "mh") aus dem englischen Original sollen sinngemäß erhalten bleiben. Beschreibe im Feld "reason" in einem Satz, wie der Text verändert wurde, um die Länge der englischen Audiodatei von ${lengthSeconds.toFixed(2)} Sekunden zu erreichen.`
    };
    const adjSys = restMode
        ? emotionPrompt + "\nHinweis: Die folgenden Zeilen sind Restbestände und müssen nicht in chronologischer Reihenfolge stehen. Behandle jede Zeile für sich."
        : emotionPrompt;
    const messages = [
        { role: 'system', content: adjSys },
        { role: 'user', content: JSON.stringify(payload) }
    ];
    const raw = await requestAssistantText({ messages, key, model, temperature: 0, retries });
    const clean = sanitizeJSONResponse(raw);
    const obj = JSON.parse(clean);
    return obj;
}

// Liefert drei Übersetzungsvorschläge für einen bestehenden Emotional-Text
async function improveEmotionText({ meta, lines, targetPosition, currentText, currentTranslation = '', key, model = 'gpt-4o-mini', retries = 5 }) {
    await promptReady;
    // Kontext, Übersetzung und Emotional-Text werden an das LLM gesendet
    const payload = {
        ...meta,
        lines,
        target_position: targetPosition,
        current_text: currentText,
        current_translation: currentTranslation,
        // LLM soll Alternativen liefern, die Länge und Sprechzeit des EN-Texts beachten
        instructions: 'Analysiere die gesamte Übersetzung und schlage genau drei alternative deutsche Fassungen vor. Jede Variante soll den englischen Originaltext besser wiedergeben, alle Emotionstags beibehalten und ungefähr die gleiche Länge sowie geschätzte Sprechdauer wie der englische Text haben. Vermeide längere Formulierungen. Gib ein Array [{"text":"...","reason":"..."}] zurück und begründe kurz die Verbesserungen.'
    };
    const impSys = restMode
        ? emotionPrompt + "\nHinweis: Die folgenden Zeilen sind Restbestände und müssen nicht in chronologischer Reihenfolge stehen. Behandle jede Zeile für sich."
        : emotionPrompt;
    const messages = [
        { role: 'system', content: impSys },
        { role: 'user', content: JSON.stringify(payload) }
    ];
    const raw = await requestAssistantText({ messages, key, model, temperature: 0, retries });
    const clean = sanitizeJSONResponse(raw);
    const arr = JSON.parse(clean);
    return arr;
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
    module.exports = {
        evaluateScene,
        testKey,
        fetchModels,
        getSystemPrompt,
        generateEmotionText,
        adjustEmotionText,
        improveEmotionText,
        sanitizeJSONResponse,
        fetchWithRetry,
        queuedFetch,
        cancelGptRequests,
        setRestMode
    };
}
if (typeof window !== 'undefined') {
    window.evaluateScene = evaluateScene;
    window.testGptKey = testKey;
    window.fetchGptModels = fetchModels;
    window.getSystemPrompt = getSystemPrompt;
    window.generateEmotionText = generateEmotionText;
    window.adjustEmotionText = adjustEmotionText;
    window.improveEmotionText = improveEmotionText;
    window.sanitizeJSONResponse = sanitizeJSONResponse;
    window.fetchWithRetry = fetchWithRetry;
    window.queuedFetch = queuedFetch;
    window.cancelGptRequests = cancelGptRequests;
    window.setRestMode = setRestMode;
}
