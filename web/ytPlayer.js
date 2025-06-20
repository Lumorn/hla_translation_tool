// Steuert den eingebetteten YouTube-Player

// extrahiert die Video-ID aus einer YouTube-URL
export function extractYoutubeId(url) {
    const m = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
    return m ? m[1] : '';
}

// öffnet den Player für ein Bookmark
export function openPlayer(bookmark, index) {
    const div = document.getElementById('ytPlayerBox');
    if (!div) return;
    div.style.display = 'block';
    div.innerHTML = `<iframe id="ytIframe" width="100%" height="100%"
        src="https://www.youtube.com/embed/${extractYoutubeId(bookmark.url)}?start=${Math.floor(bookmark.time)}&enablejsapi=1"
        allow="autoplay; fullscreen" frameborder="0"></iframe>`;
    if (window.currentYT && window.currentYT.destroy) {
        window.currentYT.destroy();
    }
    window.currentYT = new YT.Player('ytIframe');

    // lokale Speicherung der Abspielposition alle 2 Sekunden
    let currentTime = bookmark.time;
    const interval = setInterval(async () => {
        if (window.currentYT &&
            window.currentYT.getPlayerState() === YT.PlayerState.PLAYING) {
            currentTime = window.currentYT.getCurrentTime();
        }
    }, 2000);

    // stellt sicher, dass Zeit und Interval auch beim Schließen verfügbar sind
    window.__ytPlayerState = { bookmark, index, interval, get time() { return currentTime; } };
}

// blendet den Player wieder aus
// blendet den Player wieder aus und speichert die letzte Position
export async function closePlayer() {
    const div = document.getElementById('ytPlayerBox');
    if (!div) return;
    div.style.display = 'none';
    div.innerHTML = '';
    // vor dem Zerstören die exakte Abspielzeit sichern, falls möglich
    let exactTime;
    if (window.currentYT && typeof window.currentYT.getCurrentTime === 'function') {
        try {
            exactTime = window.currentYT.getCurrentTime();
        } catch (e) {
            // ignorieren und später auf time zurückfallen
        }
    }

    if (window.currentYT && window.currentYT.destroy) {
        window.currentYT.destroy();
    }
    window.currentYT = null;

    if (window.__ytPlayerState) {
        clearInterval(window.__ytPlayerState.interval);
        const { bookmark, index, time } = window.__ytPlayerState;
        // falls vorhanden, verwende die exakte Zeit des Players
        bookmark.time = (typeof exactTime === 'number') ? exactTime : time;
        const list = await window.videoApi.loadBookmarks();
        list[index] = bookmark;
        await window.videoApi.saveBookmarks(list);
        window.__ytPlayerState = null;
    }
}

// Node-kompatibler Export für Tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { openPlayer, closePlayer, extractYoutubeId };
}
