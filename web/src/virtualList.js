/**
 * Einfache virtuelle Liste: rendert nur sichtbare Zeilen.
 * Diese Implementierung dient als Grundlage für große Tabellen.
 * @param {HTMLElement} container Scroll-Container mit position:relative
 * @param {number} rowHeight Höhe einer Zeile in Pixeln
 * @param {function(any,number):HTMLElement} renderRow Funktion zum Aufbau einer Zeile
 */
export function createVirtualList(container, rowHeight, renderRow) {
    const spacer = document.createElement('div');
    spacer.style.position = 'relative';
    container.appendChild(spacer);

    let items = [];

    // Aktualisiert die angezeigten Zeilen basierend auf der Scroll-Position
    function render() {
        const scrollTop = container.scrollTop;
        const start = Math.floor(scrollTop / rowHeight);
        const end = Math.min(items.length, start + Math.ceil(container.clientHeight / rowHeight) + 1);
        // Alte Zeilen entfernen
        Array.from(spacer.children).forEach(ch => ch.remove());
        for (let i = start; i < end; i++) {
            const el = renderRow(items[i], i);
            el.style.position = 'absolute';
            el.style.top = (i * rowHeight) + 'px';
            spacer.appendChild(el);
        }
    }

    // Setzt die darzustellenden Elemente und Gesamt-Höhe
    function setItems(list) {
        items = list || [];
        spacer.style.height = (items.length * rowHeight) + 'px';
        render();
    }

    container.addEventListener('scroll', render);

    return { setItems };
}
