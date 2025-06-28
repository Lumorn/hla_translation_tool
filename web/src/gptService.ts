let systemPrompt = '';
let promptReady;

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
        systemPrompt = fs.readFileSync(path.join(__dirname, '..', 'prompts', 'gpt_score.txt'), 'utf8').trim();
    } catch (e) {
        console.error('Prompt konnte nicht geladen werden', e);
    }
    promptReady = Promise.resolve();
}

// Bewertet eine Szene mit GPT und liefert ein Array
// [{id, score, comment, suggestion}]
export async function evaluateScene(sceneName, lines, apiKey) {
    await promptReady;
    const results = [];
    const chunkSize = 250;
    for (let i = 0; i < lines.length; i += chunkSize) {
        const chunk = lines.slice(i, i + chunkSize);
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: JSON.stringify({ scene: sceneName, lines: chunk }) }
        ];
        try {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + apiKey
                },
                body: JSON.stringify({ model: 'gpt-3.5-turbo', messages, temperature: 0 })
            });
            const data = await res.json();
            const arr = JSON.parse(data.choices[0].message.content);
            // Erwartet Array von {id, score, comment, suggestion}
            results.push(...arr);
        } catch (e) {
            console.error('GPT Bewertung fehlgeschlagen', e);
        }
    }
    return results;
}

// Kompatibilität für CommonJS
if (typeof module !== 'undefined') {
    module.exports = { evaluateScene };
}
