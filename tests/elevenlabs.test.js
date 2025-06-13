const fs = require('fs');
const nock = require('nock');
const path = require('path');

const { createDubbing, getDubbingStatus, downloadDubbingAudio, getDefaultVoiceSettings, waitForDubbing } = require('../elevenlabs');

// Basis-URL der API
const API = 'https://api.elevenlabs.io';

// Temporäre Audiodatei für die Tests
const tempAudio = path.join(__dirname, 'temp.mp3');

beforeAll(() => {
    fs.writeFileSync(tempAudio, 'dummy');
});

afterAll(() => {
    fs.unlinkSync(tempAudio);
});

afterEach(() => {
    nock.cleanAll();
});

describe('ElevenLabs API', () => {
    test('erfolgreicher Dubbing-Auftrag mit voice_settings', async () => {
        nock(API)
            .post('/v1/dubbing', body => body.includes('voice_settings'))
            .reply(200, { id: '123' });

        const result = await createDubbing('key', tempAudio, 'de', { speed: 1.2 });
        expect(result).toEqual({ id: '123' });
    });

    test('fehlerhafte Antwort bei createDubbing', async () => {
        nock(API)
            .post('/v1/dubbing')
            .reply(500, 'Fehler');

        await expect(createDubbing('key', tempAudio)).rejects.toThrow('Fehler beim Dubbing');
    });

    test('Download-Fehler', async () => {
        nock(API)
            .get('/v1/dubbing/abc')
            .reply(200, { status: 'dubbed', progress: { langs: { de: { state: 'finished' } } } });
        nock(API)
            .get('/v1/dubbing/abc/audio/de')
            .times(4)
            .reply(404, 'not found');

        await expect(downloadDubbingAudio('key', 'abc', 'de', 'out.mp3')).rejects.toThrow('Download fehlgeschlagen');
    });


    test('Download erfolgreich', async () => {
        const outPath = path.join(__dirname, 'out.mp3');
        nock(API)
            .get('/v1/dubbing/xyz')
            .reply(200, { status: 'dubbed', progress: { langs: { de: { state: 'finished' } } } });
        nock(API)
            .get('/v1/dubbing/xyz/audio/de')
            .reply(200, 'sound');

        const result = await downloadDubbingAudio('key', 'xyz', 'de', outPath);
        const data = fs.readFileSync(outPath, 'utf8');
        fs.unlinkSync(outPath);
        expect(result).toBe(outPath);
        expect(data).toBe('sound');
    });

    test('Download klappt nach zweitem Versuch', async () => {
        const outPath = path.join(__dirname, 'retry.mp3');
        nock(API)
            .get('/v1/dubbing/retry')
            .reply(200, { status: 'dubbed', progress: { langs: { de: { state: 'finished' } } } });
        nock(API)
            .get('/v1/dubbing/retry/audio/de')
            .reply(500, 'dubbing_not_found')
            .get('/v1/dubbing/retry/audio/de')
            .reply(200, 'sound');

        const result = await downloadDubbingAudio('key', 'retry', 'de', outPath);
        const data = fs.readFileSync(outPath, 'utf8');
        fs.unlinkSync(outPath);
        expect(result).toBe(outPath);
        expect(data).toBe('sound');
    });

    test('Status erfolgreich abgefragt', async () => {
        nock(API)
            .get('/v1/dubbing/123')
            .reply(200, { status: 'dubbed' });

        const result = await getDubbingStatus('key', '123');
        expect(result).toEqual({ status: 'dubbed' });
    });

    test('Fehler bei getDubbingStatus', async () => {
        nock(API)
            .get('/v1/dubbing/123')
            .reply(500, 'kaputt');

        await expect(getDubbingStatus('key', '123')).rejects.toThrow('Status-Abfrage fehlgeschlagen');
    });

    test('Default-Settings erfolgreich abgerufen', async () => {
        nock(API)
            .get('/v1/voices/settings/default')
            .reply(200, { stability: 1 });

        const result = await getDefaultVoiceSettings('key');
        expect(result).toEqual({ stability: 1 });
    });

    test('Fehler bei getDefaultVoiceSettings', async () => {
        nock(API)
            .get('/v1/voices/settings/default')
            .reply(500, 'kaputt');

        await expect(getDefaultVoiceSettings('key')).rejects.toThrow('Fehler beim Abrufen der Default-Settings');
    });


    // Neuer Test für GET /v1/dubbing/{id} mit Erfolg
    test('getDubbingStatus liefert JSON', async () => {
        nock(API)
            .get('/v1/dubbing/42')
            .reply(200, { status: 'dubbed', progress: 100 });

        const res = await getDubbingStatus('key', '42');
        expect(res).toEqual({ status: 'dubbed', progress: 100 });
    });

    // Neuer Test für GET /v1/dubbing/{id} mit Fehler
    test('getDubbingStatus wirft Fehler', async () => {
        nock(API)
            .get('/v1/dubbing/42')
            .reply(404, 'nicht gefunden');

        await expect(getDubbingStatus('key', '42')).rejects.toThrow('Status-Abfrage fehlgeschlagen');
    });

    // Simuliere Polling-Abbruch bei failed
    test('Polling stoppt bei Status failed', async () => {
        const scope = nock(API)
            .get('/v1/dubbing/fail')
            .reply(200, { status: 'failed', error: 'kaputt' });

        let status = 'dubbing';
        let error = '';
        for (let i = 0; i < 3 && status === 'dubbing'; i++) {
            const res = await getDubbingStatus('key', 'fail');
            status = res.status;
            if (status === 'failed') {
                error = res.error;
                break;
            }
        }

        expect(scope.isDone()).toBe(true);
        expect(status).toBe('failed');
        expect(error).toBe('kaputt');
    });

    test('waitForDubbing beendet sich bei Erfolg', async () => {
        nock(API)
            .get('/v1/dubbing/success')
            .reply(200, { status: 'dubbed', progress: { langs: { de: { state: 'finished' } } } });

        await expect(waitForDubbing('key', 'success', 'de', 3)).resolves.toBeUndefined();
    });

    test('waitForDubbing wirft bei failed', async () => {
        nock(API)
            .get('/v1/dubbing/bad')
            .reply(200, { status: 'failed', error: 'kaputt' });

        await expect(waitForDubbing('key', 'bad', 'de', 3)).rejects.toThrow('kaputt');
    });

    test('waitForDubbing gibt Timeout zurück', async () => {
        nock(API)
            .get('/v1/dubbing/slow')
            .reply(200, { status: 'dubbing' });

        await expect(waitForDubbing('key', 'slow', 'de', 3)).rejects.toThrow('Dubbing nicht fertig');
    });
});
