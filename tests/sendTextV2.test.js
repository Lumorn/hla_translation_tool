const nock = require('nock');
const { sendTextV2 } = require('../elevenlabs');

const API = 'https://api.elevenlabs.io/v1';

afterEach(() => {
    nock.cleanAll();
});

describe('sendTextV2', () => {
    test('sendet Text erfolgreich', async () => {
        const scope = nock(API)
            .post('/text-to-speech/abc', body => body.text === 'Hallo' && body.model_id === 'eleven_multilingual_v2')
            .reply(200, '');

        await sendTextV2('key', 'abc', 'Hallo');
        expect(scope.isDone()).toBe(true);
    });

    test('wirft Fehler bei HTTP-Fehler', async () => {
        nock(API)
            .post('/text-to-speech/abc')
            .reply(400, 'Fehler');

        await expect(sendTextV2('key', 'abc', 'Test')).rejects.toThrow('Text-to-Speech fehlgeschlagen');
    });
});
