const jestFetch = jest.fn();

beforeEach(() => {
  jest.resetModules();
  jestFetch.mockReset();
  global.fetch = jestFetch;
});

afterEach(() => {
  delete global.fetch;
});

test('teilt lange Anfragen in Blöcke', async () => {
  const { evaluateScene } = require('../web/src/gptService.js');
  const lines = Array.from({ length: 300 }, (_, i) => ({ id: i, character: '', en: 'a', de: 'b' }));
  jestFetch.mockImplementation((url, options) => {
    const body = JSON.parse(options.body);
    const linesPayload = JSON.parse(body.messages[1].content).lines;
    const arr = linesPayload.map(line => ({ id: line.id, score: 0 }));
    const payload = { choices: [{ message: { content: JSON.stringify(arr) } }] };
    return Promise.resolve({
      ok: true,
      json: async () => payload,
      text: async () => JSON.stringify(payload)
    });
  });
  await evaluateScene({ scene: 'scene', lines, key: 'key', model: 'gpt-3.5-turbo', retries: 1, projectId: 'p1' });
  expect(jestFetch).toHaveBeenCalledTimes(1);
});

test('wirft bei API-Fehler', async () => {
  const { evaluateScene } = require('../web/src/gptService.js');
  const lines = [{ id: 1, character: '', en: 'a', de: 'b' }];
  const errorPayload = { error: { message: 'limit' } };
  jestFetch.mockResolvedValue({
    ok: false,
    status: 429,
    json: async () => errorPayload,
    text: async () => JSON.stringify(errorPayload)
  });
  await expect(evaluateScene({ scene: 's', lines, key: 'key', model: 'gpt-3.5-turbo', retries: 1, projectId: 'p1' })).rejects.toThrow('API-Fehler');
});

test('testKey prüft API-Schlüssel', async () => {
  const { testKey } = require('../web/src/gptService.js');
  jestFetch.mockResolvedValue({ ok: true });
  const ok = await testKey('abc');
  expect(jestFetch).toHaveBeenCalledWith('https://api.openai.com/v1/models', { headers: { Authorization: 'Bearer abc' } });
  expect(ok).toBe(true);
});

test('fetchModels filtert GPT-Modelle', async () => {
  const { fetchModels } = require('../web/src/gptService.js');
  jestFetch.mockResolvedValue({ ok: true, json: async () => ({ data: [
    { id: 'gpt-3.5-turbo', owned_by: 'openai' },
    { id: 'foo', owned_by: 'openai' }
  ] }) });
  const models = await fetchModels('key', true);
  expect(jestFetch).toHaveBeenCalledWith('https://api.openai.com/v1/models', { headers: { Authorization: 'Bearer key' } });
  expect(models).toEqual([{ id: 'gpt-3.5-turbo', owned_by: 'openai' }]);
});

test('fetchModels wirft bei Fehler', async () => {
  const { fetchModels } = require('../web/src/gptService.js');
  jestFetch.mockResolvedValue({ ok: false, text: async () => 'nope' });
  await expect(fetchModels('k', true)).rejects.toThrow('nope');
});

test('sanitizeJSONResponse entfernt ```json-Blöcke', () => {
  const { sanitizeJSONResponse } = require('../web/src/gptService.js');
  const input = '```json\n[{"a":1}]\n```';
  expect(sanitizeJSONResponse(input)).toBe('[{"a":1}]');
});

test('normalizeGptArray wandelt Einzelobjekte in ein Array um', () => {
  const { normalizeGptArray } = require('../web/src/gptService.js');
  const single = { id: 1, score: 99, comment: 'ok' };
  expect(normalizeGptArray(single)).toEqual([single]);
});

test('applyEvaluationResults überträgt Score und Kommentar', () => {
  const { applyEvaluationResults } = require('../web/src/actions/projectEvaluate.js');
  const files = [{ id: 1 }, { id: 2 }];
  const results = [{ id: '1', score: '55', comment: 'ok', suggestion: 'neu', projectId: 'p1' }];
  applyEvaluationResults(results, files, { id: 'p1' });
  expect(files[0].score).toBe(55);
  expect(files[0].comment).toBe('ok');
  expect(files[0].suggestion).toBe('neu');
});

