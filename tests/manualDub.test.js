const nock = require('nock');

// Basis-URL der API
const API = 'https://api.elevenlabs.io';

afterEach(() => {
    nock.cleanAll();
});

let createDubbingCSV;
let startDubbing;
let storage;

function loadMain(lineEnd) {
    jest.resetModules();
    storage = {};
    if (lineEnd) storage['hla_lineEnding'] = lineEnd;
    global.document = { addEventListener: jest.fn() };
    global.window = { addEventListener: jest.fn() };
    global.localStorage = {
        getItem: key => storage[key] || null,
        setItem: (k, v) => { storage[k] = v; },
        removeItem: k => { delete storage[k]; },
        clear: () => { storage = {}; }
    };
    ({ createDubbingCSV, startDubbing } = require('../src/main.js'));
}

beforeEach(() => {
    loadMain('LF');
    global.openDubbingLog = jest.fn();
    global.addDubbingLog = jest.fn();
    global.updateStatus = jest.fn();
    global.findAudioInFilePathCache = jest.fn();
    global.loadAudioBuffer = jest.fn();
    global.files = [];
    global.folderCustomizations = {};
    global.elevenLabsApiKey = 'key';
    global.fetch = jest.fn();
});

describe('Manual Dub', () => {
    test('csv_file und voice_id werden übermittelt', async () => {
        const scope = nock(API)
            .post('/v1/dubbing', body => {
                const str = body.toString();
                return str.includes('name="csv_file"') &&
                       str.includes('name="mode"') &&
                       str.includes('manual') &&
                       str.includes('name="voice_id"') &&
                       str.includes('name="target_languages"');
            })
            .reply(200, { id: '1' });

        const form = new FormData();
        form.append('file', new File(['dummy'], 'audio.mp3'));
        form.append('target_lang', 'de');
        form.append('target_languages', '["de"]');
        form.append('mode', 'manual');
        form.append('dubbing_studio', 'true');
        form.append('csv_file', new File(['speaker,start,end,text,text'], 'input.csv'));
        form.append('voice_id', 'abc123');

        await fetch(`${API}/v1/dubbing`, { method: 'POST', body: form });

        expect(scope.isDone()).toBe(true);
    });

    test('voice_id ist optional', async () => {
        const scope = nock(API)
            .post('/v1/dubbing', body => {
                const str = body.toString();
                return str.includes('name="csv_file"') &&
                       str.includes('name="mode"') &&
                       str.includes('manual') &&
                       !str.includes('name="voice_id"') &&
                       str.includes('name="target_languages"');
            })
            .reply(200, { id: '2' });

        const form = new FormData();
        form.append('file', new File(['dummy'], 'audio.mp3'));
        form.append('target_lang', 'de');
        form.append('target_languages', '["de"]');
        form.append('mode', 'manual');
        form.append('dubbing_studio', 'true');
        form.append('csv_file', new File(['speaker,start,end,text,text'], 'input.csv'));

        await fetch(`${API}/v1/dubbing`, { method: 'POST', body: form });

        expect(scope.isDone()).toBe(true);
    });

    test('createDubbingCSV nutzt LF als Standard', async () => {
        const file = { enText: 'Hello', deText: 'Hallo', trimStartMs: 0, trimEndMs: 0 };
        const blob = createDubbingCSV(file, 1000);
        const text = await blob.text();
        expect(text).toBe('speaker,start_time,end_time,transcription,translation\n0,00:00:00.000,00:00:01.000,"Hello","Hallo"\n');
    });

    test('createDubbingCSV mit CRLF', async () => {
        loadMain('CRLF');
        const file = { enText: 'Hi', deText: 'Hallo', trimStartMs: 0, trimEndMs: 0 };
        const blob = createDubbingCSV(file, 1000);
        const text = await blob.text();
        expect(text).toBe('speaker,start_time,end_time,transcription,translation\r\n0,00:00:00.000,00:00:01.000,"Hi","Hallo"\r\n');
    });

    test('startDubbing bricht bei fehlender Übersetzung ab', async () => {
        const fileObj = { id: 1, filename: 'a', folder: 'f', enText: '', deText: '' };
        files.push(fileObj);
        findAudioInFilePathCache.mockReturnValue({ audioFile: new File(['x'], 'a.mp3') });
        loadAudioBuffer.mockResolvedValue({ length: 1000, sampleRate: 1000 });

        await startDubbing(1);

        expect(updateStatus).toHaveBeenCalledWith('Übersetzung fehlt');
        expect(fetch).not.toHaveBeenCalled();
    });

    test('ohne voice_id kein disable_voice_cloning', async () => {
        const fileObj = { id: 2, filename: 'b', folder: 'g', enText: 'hi', deText: 'hallo' };
        files.push(fileObj);
        findAudioInFilePathCache.mockReturnValue({ audioFile: new File(['x'], 'b.mp3') });
        loadAudioBuffer.mockResolvedValue({ length: 1000, sampleRate: 1000 });
        fetch.mockResolvedValue({ ok: true, json: async () => ({ dubbing_id: '1' }) });

        await startDubbing(2);

        const body = fetch.mock.calls[0][1].body;
        expect(body.get('voice_id')).toBeNull();
        expect(body.get('disable_voice_cloning')).toBeNull();
    });

    test('CSV endet mit Zeilenumbruch und quotet korrekt', async () => {
        const file = { enText: 'Hi "Alice"', deText: 'Hallo "Bob"', trimStartMs: 0, trimEndMs: 0 };
        const blob = createDubbingCSV(file, 1000);
        const text = await blob.text();
        expect(text.endsWith('\n')).toBe(true);
        expect(text).toContain('"Hi ""Alice"""');
        expect(text).toContain('"Hallo ""Bob"""');
    });
});
