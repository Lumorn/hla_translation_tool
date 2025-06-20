/**
 * @jest-environment jsdom
 */

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
        } catch (e) {}
        return true;
    }
};

describe('deleteCurrentVideo', () => {
    beforeEach(() => {
        localStorage.clear();
        document.body.innerHTML = '<dialog id="videoPlayerDialog"><iframe id="videoPlayerFrame"></iframe></dialog>';
        window.videoApi = videoApi;
        window.currentYT = null;
    });

    test('entfernt den aktuellen Bookmark', async () => {
        const fs = require('fs');
        const vm = require('vm');
        const path = require('path');
        const code = fs.readFileSync(path.join(__dirname, '../web/ytPlayer.js'), 'utf8')
            .replace(/export\s+(async\s+)?function/g, '$1function');
        const sandbox = { module: { exports: {} }, window, document, setInterval, clearInterval, confirm: () => true };
        vm.runInNewContext(code, sandbox);
        const { deleteCurrentVideo } = sandbox.module.exports;
        await videoApi.saveBookmarks([
            { url: 'a', title: 'Alpha', time: 0 },
            { url: 'b', title: 'Beta', time: 0 }
        ]);
        const interval = setInterval(() => {}, 1000);
        const bookmark = { url: 'a', title: 'Alpha', time: 0 };
        window.__ytPlayerState = { bookmark, index: 0, interval, get time() { return 0; } };

        await deleteCurrentVideo();

        const list = await videoApi.loadBookmarks();
        expect(list).toEqual([{ url: 'b', title: 'Beta', time: 0 }]);
    });
});
