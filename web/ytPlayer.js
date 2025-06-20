// YouTube-Player im eingebetteten Div steuern

// extrahiert die Video-ID aus einer YouTube-URL
function extractId(url) {
    const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
    return match ? match[1] : '';
}

// merkt sich die aktuelle Player-Instanz
let ytPlayer = null;

// öffnet den Player mit den Angaben aus dem Bookmark
export function openPlayer(bookmark) {
    const div = document.getElementById('ytPlayerBox');
    div.style.display = 'block';
    div.innerHTML = `<iframe id="ytIframe" width="100%" height="100%"
                src="https://www.youtube.com/embed/${extractId(bookmark.url)}?start=${Math.floor(bookmark.time)}&enablejsapi=1"
                allow="autoplay; fullscreen" frameborder="0"></iframe>`;
    if (ytPlayer) ytPlayer.destroy();
    ytPlayer = new YT.Player('ytIframe');
    window.currentYT = ytPlayer;
}

// schließt den Player wieder
export function closePlayer() {
    const div = document.getElementById('ytPlayerBox');
    div.style.display = 'none';
    div.innerHTML = '';
    if (ytPlayer) {
        ytPlayer.destroy();
        ytPlayer = null;
    }
    window.currentYT = null;
}
