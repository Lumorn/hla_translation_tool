const { repairFileExtensions } = require('../extensionUtils');

describe('repairFileExtensions', () => {
    test('aktualisiert geaenderte Endungen', () => {
        const projects = [{ files: [{ filename: 'test.mp3', folder: 'a', fullPath: 'a/test.mp3' }] }];
        const filePathDatabase = { 'test.wav': [{ folder: 'a', fullPath: 'a/test.wav' }] };
        const textDatabase = { 'a/test.mp3': { en: 'hi', de: 'hallo' } };
        const count = repairFileExtensions(projects, filePathDatabase, textDatabase);
        expect(count).toBe(1);
        expect(projects[0].files[0].filename).toBe('test.wav');
        expect(projects[0].files[0].fullPath).toBe('a/test.wav');
        expect(textDatabase['a/test.wav']).toEqual({ en: 'hi', de: 'hallo' });
        expect(textDatabase['a/test.mp3']).toBeUndefined();
    });

    test('kein Update wenn Datei vorhanden', () => {
        const projects = [{ files: [{ filename: 'ok.wav', folder: 'b', fullPath: 'b/ok.wav' }] }];
        const filePathDatabase = { 'ok.wav': [{ folder: 'b', fullPath: 'b/ok.wav' }] };
        const textDatabase = { 'b/ok.wav': { en: 'x' } };
        const count = repairFileExtensions(projects, filePathDatabase, textDatabase);
        expect(count).toBe(0);
        expect(projects[0].files[0].filename).toBe('ok.wav');
        expect(textDatabase['b/ok.wav']).toBeDefined();
    });
});
