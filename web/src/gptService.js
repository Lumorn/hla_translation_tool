async function evaluateScene(sceneName, lines, apiKey) {
  const results = [];
  const chunkSize = 250;
  for (let i = 0; i < lines.length; i += chunkSize) {
    const chunk = lines.slice(i, i + chunkSize);
    const messages = [
      { role: 'system', content: 'Bewerte die deutsche Übersetzung. Gib für jede Zeile eine Punktzahl von 0 bis 100 und eine kurze Verbesserung.' },
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
      results.push(...arr);
    } catch (e) {
      console.error('GPT Bewertung fehlgeschlagen', e);
    }
  }
  return results;
}

module.exports = { evaluateScene };
