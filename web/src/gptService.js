const defaultPromptLanguage = 'german';
let systemPrompt = '';
let systemPromptLanguage = defaultPromptLanguage;
let emotionPrompt = '';
let emotionPromptLanguage = defaultPromptLanguage;
let promptReady;
// Cache für bereits geladene Prompts pro Sprache
const promptCache = new Map();
// Standarddatei für den Score-Prompt
const defaultScorePrompt = 'gpt_score.txt';
const defaultEmotionPrompt = 'gpt_emotions.txt';
const emotionPromptCache = new Map();
// Merker, ob die Zeilen innerhalb eines Projekts fragmentiert sind
let restMode = false;
// Zwischenspeicher, um zu erkennen, welche Modelle den neuen Responses-Endpunkt benötigen
const responsesModelPattern = /^(gpt-4\.1|gpt-5)/i;
// Konfigurierbare Fallback-Reihenfolge für die Zielsprache
let targetLanguageFallbacks = [defaultPromptLanguage];

// Aktiviert oder deaktiviert den Reste-Modus
function setRestMode(flag) {
    restMode = !!flag;
    if (typeof window !== 'undefined') {
        window.restTranslationFlag = restMode;
    }
}

// Liefert die Übersetzungsfunktion, falls i18n bereits geladen wurde
function getTranslator() {
    if (typeof window !== 'undefined' && window.i18n && typeof window.i18n.t === 'function') {
        return window.i18n.t.bind(window.i18n);
    }
    return null;
}

// Übersetzt das Standard-Zielsprachlabel oder fällt auf den Sprachcode zurück
function translateDefaultTargetLanguage() {
    const translator = getTranslator();
    if (translator) {
        const value = translator('language.defaultTarget');
        if (value && value !== 'language.defaultTarget') {
            return value;
        }
    }
    return defaultPromptLanguage;
}

// Liefert die bestmögliche Bezeichnung für einen Sprachcode
function translateLanguageCode(code) {
    const trimmed = typeof code === 'string' ? code.trim() : '';
    if (!trimmed) {
        return '';
    }
    const translator = getTranslator();
    if (translator) {
        if (trimmed === defaultPromptLanguage) {
            return translateDefaultTargetLanguage();
        }
        const key = `language.${trimmed.toLowerCase()}`;
        const value = translator(key);
        if (value && value !== key) {
            return value;
        }
    }
    if (trimmed === defaultPromptLanguage) {
        return translateDefaultTargetLanguage();
    }
    return trimmed;
}

// Erlaubt extern, eigene Fallback-Reihenfolgen zu setzen
function configureTargetLanguageFallbacks(list = []) {
    if (!Array.isArray(list)) {
        targetLanguageFallbacks = [defaultPromptLanguage];
        return;
    }
    const normalized = list
        .map(item => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean);
    if (!normalized.includes(defaultPromptLanguage)) {
        normalized.push(defaultPromptLanguage);
    }
    targetLanguageFallbacks = Array.from(new Set(normalized));
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

// Versucht GPT-Antworten robust in ein Array umzuwandeln
function normalizeGptArray(value) {
    if (Array.isArray(value)) return value;

    // Strings können eingebettetes JSON enthalten
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
            try {
                return normalizeGptArray(JSON.parse(trimmed));
            } catch (err) {
                console.warn('Eingebettetes JSON konnte nicht geparst werden', err);
            }
        }
        return null;
    }

    // Wrapper-Objekte wie { output: [...] } berücksichtigen
    if (value && typeof value === 'object') {
        if (Array.isArray(value.output)) return value.output;
        if (Array.isArray(value.data)) return value.data;
        if (Array.isArray(value.results)) return value.results;

        // Einzelnes Bewertungsergebnis als Array zurückgeben
        const knownKeys = ['id', 'score', 'comment', 'suggestion'];
        if (knownKeys.some(k => k in value)) return [value];
    }

    return null;
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
        let fallbackText = null;
        for (const item of data.output) {
            if (!item || !Array.isArray(item.content)) continue;
            for (const entry of item.content) {
                if (typeof entry?.text !== 'string') continue;
                const text = entry.text.trim();
                if (!text) continue;
                const type = typeof entry.type === 'string' ? entry.type.toLowerCase() : '';
                // Reasoning-Blöcke liefern häufig nur Zwischenschritte und kein verwertbares JSON
                if (type === 'output_text' || type === 'assistant_message' || type === 'message' || type === 'text') {
                    return text;
                }
                if (!fallbackText) {
                    fallbackText = text;
                }
            }
        }
        if (fallbackText) return fallbackText;
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

    // Serverantwort komplett einlesen, damit wir Fehlermeldungen sauber ausgeben können
    const rawText = await response.text();
    let data = null;
    if (rawText) {
        try {
            data = JSON.parse(rawText);
        } catch (err) {
            // Hinweis im Log, damit unerwartete Formate leichter zu finden sind
            console.warn('Antwort konnte nicht als JSON geparst werden', err);
        }
    }

    if (!response.ok) {
        let hint = '';
        if (data?.error?.message) {
            hint = data.error.message;
        } else if (rawText && rawText.trim()) {
            hint = rawText.trim();
        }
        const suffix = hint ? `: ${hint}` : '';
        throw new Error(`HTTP ${response.status}${suffix}`);
    }

    if (!data) {
        throw new Error('Leere Antwort vom Server');
    }

    return extractAssistantText(data);
}

