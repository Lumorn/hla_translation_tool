/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const vm = require('vm');
const path = require('path');

function loadModule() {
    const code = fs.readFileSync(path.join(__dirname, '../web/ytPlayer.js'), 'utf8')
        .replace(/export\s+(async\s+)?function/g, '$1function');
    const sandbox = { module: { exports: {} }, window, document, setInterval, clearInterval, YT: window.YT, Blob, createImageBitmap };
    vm.runInNewContext(code, sandbox);
    return sandbox;
}

describe('OCR-Pipeline', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <dialog id="videoMgrDialog" open>
                <div id="videoPlayerSection">
                    <iframe id="videoPlayerFrame"></iframe>
                </div>
                <button id="ocrToggle" class="active"></button>
                <div id="ocrOverlay" style="top:0"></div>
                <div id="ocrResultPanel"><pre id="ocrText"></pre></div>
            </dialog>`;
        window.api = { captureFrame: jest.fn().mockResolvedValue(new Uint8Array([0])) };
        global.createImageBitmap = jest.fn(async () => ({ width: 10, height: 5 }));
        window.YT = { PlayerState: { PLAYING: 1, PAUSED: 2 } };
        window.positionOverlay = jest.fn();
    });

    test('captureAndOcr nutzt refineBlob', async () => {
        const sandbox = loadModule();
        sandbox.initOcrWorker = jest.fn(async () => true);
        sandbox.pruefeHelligkeit = jest.fn(async () => 0);
        jest.spyOn(sandbox, 'refineBlob').mockResolvedValue(new Blob(['x'], { type: 'image/png' }));

        await sandbox.captureAndOcr();

        expect(sandbox.refineBlob).toHaveBeenCalledWith(expect.any(Blob), expect.any(Object));
    });

    test('startAutoLoop startet nur bei PLAYING', () => {
        jest.useFakeTimers();
        const setSpy = jest.spyOn(global, 'setInterval');
        const sandbox = loadModule();
        const btn = document.getElementById('ocrToggle');
        const dlg = document.getElementById('videoMgrDialog');
        btn.classList.add('active');
        dlg.open = true;

        window.currentYT = { getPlayerState: () => window.YT.PlayerState.PAUSED };
        sandbox.startAutoLoop();
        expect(setSpy).not.toHaveBeenCalled();

        window.currentYT.getPlayerState = () => window.YT.PlayerState.PLAYING;
        sandbox.startAutoLoop();
        expect(setSpy).toHaveBeenCalled();

        setSpy.mockRestore();
    });
});
