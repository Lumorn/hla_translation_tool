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
  jestFetch.mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: '[]' } }] }) });
  await evaluateScene({ scene: 'scene', lines, key: 'key', model: 'gpt-3.5-turbo', retries: 1 });
  expect(jestFetch).toHaveBeenCalledTimes(1);
});

test('wirft bei API-Fehler', async () => {
  const { evaluateScene } = require('../web/src/gptService.js');
  const lines = [{ id: 1, character: '', en: 'a', de: 'b' }];
  jestFetch.mockResolvedValue({ ok: false, status: 429, json: async () => ({ error: { message: 'limit' } }) });
  await expect(evaluateScene({ scene: 's', lines, key: 'key', model: 'gpt-3.5-turbo', retries: 1 })).rejects.toThrow('API-Fehler');
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

test('applyEvaluationResults überträgt Score und Kommentar', () => {
  const { applyEvaluationResults } = require('../web/src/actions/projectEvaluate.js');
  const files = [{ id: 1 }, { id: 2 }];
  const results = [{ id: '1', score: '55', comment: 'ok', suggestion: 'neu' }];
  applyEvaluationResults(results, files);
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
  jestFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ choices: [{ message: { content: '[{"id":1,"score":5}]' } }] })
  });
  const res = await evaluateScene({ scene: 's', lines, key: 'key', model: 'gpt', retries: 1 });
  expect(jestFetch).toHaveBeenCalledTimes(1);
  expect(res).toEqual([
    { id: 1, score: 5 },
    { id: 2, score: 5 }
  ]);
});

test('generateEmotionText liefert Objekt mit Begründung', async () => {
  const { generateEmotionText } = require('../web/src/gptService.js');
  jestFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ choices: [{ message: { content: '{"text":"hi","reason":"ok"}' } }] })
  });
  const res = await generateEmotionText({ meta: {}, lines: [], targetPosition: 1, key: 'key', model: 'gpt', retries: 1 });
  expect(res).toEqual({ text: 'hi', reason: 'ok' });
});

test('improveEmotionText liefert drei Vorschläge', async () => {
  const { improveEmotionText } = require('../web/src/gptService.js');
  jestFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ choices: [{ message: { content: '[{"text":"a","reason":"r1"},{"text":"b","reason":"r2"},{"text":"c","reason":"r3"}]' } }] })
  });
  const res = await improveEmotionText({ meta: {}, lines: [], targetPosition: 1, currentText: 'alt', key: 'k', model: 'gpt', retries: 1 });
  expect(res).toEqual([
    { text: 'a', reason: 'r1' },
    { text: 'b', reason: 'r2' },
    { text: 'c', reason: 'r3' }
  ]);
});

test('wiederholt bei HTTP 429', async () => {
  const { evaluateScene } = require('../web/src/gptService.js');
  const lines = [{ id: 1, character: '', en: 'a', de: 'b' }];
  jestFetch
    .mockResolvedValueOnce({ ok: false, status: 429 })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ choices: [{ message: { content: '[{"id":1}]' } }] }) });
  const res = await evaluateScene({ scene: 's', lines, key: 'k', model: 'gpt', retries: 2 });
  expect(jestFetch).toHaveBeenCalledTimes(2);
  expect(res).toEqual([{ id: 1 }]);
});
