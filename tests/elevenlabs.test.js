const fs = require('fs');
const nock = require('nock');
const path = require('path');

const { createDubbing, getDubbingStatus, downloadDubbingAudio, getDefaultVoiceSettings } = require('../elevenlabs');

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
    test('erfolgreicher Dubbing-Auftrag', async () => {
        nock(API)
            .post('/v1/dubbing')
            .reply(200, { id: '123' });

        const result = await createDubbing('key', tempAudio);
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
            .get('/v1/dubbing/abc/audio/de')
            .reply(404, 'not found');

        await expect(downloadDubbingAudio('key', 'abc', 'de', 'out.mp3')).rejects.toThrow('Download fehlgeschlagen');
    });

    test('Download erfolgreich', async () => {
        const outPath = path.join(__dirname, 'out.mp3');
        nock(API)
            .get('/v1/dubbing/xyz/audio/de')
            .reply(200, 'sound');

        const result = await downloadDubbingAudio('key', 'xyz', 'de', outPath);
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
});