// Hilfsfunktion: merkt, welche Sprache aus dem Speicher geladen wurde
function detectStoredPromptLanguage() {
    if (typeof localStorage === 'undefined') return defaultPromptLanguage;
    const stored = localStorage.getItem('hla_gptPromptLanguage');
    return typeof stored === 'string' && stored.trim() ? stored : defaultPromptLanguage;
}

// Liefert den geladenen System-Prompt
function getSystemPrompt() {
    return systemPrompt;
}

// Liefert die aktuell gesetzte Prompt-Sprache
function getSystemPromptLanguage() {
    return systemPromptLanguage;
}

function resolveTargetLanguage(languageName, languageCode) {
    if (typeof languageName === 'string' && languageName.trim()) {
        return languageName.trim();
    }
    if (typeof languageCode === 'string' && languageCode.trim()) {
        return translateLanguageCode(languageCode);
    }
    const stored = detectStoredPromptLanguage();
    const candidates = [stored, ...targetLanguageFallbacks];
    const seen = new Set();
    for (const candidate of candidates) {
        const normalized = typeof candidate === 'string' ? candidate.trim() : '';
        if (!normalized || seen.has(normalized)) continue;
        seen.add(normalized);
        const label = translateLanguageCode(normalized);
        if (label) {
            return label;
        }
    }
    return translateDefaultTargetLanguage();
}

// Pfad-Helfer für die Score-Prompts
function getScorePromptNames(langCode) {
    const names = [];
    if (langCode) names.push(`gpt_score_${langCode}.txt`);
    names.push(defaultScorePrompt);
    return names;
}

function getEmotionPromptNames(langCode) {
    const names = [];
    if (langCode) names.push(`gpt_emotions_${langCode}.txt`);
    names.push(defaultEmotionPrompt);
    return names;
}

// Liest einen Prompt aus dem Dateisystem oder via Fetch
async function readPromptFile(fileNames) {
    const names = Array.isArray(fileNames) ? fileNames : [String(fileNames || defaultScorePrompt)];
    let lastError = null;
    if (typeof window !== 'undefined' && typeof fetch === 'function') {
        for (const name of names) {
            const url = `../prompts/${name}`;
            try {
                const res = await fetch(url);
                if (res.ok) {
                    return await res.text();
                }
            } catch (e) {
                lastError = e;
            }
        }
    } else {
        const fs = require('fs');
        const path = require('path');
        for (const name of names) {
            try {
                const localPath = path.join(__dirname, '..', 'prompts', name);
                const rootPath  = path.join(__dirname, '..', '..', 'prompts', name);
                const filePath  = fs.existsSync(localPath) ? localPath : rootPath;
                if (fs.existsSync(filePath)) {
                    return fs.readFileSync(filePath, 'utf8');
                }
            } catch (e) {
                lastError = e;
            }
        }
    }
    if (lastError) {
        console.error('Prompt konnte nicht geladen werden', lastError);
    }
    return '';
}

