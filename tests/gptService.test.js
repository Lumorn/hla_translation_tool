const jestFetch = jest.fn();

beforeEach(() => {
  jest.resetModules();
  global.fetch = jestFetch;
});

afterEach(() => {
  delete global.fetch;
});

test('teilt lange Anfragen in Blöcke', async () => {
  const { evaluateScene } = require('../web/src/gptService.ts');
  const lines = Array.from({ length: 300 }, (_, i) => ({ id: i, character: '', en: 'a', de: 'b' }));
  jestFetch.mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: '[]' } }] }) });
  await evaluateScene({ scene: 'scene', lines, key: 'key' });
  expect(jestFetch).toHaveBeenCalledTimes(2);
});

test('wirft bei API-Fehler', async () => {
  const { evaluateScene } = require('../web/src/gptService.ts');
  const lines = [{ id: 1, character: '', en: 'a', de: 'b' }];
  jestFetch.mockResolvedValue({ ok: false, status: 429, json: async () => ({ error: { message: 'limit' } }) });
  await expect(evaluateScene({ scene: 's', lines, key: 'key' })).rejects.toThrow('API-Fehler');
});

test('testKey prüft API-Schlüssel', async () => {
  const { testKey } = require('../web/src/gptService.ts');
  jestFetch.mockResolvedValue({ ok: true });
  const ok = await testKey('abc');
  expect(jestFetch).toHaveBeenCalledWith('https://api.openai.com/v1/models', { headers: { Authorization: 'Bearer abc' } });
  expect(ok).toBe(true);
});
