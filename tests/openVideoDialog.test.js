/**
 * @jest-environment jsdom
 */

// nutzt dieselbe Technik wie in anderen Tests, um die Funktionen zu laden
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

describe('openVideoDialog und Slider', () => {
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
                    <button id="videoDelete"></button>
                    <button id="videoClose"></button>
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
                seekTo: jest.fn()
            })),
            PlayerState: { PLAYING: 1, PAUSED: 2, CUED: 5 }
        };
    });

    test('öffnet Dialog und setzt iframe-src', () => {
        const { openVideoDialog } = loadModule();
        const bookmark = { url: 'https://www.youtube.com/watch?v=abc', title: 't', time: 5 };
        openVideoDialog(bookmark, 1);
        const dlg = document.getElementById('videoMgrDialog');
        const player = document.getElementById('videoPlayerSection');
        const iframe = document.getElementById('videoPlayerFrame');
        expect(player.dataset.index).toBe('1');
        expect(iframe.src).toContain('https://www.youtube.com/embed/abc?start=5');
        expect(window.__ytPlayerState).not.toBeNull();
    });

    test('Slider bewegt den Player', () => {
        const { openVideoDialog } = loadModule();
        const bookmark = { url: 'https://youtu.be/xyz', title: 't', time: 0 };
        openVideoDialog(bookmark, 0);
        const slider = document.getElementById('videoSlider');
        window.currentYT.seekTo.mockClear();
        slider.value = '42';
        slider.oninput();
        expect(window.currentYT.seekTo).toHaveBeenCalledWith(42, true);
    });

    test('zeigt Meldung bei fehlender YT-API', () => {
        window.YT = undefined;
        const { openVideoDialog } = loadModule();
        const bookmark = { url: 'https://youtu.be/xyz', title: 't', time: 0 };
        openVideoDialog(bookmark, 0);
        const err = document.querySelector('.yt-error');
        expect(err).not.toBeNull();
    });
});
