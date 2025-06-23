/**
 * @jest-environment jsdom
 */

// Hilfsfunktion zum Laden der Player-Funktionen
const fs = require('fs');
const vm = require('vm');
const path = require('path');

function loadModule() {
    const code = fs.readFileSync(path.join(__dirname, '../web/ytPlayer.js'), 'utf8')
        .replace(/export\s+(async\s+)?function/g, '$1function');
    const sandbox = { module: { exports: {} }, window, document, setInterval, clearInterval, YT: window.YT };
    vm.runInNewContext(code, sandbox);
    return sandbox.module.exports;
}

describe('OCR-Overlay sichtbar schalten', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        document.body.innerHTML = `
            <dialog id="videoMgrDialog">
                <div id="videoPlayerSection" class="video-player-section">
                    <span id="playerDialogTitle"></span>
                    <iframe id="videoPlayerFrame"></iframe>
                    <input type="range" id="videoSlider" />
                    <span id="videoCurrent"></span>
                    <span id="videoDuration"></span>
                    <button id="videoPlay"></button>
                    <button id="videoBack"></button>
                    <button id="videoForward"></button>
                    <button id="videoReload"></button>
                    <button id="ocrToggle"></button>
                    <button id="videoDelete"></button>
                    <button id="videoClose"></button>
                    <div id="ocrOverlay" class="hidden"></div>
                    <div id="ocrResultPanel"><pre id="ocrText"></pre></div>
                </div>
            </dialog>`;
        window.videoApi = { loadBookmarks: async () => [], saveBookmarks: async () => true };
        const dlg = document.getElementById('videoMgrDialog');
        dlg.showModal = jest.fn();
        window.dialogPolyfill = null;
        window.YT = {
            Player: jest.fn(() => ({
                getDuration: () => 100,
                getCurrentTime: () => 10,
                getPlayerState: () => 1,
                seekTo: jest.fn(),
                pauseVideo: jest.fn(),
                playVideo: jest.fn()
            })),
            PlayerState: { PLAYING: 1, PAUSED: 2, CUED: 5 }
        };
    });

    test('OCR-Overlay und Panel werden ein- und ausgeblendet', () => {
        const { openVideoDialog } = loadModule();
        const bookmark = { url: 'https://youtu.be/xyz', title: 't', time: 0 };
        openVideoDialog(bookmark, 0);
        const ocrBtn = document.getElementById('ocrToggle');
        const overlay = document.getElementById('ocrOverlay');
        const panel = document.getElementById('ocrResultPanel');

        // nach dem Öffnen bleibt das Panel sichtbar
        expect(overlay.classList.contains('hidden')).toBe(true);
        expect(panel.classList.contains('hidden')).toBe(false);

        // Aktivieren
        ocrBtn.click();
        expect(overlay.classList.contains('hidden')).toBe(false);
        expect(panel.classList.contains('hidden')).toBe(false);

        // Deaktivieren
        ocrBtn.click();
        expect(overlay.classList.contains('hidden')).toBe(true);
        expect(panel.classList.contains('hidden')).toBe(false);
    });
});
