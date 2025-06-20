// Steuert den eingebetteten YouTube-Player

// extrahiert die Video-ID aus einer YouTube-URL
function extractId(url) {
    const m = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
    return m ? m[1] : '';
}

// öffnet den Player für ein Bookmark
export function openPlayer(bookmark) {
    const div = document.getElementById('ytPlayerBox');
    if (!div) return;
    div.style.display = 'block';
    div.innerHTML = `<iframe id="ytIframe" width="100%" height="100%"
        src="https://www.youtube.com/embed/${extractId(bookmark.url)}?start=${Math.floor(bookmark.time)}&enablejsapi=1"
        allow="autoplay; fullscreen" frameborder="0"></iframe>`;
    if (window.currentYT && window.currentYT.destroy) {
        window.currentYT.destroy();
    }
    window.currentYT = new YT.Player('ytIframe');
}

// blendet den Player wieder aus
export function closePlayer() {
    const div = document.getElementById('ytPlayerBox');
    if (!div) return;
    div.style.display = 'none';
    div.innerHTML = '';
    if (window.currentYT && window.currentYT.destroy) {
        window.currentYT.destroy();
    }
    window.currentYT = null;
}
