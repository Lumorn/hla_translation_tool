/**
 * @jest-environment jsdom
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

function loadModule() {
    const code = fs.readFileSync(path.join(__dirname, '../web/ytPlayer.js'), 'utf8')
        .replace(/export\s+(async\s+)?function/g, '$1function');
    const sandbox = {
        module: { exports: {} },
        window,
        document,
        setInterval,
        clearInterval,
        YT: {
            Player: jest.fn(() => ({
                getDuration: () => 0,
                getCurrentTime: () => 0,
                getPlayerState: () => 1,
                seekTo: jest.fn(),
                pauseVideo: jest.fn(),
                playVideo: jest.fn()
            })),
            PlayerState: { PLAYING: 1, PAUSED: 2 }
        }
    };
    vm.runInNewContext(code, sandbox);
    return sandbox.module.exports;
}

describe('OCR-Debug-Fenster', () => {
    beforeEach(() => {
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
                    <button id="ocrDebug"></button>
                    <button id="videoDelete"></button>
                    <button id="videoClose"></button>
                    <div id="ocrOverlay"></div>
                    <div id="ocrResultPanel"><pre id="ocrText"></pre></div>
                </div>
            </dialog>`;
        window.dialogPolyfill = null;
        window.videoApi = { loadBookmarks: async () => [], saveBookmarks: async () => true };
        const dlg = document.getElementById('videoMgrDialog');
        dlg.showModal = jest.fn();
    });

    test('Fenster öffnet und schließt über den Debug-Button', () => {
        const { openVideoDialog } = loadModule();
        const bookmark = { url: 'https://youtu.be/xyz', title: 't', time: 0 };
        openVideoDialog(bookmark, 0);
        const btn = document.getElementById('ocrDebug');
        const openWin = { closed: false, document: { body: { innerHTML: '' }, title: '' }, close: jest.fn() };
        const openSpy = jest.spyOn(window, 'open').mockReturnValue(openWin);

        // erster Klick öffnet das Fenster
        btn.click();
        expect(btn.classList.contains('active')).toBe(true);
        expect(openSpy).toHaveBeenCalled();

        // zweiter Klick schließt es wieder
        btn.click();
        expect(btn.classList.contains('active')).toBe(false);
        expect(openWin.close).toHaveBeenCalled();

        openSpy.mockRestore();
    });
});
