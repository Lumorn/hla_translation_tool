const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadScanFolder() {
    const html = fs.readFileSync(path.join(__dirname, '../hla_translation_tool.html'), 'utf8');
    const startMarker = '// =========================== SCANFOLDER IMPROVED START';
    const endMarker = '// =========================== SCANFOLDER IMPROVED END';
    const start = html.indexOf(startMarker);
    const end = html.indexOf(endMarker, start);
    const codeLines = html.slice(start, end).split('\n').slice(1).join('\n');

    const ctx = {
        deAudioCache: {},
        filePathDatabase: {},
        audioFileCache: {},
        setTimeout: (fn) => setTimeout(fn, 0),
        document: {
            getElementById: jest.fn(() => ({
                classList: { add: jest.fn(), remove: jest.fn() },
                style: {},
                textContent: ''
            }))
        },
        extractRelevantFolder: jest.fn(() => 'testFolder'),
        saveFilePathDatabase: jest.fn(),
        cleanupMissingFolders: jest.fn(() => ({ deletedFolders: 0 })),
        cleanupMissingFiles: jest.fn(() => 0),
        updateAllProjectsAfterScan: jest.fn(),
        updateStatus: jest.fn(),
        updateFileAccessStatus: jest.fn(),
        console
    };

    vm.createContext(ctx);
    vm.runInContext(codeLines, ctx);
    return ctx;
}

describe('scanFolder', () => {
    test('DE-Dateien landen nur im deAudioCache', done => {
        const ctx = loadScanFolder();
        function File(path) { this.webkitRelativePath = path; }
        ctx.scanFolder({ files: [ new File('DE/vo/test/deFile.mp3') ] });
        setTimeout(() => {
            expect(ctx.deAudioCache).toHaveProperty('vo/test/deFile.mp3');
            expect(ctx.filePathDatabase).toEqual({});
            done();
        }, 20);
    });

    test('EN-Dateien werden korrekt eingetragen', done => {
        const ctx = loadScanFolder();
        function File(path) { this.webkitRelativePath = path; }
        ctx.scanFolder({ files: [
            new File('EN/vo/test/enFile.mp3'),
            new File('DE/vo/test/deFile.mp3')
        ] });
        setTimeout(() => {
            expect(ctx.filePathDatabase).toHaveProperty('enFile.mp3');
            expect(ctx.filePathDatabase['enFile.mp3'][0]).toMatchObject({
                folder: 'testFolder',
                fullPath: 'vo/test/enFile.mp3'
            });
            expect(ctx.deAudioCache).toHaveProperty('vo/test/deFile.mp3');
            expect(ctx.filePathDatabase).not.toHaveProperty('deFile.mp3');
            done();
        }, 20);
    });
});