test('parseEvaluationResults liefert Array oder null', () => {
  const { parseEvaluationResults } = require('../web/src/actions/projectEvaluate.js');
  const valid = '[{"id":1}]';
  const invalid = 'foo';
  expect(parseEvaluationResults(valid)).toEqual([{ id: 1 }]);
  expect(parseEvaluationResults(invalid)).toBeNull();
});

test('fasst doppelte Zeilen zusammen', async () => {
  const { evaluateScene } = require('../web/src/gptService.js');
  const lines = [
    { id: 1, character: '', en: 'a', de: 'b' },
    { id: 2, character: '', en: 'a', de: 'b' }
  ];
  const payload = { choices: [{ message: { content: '[{"id":1,"score":5}]' } }] };
  jestFetch.mockResolvedValue({
    ok: true,
    json: async () => payload,
    text: async () => JSON.stringify(payload)
  });
  const res = await evaluateScene({ scene: 's', lines, key: 'key', model: 'gpt', retries: 1, projectId: 'p1' });
  expect(jestFetch).toHaveBeenCalledTimes(1);
  expect(res).toEqual([
    { id: 1, score: 5, projectId: 'p1' },
    { id: 2, score: 5, projectId: 'p1' }
  ]);
});

test('evaluateScene akzeptiert einzelne Objekt-Antwort', async () => {
  const { evaluateScene } = require('../web/src/gptService.js');
  const lines = [{ id: 3, character: '', en: 'foo', de: 'bar' }];
  const payload = { choices: [{ message: { content: '{"id":3,"score":88}' } }] };
  jestFetch.mockResolvedValue({
    ok: true,
    json: async () => payload,
    text: async () => JSON.stringify(payload)
  });
  const res = await evaluateScene({ scene: 'solo', lines, key: 'key', model: 'gpt', retries: 1, projectId: 'px' });
  expect(res).toEqual([{ id: 3, score: 88, projectId: 'px' }]);
});

test('fordert fehlende Bewertungen erneut an', async () => {
  const { evaluateScene } = require('../web/src/gptService.js');
  const lines = [
    { id: 1, character: '', en: 'a', de: 'b' },
    { id: 2, character: '', en: 'c', de: 'd' }
  ];
  const firstPayload = { choices: [{ message: { content: '[{"id":1,"score":7}]' } }] };
  const secondPayload = { choices: [{ message: { content: '[{"id":2,"score":8}]' } }] };
  jestFetch
    .mockResolvedValueOnce({
      ok: true,
      json: async () => firstPayload,
      text: async () => JSON.stringify(firstPayload)
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => secondPayload,
      text: async () => JSON.stringify(secondPayload)
    });
  const res = await evaluateScene({ scene: 'teil', lines, key: 'key', model: 'gpt-3.5-turbo', retries: 1, projectId: 'p42' });
  expect(res).toEqual([
    { id: 1, score: 7, projectId: 'p42' },
    { id: 2, score: 8, projectId: 'p42' }
  ]);
  expect(jestFetch).toHaveBeenCalledTimes(2);
  const firstBody = JSON.parse(jestFetch.mock.calls[0][1].body);
  const firstLines = JSON.parse(firstBody.messages[1].content).lines;
  expect(firstLines).toHaveLength(2);
  const secondBody = JSON.parse(jestFetch.mock.calls[1][1].body);
  const secondLines = JSON.parse(secondBody.messages[1].content).lines;
  expect(secondLines).toHaveLength(1);
  expect(secondLines[0].id).toBe(2);
});

