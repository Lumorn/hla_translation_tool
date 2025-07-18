const fs = require('fs');
const nock = require('nock');
const path = require('path');

// Tests dürfen länger dauern, da Downloads bis zu 10 Versuche brauchen
jest.setTimeout(30000);

const { createDubbing, getDubbingStatus, downloadDubbingAudio, getDefaultVoiceSettings, waitForDubbing, isDubReady } = require('../elevenlabs');

// Basis-URL der API
const API = 'https://api.elevenlabs.io/v1';

// Temporäre Audiodatei für die Tests
const tempAudio = path.join(__dirname, 'temp.mp3');

beforeAll(() => {
    fs.writeFileSync(tempAudio, 'dummy');
});

afterAll(() => {
    // Datei nur löschen, wenn sie tatsächlich existiert
    if (fs.existsSync(tempAudio)) {
        fs.unlinkSync(tempAudio);
    }
});

afterEach(() => {
    nock.cleanAll();
});

describe('ElevenLabs API', () => {
    test('erfolgreicher Dubbing-Auftrag ohne Voice-ID', async () => {
        nock(API)
            .post('/dubbing', body => body.includes('disable_voice_cloning') &&
                                     body.includes('name="target_lang"') &&
                                     body.includes('de') &&
                                     !body.includes('fr'))
            .reply(200, { dubbing_id: '123', expected_duration_sec: 1 });

        const result = await createDubbing({
            audioFile: tempAudio,
            csvContent: 'speaker,start_time,end_time,transcription,translation\n',
            targetLang: 'fr',
            apiKey: 'key'
        });
        expect(result).toEqual({ dubbing_id: '123', expected_duration_sec: 1 });
    });

    test('Dubbing mit Voice-ID übermittelt voice_id', async () => {
        nock(API)
            .post('/dubbing', body => body.includes('voice_id') &&
                                     !body.includes('disable_voice_cloning'))
            .reply(200, { dubbing_id: '124', expected_duration_sec: 1 });

        const result = await createDubbing({
            audioFile: tempAudio,
            csvContent: 'speaker,start_time,end_time,transcription,translation\n',
            voiceId: 'abc',
            apiKey: 'key'
        });
        expect(result).toEqual({ dubbing_id: '124', expected_duration_sec: 1 });
    });

    test('fehlerhafte Antwort bei createDubbing', async () => {
        nock(API)
            .post('/dubbing')
            .reply(500, 'Fehler');

        await expect(createDubbing({ audioFile: tempAudio, csvContent: '', apiKey: 'key' })).rejects.toThrow('Create dubbing failed');
    });

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

    test('Status erfolgreich abgefragt', async () => {
        nock(API)
            .get('/dubbing/123')
            .reply(200, { status: 'complete' });

        const result = await getDubbingStatus('key', '123');
        expect(result).toEqual({ status: 'complete' });
    });

    test('Fehler bei getDubbingStatus', async () => {
        nock(API)
            .get('/dubbing/123')
            .reply(500, 'kaputt');

        await expect(getDubbingStatus('key', '123')).rejects.toThrow('Status-Abfrage fehlgeschlagen');
    });

    test('Default-Settings erfolgreich abgerufen', async () => {
        nock(API)
            .get('/voices/settings/default')
            .reply(200, { stability: 1 });

        const result = await getDefaultVoiceSettings('key');
        expect(result).toEqual({ stability: 1 });
    });

    test('Fehler bei getDefaultVoiceSettings', async () => {
        nock(API)
            .get('/voices/settings/default')
            .reply(500, 'kaputt');

        await expect(getDefaultVoiceSettings('key')).rejects.toThrow('Fehler beim Abrufen der Default-Settings');
    });


    // Neuer Test für GET /dubbing/{id} mit Erfolg
    test('getDubbingStatus liefert JSON', async () => {
        nock(API)
            .get('/dubbing/42')
            .reply(200, { status: 'complete', progress: 100 });

        const res = await getDubbingStatus('key', '42');
        expect(res).toEqual({ status: 'complete', progress: 100 });
    });

    // Neuer Test für GET /dubbing/{id} mit Fehler
    test('getDubbingStatus wirft Fehler', async () => {
        nock(API)
            .get('/dubbing/42')
            .reply(404, 'nicht gefunden');

        await expect(getDubbingStatus('key', '42')).rejects.toThrow('Status-Abfrage fehlgeschlagen');
    });

    // Simuliere Polling-Abbruch bei failed
    test('Polling stoppt bei Status failed', async () => {
        const scope = nock(API)
            .get('/dubbing/fail')
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
