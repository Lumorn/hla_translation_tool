// Hilfsfunktionen fuer YouTube-Videos
// Alle Kommentare sind auf Deutsch

// Extrahiert die Startzeit aus einer YouTube-URL
export function extractTime(url) {
    const m1 = url.match(/[?&#]t=([^&#]+)/);
    if (m1) {
        if (/^\d+$/.test(m1[1])) return Number(m1[1]);
        let sekunden = 0;
        m1[1].replace(/(\d+)(h|m|s)/g, (_, num, einheit) => {
            num = Number(num);
            if (einheit === 'h') sekunden += num * 3600;
            else if (einheit === 'm') sekunden += num * 60;
            else if (einheit === 's') sekunden += num;
        });
        return sekunden;
    }
    const m2 = url.match(/[?&#]start=(\d+)/);
    return m2 ? Number(m2[1]) : 0;
}

// CommonJS-Export fuer Tests
if (typeof module !== 'undefined') {
    module.exports = {
        extractTime
    };
}