test('verwendet den Responses-Endpunkt für gpt-5-Modelle', async () => {
  const { evaluateScene } = require('../web/src/gptService.js');
  const payload = { output_text: '[{"id":1,"score":7}]' };
  jestFetch.mockResolvedValue({
    ok: true,
    json: async () => payload,
    text: async () => JSON.stringify(payload)
  });
  const lines = [{ id: 1, character: '', en: 'a', de: 'b' }];
  const res = await evaluateScene({ scene: 'x', lines, key: 'key', model: 'gpt-5.0', retries: 1, projectId: 'p1' });
  expect(jestFetch).toHaveBeenCalledWith('https://api.openai.com/v1/responses', expect.any(Object));
  expect(res).toEqual([{ id: 1, score: 7, projectId: 'p1' }]);
});

test('ignoriert Reasoning-Blöcke bei Responses-Ausgaben', async () => {
  const { evaluateScene } = require('../web/src/gptService.js');
  const payload = {
    output: [
      {
        content: [
          { type: 'reasoning', text: 'Denke laut, aber liefere kein JSON.' },
          { type: 'output_text', text: '[{"id":1,"score":9}]' }
        ]
      }
    ]
  };
  jestFetch.mockResolvedValue({
    ok: true,
    json: async () => payload,
    text: async () => JSON.stringify(payload)
  });
  const lines = [{ id: 1, character: '', en: 'a', de: 'b' }];
  const res = await evaluateScene({ scene: 'y', lines, key: 'key', model: 'gpt-5-chat-latest', retries: 1, projectId: 'p1' });
  expect(res).toEqual([{ id: 1, score: 9, projectId: 'p1' }]);
});

test('generateEmotionText liefert Objekt mit Begründung', async () => {
  const { generateEmotionText } = require('../web/src/gptService.js');
  const payload = { choices: [{ message: { content: '{"text":"hi","reason":"ok"}' } }] };
  jestFetch.mockResolvedValue({
    ok: true,
    json: async () => payload,
    text: async () => JSON.stringify(payload)
  });
  const res = await generateEmotionText({ meta: {}, lines: [], targetPosition: 1, key: 'key', model: 'gpt', retries: 1, language: 'spanish', languageName: 'Spanisch' });
  expect(res).toEqual({ text: 'hi', reason: 'ok' });
  const body = JSON.parse(jestFetch.mock.calls[0][1].body);
  const userPayload = JSON.parse(body.messages[1].content);
  expect(userPayload.target_language).toBe('Spanisch');
  expect(userPayload.instructions).toContain('Spanisch');
});

test('improveEmotionText liefert drei Vorschläge', async () => {
  const { improveEmotionText } = require('../web/src/gptService.js');
  const payload = { choices: [{ message: { content: '[{"text":"a","reason":"r1"},{"text":"b","reason":"r2"},{"text":"c","reason":"r3"}]' } }] };
  jestFetch.mockResolvedValue({
    ok: true,
    json: async () => payload,
    text: async () => JSON.stringify(payload)
  });
  const res = await improveEmotionText({ meta: {}, lines: [], targetPosition: 1, currentText: 'alt', currentTranslation: 'alt', key: 'k', model: 'gpt', retries: 1 });
  expect(res).toEqual([
    { text: 'a', reason: 'r1' },
    { text: 'b', reason: 'r2' },
    { text: 'c', reason: 'r3' }
  ]);
});

test('wiederholt bei HTTP 429', async () => {
  const { evaluateScene } = require('../web/src/gptService.js');
  const lines = [{ id: 1, character: '', en: 'a', de: 'b' }];
  const payload = { choices: [{ message: { content: '[{"id":1}]' } }] };
  jestFetch
    .mockResolvedValueOnce({ ok: false, status: 429, text: async () => '', json: async () => ({}) })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => payload,
      text: async () => JSON.stringify(payload)
    });
  const res = await evaluateScene({ scene: 's', lines, key: 'k', model: 'gpt', retries: 2, projectId: 'p1' });
  expect(jestFetch).toHaveBeenCalledTimes(2);
  expect(res).toEqual([{ id: 1, projectId: 'p1' }]);
});
