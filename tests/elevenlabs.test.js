const fs = require('fs');
const nock = require('nock');
const path = require('path');

// Tests dürfen länger dauern, da Downloads bis zu 10 Versuche brauchen
jest.setTimeout(30000);

const { downloadDubbingAudio, waitForDubbing, isDubReady } = require('../elevenlabs');

// Basis-URL der API
const API = 'https://api.elevenlabs.io/v1';

afterEach(() => {
    nock.cleanAll();
});

describe('ElevenLabs API', () => {
    test('Download-Fehler', async () => {
        nock(API)
            .get('/dubbing/abc')
            .reply(200, { status: 'dubbed', target_languages: ['de'] });
        nock(API)
            .get('/dubbing/abc/audio/de')
            .times(4)
            .reply(404, 'not found');

        await expect(downloadDubbingAudio('key', 'abc', 'de', 'out.mp3', { maxRetries: 2, retryDelay: 10 })).rejects.toThrow('Download fehlgeschlagen');
    });


    test('Download erfolgreich', async () => {
        const outPath = path.join(__dirname, 'out.mp3');
        nock(API)
            .get('/dubbing/xyz')
            .reply(200, { status: 'dubbed', target_languages: ['de'] });
        nock(API)
            .get('/dubbing/xyz/audio/de')
            .reply(200, 'sound');

        const result = await downloadDubbingAudio('key', 'xyz', 'de', outPath, { maxRetries: 2, retryDelay: 10 });
        const data = fs.readFileSync(outPath, 'utf8');
        fs.unlinkSync(outPath);
        expect(result).toBe(outPath);
        expect(data).toBe('sound');
    });

    test('Download klappt nach zweitem Versuch', async () => {
        const outPath = path.join(__dirname, 'retry.mp3');
        nock(API)
            .get('/dubbing/retry')
            .reply(200, { status: 'dubbed', target_languages: ['de'] });
        nock(API)
            .get('/dubbing/retry/audio/de')
            .reply(500, 'dubbing_not_found')
            .get('/dubbing/retry/audio/de')
            .reply(200, 'sound');

        const result = await downloadDubbingAudio('key', 'retry', 'de', outPath, { maxRetries: 2, retryDelay: 10 });
        const data = fs.readFileSync(outPath, 'utf8');
        fs.unlinkSync(outPath);
        expect(result).toBe(outPath);
        expect(data).toBe('sound');
    });

    test('waitForDubbing beendet sich bei Erfolg', async () => {
        nock(API)
            .get('/dubbing/success')
            .reply(200, { status: 'dubbed', target_languages: ['de'] });

        await expect(waitForDubbing('key', 'success', 'de', 3)).resolves.toBeUndefined();
    });

    test('waitForDubbing nutzt targetLang-Parameter', async () => {
        nock(API)
            .get('/dubbing/frjob')
            .reply(200, { status: 'dubbed', target_languages: ['fr'] });

        await expect(waitForDubbing('key', 'frjob', 'fr', 3)).resolves.toBeUndefined();
    });

    test('waitForDubbing wirft bei failed', async () => {
        nock(API)
            .get('/dubbing/bad')
            .reply(200, { status: 'failed', error: 'kaputt' });

        await expect(waitForDubbing('key', 'bad', 'de', 3)).rejects.toThrow('kaputt');
    });

    test('waitForDubbing gibt Timeout zurück', async () => {
        nock(API)
            .get('/dubbing/slow')
            .reply(200, { status: 'dubbing', target_languages: [] });

        await expect(waitForDubbing('key', 'slow', 'de', 3)).rejects.toThrow('Dubbing nicht fertig');
    });

    test('waitForDubbing meldet fehlendes target_lang', async () => {
        nock(API)
            .get('/dubbing/nolang')
            .reply(200, { status: 'dubbed', target_languages: [] });

        const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        await expect(waitForDubbing('key', 'nolang', 'de', 3)).rejects.toThrow('Dubbing nicht fertig');
        expect(errSpy).toHaveBeenCalledWith('target_lang nicht gesetzt?');
        errSpy.mockRestore();
    });

    test('isDubReady liefert true bei fertig', async () => {
        nock(API)
            .get('/dubbing/777')
            .reply(200, { status: 'dubbed', target_languages: ['de'] });

        await expect(isDubReady('777', 'de', 'key')).resolves.toBe(true);
    });

    test('isDubReady liefert false bei unfertig', async () => {
        nock(API)
            .get('/dubbing/888')
            .reply(200, { status: 'dubbing', target_languages: [] });

        await expect(isDubReady('888', 'de', 'key')).resolves.toBe(false);
    });
});
