/**
 * @jest-environment jsdom
 */

// Testet das Laden und Speichern der Video-Bookmarks

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

describe('Video-Bookmarks', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('Laden und Speichern funktioniert', async () => {
        let list = await videoApi.loadBookmarks();
        expect(list).toEqual([]);
        const neu = [{ url: 'u', title: 't', time: 0 }];
        await videoApi.saveBookmarks(neu);
        list = await videoApi.loadBookmarks();
        expect(list).toEqual(neu);
    });

    test('Sortierung nach Titel', async () => {
        const unsortiert = [
            { url: 'b', title: 'Beta', time: 0 },
            { url: 'a', title: 'Alpha', time: 0 }
        ];
        await videoApi.saveBookmarks(unsortiert);
        let list = await videoApi.loadBookmarks();
        list.push({ url: 'c', title: 'Gamma', time: 0 });
        list.sort((a, b) => a.title.localeCompare(b.title, 'de'));
        await videoApi.saveBookmarks(list);
        const erwartet = [
            { url: 'a', title: 'Alpha', time: 0 },
            { url: 'b', title: 'Beta', time: 0 },
            { url: 'c', title: 'Gamma', time: 0 }
        ];
        list = await videoApi.loadBookmarks();
        expect(list).toEqual(erwartet);
    });

    test('Eintrag entfernen', async () => {
        const liste = [
            { url: 'a', title: 'Alpha', time: 0 },
            { url: 'b', title: 'Beta', time: 0 }
        ];
        await videoApi.saveBookmarks(liste);
        let list = await videoApi.loadBookmarks();
        list.splice(0, 1); // ersten Eintrag loeschen
        await videoApi.saveBookmarks(list);
        list = await videoApi.loadBookmarks();
        expect(list).toEqual([{ url: 'b', title: 'Beta', time: 0 }]);
    });
});
