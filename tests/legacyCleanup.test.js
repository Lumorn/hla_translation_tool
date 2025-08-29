/** @jest-environment jsdom */

describe('cleanupLegacyLocalStorage', () => {
    beforeEach(() => {
        localStorage.clear();
        window.showToast = jest.fn();
    });

    test('entfernt Projekt- und Datei-Schlüssel', async () => {
        const { cleanupLegacyLocalStorage } = await import('../web/src/storage/legacyCleanup.mjs');
        localStorage.setItem('file-1', 'a');
        localStorage.setItem('project-1', 'b');
        localStorage.setItem('project-lock:1', 'lock');
        localStorage.setItem('andere', 'c');
        const count = cleanupLegacyLocalStorage();
        expect(count).toBe(2);
        expect(localStorage.getItem('file-1')).toBeNull();
        expect(localStorage.getItem('project-1')).toBeNull();
        expect(localStorage.getItem('project-lock:1')).toBe('lock');
        expect(localStorage.getItem('andere')).toBe('c');
        expect(window.showToast).toHaveBeenCalledWith('Alte LocalStorage-Daten entfernt (2)');
    });
});
