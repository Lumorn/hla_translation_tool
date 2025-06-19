function parseClosecaptionFile(content) {
    const map = new Map();
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
        const m = line.trim().match(/^"(\d+)"\s+"(.+)"$/);
        if (m) map.set(m[1], m[2]);
    }
    return map;
}
module.exports = { parseClosecaptionFile };
