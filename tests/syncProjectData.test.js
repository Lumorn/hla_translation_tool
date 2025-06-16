const { syncProjectData } = require('../extensionUtils');

describe('syncProjectData', () => {
    test('uebertraegt Texte und passt Endungen an', () => {
        const projects = [{ files: [{ filename: 'test.mp3', folder: 'a', fullPath: 'a/test.mp3', enText: 'hi', deText: 'hallo' }] }];
        const filePathDatabase = { 'test.wav': [{ folder: 'a', fullPath: 'a/test.wav' }] };
        const textDatabase = { 'a/test.mp3': { en: 'hi' } };
        const count = syncProjectData(projects, filePathDatabase, textDatabase);
        expect(count).toBe(1);
        expect(projects[0].files[0].filename).toBe('test.wav');
        expect(textDatabase['a/test.wav']).toEqual({ en: 'hi', de: 'hallo' });
        expect(textDatabase['a/test.mp3']).toBeUndefined();
    });

    test('fuellt fehlende Texte in bestehendem Eintrag', () => {
        const projects = [{ files: [{ filename: 'ok.wav', folder: 'b', fullPath: 'b/ok.wav', deText: 'gut' }] }];
        const filePathDatabase = { 'ok.wav': [{ folder: 'b', fullPath: 'b/ok.wav' }] };
        const textDatabase = { 'b/ok.wav': { en: 'fine' } };
        const count = syncProjectData(projects, filePathDatabase, textDatabase);
        expect(count).toBe(0);
        expect(textDatabase['b/ok.wav']).toEqual({ en: 'fine', de: 'gut' });
    });
});
