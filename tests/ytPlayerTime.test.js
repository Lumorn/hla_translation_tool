/**
 * @jest-environment jsdom
 */


// simulierte Video-API fuer das Speichern der Bookmarks
const videoApi = {
    loadBookmarks: async () => {
        const data = localStorage.getItem('hla_videoBookmarks');
        try {
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },
    saveBookmarks: async list => {
        try {
            localStorage.setItem('hla_videoBookmarks', JSON.stringify(list ?? []));
        } catch (e) {
            // ignorieren
        }
        return true;
    }
};

describe('YouTube-Player Zeituebernahme', () => {
    beforeEach(() => {
        localStorage.clear();
        document.body.innerHTML = '<div id="ytPlayerBox"></div>';
        window.videoApi = videoApi;
    });

    test('closePlayer speichert exakte Zeit', async () => {
        const fs = require('fs');
        const vm = require('vm');
        const path = require('path');
        const code = fs.readFileSync(path.join(__dirname, '../web/ytPlayer.js'), 'utf8')
            .replace(/export\s+(async\s+)?function/g, '$1function');
        const sandbox = { module: { exports: {} }, window, document, setInterval, clearInterval };
        vm.runInNewContext(code, sandbox);
        const { closePlayer } = sandbox.module.exports;
        await videoApi.saveBookmarks([{ url: 'u', title: 't', time: 0 }]);

        const bookmark = { url: 'u', title: 't', time: 0 };
        const interval = setInterval(() => {}, 1000);
        window.currentYT = {
            getCurrentTime: () => 77,
            destroy: jest.fn()
        };
        window.__ytPlayerState = { bookmark, index: 0, interval, get time() { return 33; } };

        await closePlayer();

        const list = await videoApi.loadBookmarks();
        expect(list[0].time).toBe(77);
    });
});
