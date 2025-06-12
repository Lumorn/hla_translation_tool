const nock = require('nock');

// Basis-URL der API
const API = 'https://api.elevenlabs.io';

afterEach(() => {
    nock.cleanAll();
});

describe('Manual Dub', () => {
    test('csv_file und voice_id werden übermittelt', async () => {
        const scope = nock(API)
            .post('/v1/dubbing', body => {
                const str = body.toString();
                return str.includes('name="csv_file"') &&
                       str.includes('name="mode"') &&
                       str.includes('manual') &&
                       str.includes('name="voice_id"');
            })
            .reply(200, { id: '1' });

        const form = new FormData();
        form.append('file', new File(['dummy'], 'audio.mp3'));
        form.append('target_lang', 'de');
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
                       !str.includes('name="voice_id"');
            })
            .reply(200, { id: '2' });

        const form = new FormData();
        form.append('file', new File(['dummy'], 'audio.mp3'));
        form.append('target_lang', 'de');
        form.append('mode', 'manual');
        form.append('dubbing_studio', 'true');
        form.append('csv_file', new File(['speaker,start,end,text,text'], 'input.csv'));

        await fetch(`${API}/v1/dubbing`, { method: 'POST', body: form });

        expect(scope.isDone()).toBe(true);
    });
});