// Lädt den Score-Prompt für eine Sprache und merkt ihn im Cache
async function loadSystemPrompt(langCode = 'german') {
    const code = langCode || 'german';
    if (promptCache.has(code)) {
        systemPrompt = promptCache.get(code) || '';
        systemPromptLanguage = code;
        return systemPrompt;
    }
    const content = await readPromptFile(getScorePromptNames(code));
    systemPrompt = (content || '').trim();
    systemPromptLanguage = code;
    promptCache.set(code, systemPrompt);
    return systemPrompt;
}

// Setzt die gewünschte Prompt-Sprache und lädt den passenden Score-Prompt
async function setSystemPromptLanguage(langCode = 'german') {
    const language = langCode || 'german';
    promptReady = Promise.all([
        loadSystemPrompt(language),
        loadEmotionPrompt(language)
    ]);
    await promptReady;
    return systemPrompt;
}

// Lädt den Emotion-Prompt pro Sprache mit Fallback auf die Standardsprache
async function loadEmotionPrompt(langCode = 'german') {
    const code = langCode || 'german';
    if (emotionPromptCache.has(code)) {
        emotionPrompt = emotionPromptCache.get(code) || '';
        emotionPromptLanguage = code;
        return emotionPrompt;
    }
    const content = await readPromptFile(getEmotionPromptNames(code));
    emotionPrompt = (content || '').trim();
    emotionPromptLanguage = code;
    emotionPromptCache.set(code, emotionPrompt);
    return emotionPrompt;
}

async function getEmotionPrompt(langCode = systemPromptLanguage) {
    const code = langCode || systemPromptLanguage || 'german';
    if (emotionPromptLanguage === code && emotionPrompt) {
        return emotionPrompt;
    }
    if (emotionPromptCache.has(code)) {
        return emotionPromptCache.get(code);
    }
    return loadEmotionPrompt(code);
}

