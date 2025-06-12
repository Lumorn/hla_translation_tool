const fs = require('fs');
const nock = require('nock');
const path = require('path');

const { createDubbing, getDubbingStatus, downloadDubbingAudio } = require('../elevenlabs');

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
});