if (typeof window !== 'undefined' && typeof fetch === 'function') {
    // Im Browser: Prompts per Fetch laden
    const storedLanguage = detectStoredPromptLanguage();
    promptReady = Promise.all([
        loadSystemPrompt(storedLanguage),
        loadEmotionPrompt(storedLanguage)
    ]);
} else {
    // Unter Node: Prompts direkt von der Festplatte lesen
    const storedLanguage = detectStoredPromptLanguage();
    promptReady = Promise.all([
        loadSystemPrompt(storedLanguage),
        loadEmotionPrompt(storedLanguage)
    ]);
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
async function evaluateScene({ scene, lines, key, model = 'gpt-4o-mini', retries = 5, projectId, onProgress = null }) {
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

    const resultsById = new Map();
    const chunkSize = 250;
    let canceled = false;
    let ui = null;
    const maxAttemptsPerLine = 4;
    const hasExternalProgress = typeof onProgress === 'function';
    const safeEmit = (payload) => {
        if (!hasExternalProgress) return;
        try {
            onProgress(payload);
        } catch (err) {
            console.warn('Fortschritts-Callback meldet einen Fehler:', err);
        }
    };
    safeEmit({ type: 'start', total: uniqueLines.length, uniqueTotal: uniqueLines.length });

    // Kleiner Helfer zum Loggen im Fortschrittsdialog und in der Konsole
    const logProgress = (text) => {
        console.log('[GPT STATUS]', text);
        if (ui) appendGptLog(ui, text);
        safeEmit({ type: 'log', message: text });
    };

    // Fortschrittsdialog mit Loganzeige nur im Browser
    if (!hasExternalProgress && typeof document !== 'undefined') {
        ui = createProgressDialog(uniqueLines.length);
        ui.cancelBtn.onclick = () => { canceled = true; ui.overlay.remove(); };
    }

    for (let i = 0; i < uniqueLines.length && !canceled; i += chunkSize) {
        const chunk = uniqueLines.slice(i, i + chunkSize);
        const pending = new Map();
        chunk.forEach(line => {
            const idStr = String(line.id);
            pending.set(idStr, { line, attempts: 0 });
        });
        if (ui) updateProgressDialog(ui, i, uniqueLines.length);
        safeEmit({ type: 'progress', done: i, total: uniqueLines.length });
        const sysBase = restMode
            ? systemPrompt + "\nHinweis: Die folgenden Zeilen sind Restbestände und stehen nicht in chronologischer Reihenfolge. Behandle jede Zeile unabhängig."
            : systemPrompt;

        // Baut eine Anfrage für eine Teilmenge der Zeilen und verarbeitet die Antwort
        const requestSubset = async (subset) => {
            const filtered = subset.filter(item => pending.has(String(item.id)));
            if (filtered.length === 0) {
                return;
            }
            filtered.forEach(item => {
                const entry = pending.get(String(item.id));
                if (entry) entry.attempts += 1;
            });
            const messages = [
                { role: 'system', content: sysBase },
                { role: 'user', content: JSON.stringify({ scene, lines: filtered }) }
            ];
            const endpoint = usesResponsesEndpoint(model) ? 'responses' : 'chat';
            const reqText = JSON.stringify({ endpoint, model, messages });
            if (typeof window !== 'undefined' && window.debugLog) {
                window.debugLog('[GPT REQUEST]', reqText);
            }
            console.log('[GPT REQUEST]', { endpoint, model, messages });
            if (ui) appendGptLog(ui, '>> ' + reqText);
            safeEmit({
                type: 'stage',
                stage: 'request',
                status: 'running',
                message: `Übertrage ${filtered.length} ${filtered.length === 1 ? 'Zeile' : 'Zeilen'}…`
            });
            let arr;
            try {
                const raw = await requestAssistantText({ messages, key, model, temperature: 0, retries });
                const clean = sanitizeJSONResponse(raw);
                arr = JSON.parse(clean);
            } catch (e) {
                if (ui) ui.overlay.remove();
                safeEmit({ type: 'stage', stage: 'request', status: 'error', message: 'Übertragung fehlgeschlagen' });
                throw new Error('API-Fehler: ' + (e && e.message ? e.message : e));
            }
            // GPT-Antworten tolerant in ein Array umwandeln
            const normalized = normalizeGptArray(arr);
            if (!normalized) {
                if (ui) ui.overlay.remove();
                safeEmit({ type: 'stage', stage: 'process', status: 'error', message: 'Antwort konnte nicht gelesen werden' });
                throw new Error('Ungültige Antwort: GPT hat kein Array zurückgegeben');
            }

            const resText = JSON.stringify(normalized);
            if (typeof window !== 'undefined' && window.debugLog) {
                window.debugLog('[GPT RESPONSE]', resText);
            }
            console.log('[GPT RESPONSE]', normalized);
            if (ui) appendGptLog(ui, '<< ' + resText);
            safeEmit({
                type: 'stage',
                stage: 'request',
                status: 'done',
                message: 'Antwort empfangen'
            });
            safeEmit({
                type: 'stage',
                stage: 'process',
                status: 'running',
                message: `${normalized.length} Bewertungen werden ausgewertet…`
            });
            let newlyStored = 0;
            for (const item of normalized) {
                if (!item || typeof item !== 'object') {
                    logProgress('⚠️ Antwort ohne Objektstruktur ignoriert.');
                    continue;
                }
                if (typeof item.id === 'undefined' || item.id === null) {
                    logProgress('⚠️ Antwort ohne ID ignoriert.');
                    continue;
                }
                const idStr = String(item.id);
                if (!pending.has(idStr) && !resultsById.has(idStr)) {
                    logProgress(`⚠️ Antwort mit unbekannter ID ${idStr} übersprungen.`);
                    continue;
                }
                if (!pending.has(idStr)) {
                    logProgress(`ℹ️ Antwort für ID ${idStr} wurde bereits zuvor gespeichert.`);
                    continue;
                }
                resultsById.set(idStr, { ...item });
                pending.delete(idStr);
                newlyStored += 1;
                logProgress(`✔ Bewertung für Zeile ${idStr} übernommen.`);
            }
            if (newlyStored === 0) {
                logProgress('⚠️ Diese Antwort enthielt keine neuen Bewertungen.');
            }
            safeEmit({
                type: 'stage',
                stage: 'process',
                status: 'done',
                message: `${newlyStored} Bewertungen gespeichert`
            });
        };

        await requestSubset(chunk);
        while (pending.size > 0) {
            const stillMissing = Array.from(pending.keys());
            logProgress(`Noch offen: ${stillMissing.join(', ')}`);
            const stalled = stillMissing.filter(id => {
                const entry = pending.get(id);
                return entry && entry.attempts >= maxAttemptsPerLine;
            });
            if (stalled.length > 0) {
                if (ui) ui.overlay.remove();
                throw new Error(`Unvollständige Bewertung: Keine Antwort für Zeilen ${stalled.join(', ')} erhalten.`);
            }
            const candidates = Array.from(pending.values());
            candidates.sort((a, b) => b.attempts - a.attempts);
            let nextBatch;
            if (candidates[0].attempts >= 2) {
                nextBatch = [candidates[0].line];
            } else if (candidates.length > 5) {
                nextBatch = candidates.slice(0, 5).map(entry => entry.line);
            } else {
                nextBatch = candidates.map(entry => entry.line);
            }
            logProgress(`Fordere ${nextBatch.length === 1 ? 'Zeile' : 'Zeilen'} ${nextBatch.map(l => l.id).join(', ')} erneut an.`);
            await requestSubset(nextBatch);
        }
        safeEmit({
            type: 'progress',
            done: Math.min(i + chunk.length, uniqueLines.length),
            total: uniqueLines.length
        });
    }

    if (ui) ui.overlay.remove();
    if (canceled) throw new Error('Abgebrochen');

    // Ergebnisse auf alle Originalzeilen übertragen
    safeEmit({ type: 'stage', stage: 'merge', status: 'running', message: 'Übernehme Bewertungen in die Ausgangszeilen…' });
    const expanded = [];
    link.forEach((uIdx, i) => {
        const src = uniqueLines[uIdx];
        const base = src ? resultsById.get(String(src.id)) : null;
        if (!base) {
            throw new Error(`Bewertung für Zeile ${src ? src.id : 'unbekannt'} fehlt.`);
        }
        // projectId zur Ergebniszeile hinzufügen, damit nur passende Projekte Daten übernehmen
        expanded.push({ ...base, id: lines[i].id, projectId });
    });
    safeEmit({ type: 'stage', stage: 'merge', status: 'done', message: 'Bewertungen übertragen' });
    safeEmit({ type: 'done' });
    return expanded;
}

// Erzeugt einen emotional getaggten Text für eine Zeile unter Berücksichtigung des kompletten Szenenverlaufs
async function generateEmotionText({ meta, lines, targetPosition, key, model = 'gpt-4o-mini', retries = 5, language = systemPromptLanguage, languageName = '' }) {
    await promptReady;
    const targetLanguage = resolveTargetLanguage(languageName, language);
    const promptText = await getEmotionPrompt(language);
    // Emotionstags müssen in der aktuellen Zielsprache zurückgegeben werden und dürfen nie direkt aufeinander folgen
    const payload = {
        ...meta,
        lines,
        target_position: targetPosition,
        target_language: targetLanguage,
        instructions: `Analysiere die Szene und gib den Text komplett auf ${targetLanguage} zurück. Setze niemals zwei Emotionstags hintereinander und platziere jeden Tag direkt vor der passenden Textstelle. Schreibe alle Tags und den restlichen Text auf ${targetLanguage}.`
    };
    const emoSys = restMode
        ? promptText + "\nHinweis: Die folgenden Zeilen sind Restbestände und müssen nicht in chronologischer Reihenfolge stehen. Behandle jede Zeile für sich."
        : promptText;
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
async function adjustEmotionText({ meta, lines, targetPosition, lengthSeconds, key, model = 'gpt-4o-mini', retries = 5, language = systemPromptLanguage, languageName = '' }) {
    await promptReady;
    const targetLanguage = resolveTargetLanguage(languageName, language);
    const promptText = await getEmotionPrompt(language);
    const payload = {
        ...meta,
        lines,
        target_position: targetPosition,
        length_seconds: lengthSeconds,
        target_language: targetLanguage,
        // Beim Kürzen sollen Abbrüche und Fülllaute erhalten bleiben
        instructions: `Analysiere die Szene und gib den Text komplett auf ${targetLanguage} zurück. Setze niemals zwei Emotionstags hintereinander und platziere jeden Tag direkt vor der passenden Textstelle. Schreibe alle Tags auf ${targetLanguage}. Kürze den Text so, dass die vorgelesene Länge ungefähr ${lengthSeconds.toFixed(2)} Sekunden beträgt und diese Dauer keinesfalls unterschreitet. Dabei darfst du Formulierungen ändern und unwichtige Details weglassen, solange die Aussage erhalten bleibt, der Stil des englischen Originals gewahrt bleibt und der Text natürlich klingt. Eigenheiten wie abgebrochene Sätze oder Fülllaute ("äh", "mh") aus dem englischen Original sollen sinngemäß erhalten bleiben. Beschreibe im Feld "reason" in einem Satz, wie der Text verändert wurde, um die Länge der englischen Audiodatei von ${lengthSeconds.toFixed(2)} Sekunden zu erreichen.`
    };
    const adjSys = restMode
        ? promptText + "\nHinweis: Die folgenden Zeilen sind Restbestände und müssen nicht in chronologischer Reihenfolge stehen. Behandle jede Zeile für sich."
        : promptText;
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
async function improveEmotionText({ meta, lines, targetPosition, currentText, currentTranslation = '', key, model = 'gpt-4o-mini', retries = 5, language = systemPromptLanguage, languageName = '' }) {
    await promptReady;
    const targetLanguage = resolveTargetLanguage(languageName, language);
    const promptText = await getEmotionPrompt(language);
    // Kontext, Übersetzung und Emotional-Text werden an das LLM gesendet
    const payload = {
        ...meta,
        lines,
        target_position: targetPosition,
        current_text: currentText,
        current_translation: currentTranslation,
        target_language: targetLanguage,
        // LLM soll Alternativen liefern, die Länge und Sprechzeit des EN-Texts beachten
        instructions: `Analysiere die gesamte Übersetzung und schlage genau drei alternative ${targetLanguage}-Fassungen vor. Jede Variante soll den englischen Originaltext besser wiedergeben, alle Emotionstags beibehalten und ungefähr die gleiche Länge sowie geschätzte Sprechdauer wie der englische Text haben. Vermeide längere Formulierungen. Gib ein Array [{"text":"...","reason":"..."}] zurück und begründe kurz die Verbesserungen.`
    };
    const impSys = restMode
        ? promptText + "\nHinweis: Die folgenden Zeilen sind Restbestände und müssen nicht in chronologischer Reihenfolge stehen. Behandle jede Zeile für sich."
        : promptText;
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
        getSystemPromptLanguage,
        setSystemPromptLanguage,
        configureTargetLanguageFallbacks,
        generateEmotionText,
        adjustEmotionText,
        improveEmotionText,
        sanitizeJSONResponse,
        normalizeGptArray,
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
    window.getSystemPromptLanguage = getSystemPromptLanguage;
    window.setSystemPromptLanguage = setSystemPromptLanguage;
    window.configureTargetLanguageFallbacks = configureTargetLanguageFallbacks;
    window.generateEmotionText = generateEmotionText;
    window.adjustEmotionText = adjustEmotionText;
    window.improveEmotionText = improveEmotionText;
    window.sanitizeJSONResponse = sanitizeJSONResponse;
    window.fetchWithRetry = fetchWithRetry;
    window.queuedFetch = queuedFetch;
    window.cancelGptRequests = cancelGptRequests;
    window.setRestMode = setRestMode;
}
