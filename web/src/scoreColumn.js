import { withUnit } from './unitFormat.js';

// Erzeugt den HTML-Code für eine Score-Zelle und bindet Tooltip sowie Klick
// Ermittelt die passende CSS-Klasse basierend auf dem Score
// Liefert die CSS-Klasse abhängig von der prozentualen Bewertung
// Liefert die CSS-Klasse abhängig von der prozentualen Bewertung
export function scoreClass(score) {
    if (score === undefined || score === null) return 'score-none';
    // Ab 95 grün, 80–94 gelb, darunter rot
    return score >= 95 ? 'score-high' : score >= 80 ? 'score-medium' : 'score-low';
}

// Farbwerte passend zu den Score-Klassen
export const SCORE_COLORS = {
    'score-none': '#666',
    'score-low': '#A33',
    'score-medium': '#BB8',
    'score-high': '#3A3'
};

// Gibt die zur Score-Farbe passende Schriftfarbe zurück
export function getContrastingTextColor(hex) {
    const c = hex.toLowerCase();
    if (c === '#bb8') return '#000'; // gelb -> schwarze Schrift
    if (c === '#3a3' || c === '#a33') return '#fff'; // grün/rot -> weiße Schrift
    if (hex.length === 4) hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    return brightness > 186 ? '#000' : '#fff';
}

// Erzeugt den HTML-Code für eine Score-Zelle und bindet Tooltip sowie Klick
export function scoreCellTemplate(file, escapeHtml) {
    const cls = scoreClass(file.score);
    const color = getContrastingTextColor(SCORE_COLORS[cls]);
    const noScore = file.score === undefined || file.score === null;
    const sug = escapeHtml(file.suggestion || '');
    const com = escapeHtml(file.comment || '');
    // Score immer als Prozentwert mit geschütztem Leerzeichen anzeigen
    const scoreText = withUnit(noScore ? 0 : file.score, '%');
    // Tooltip auch per title-Attribut hinterlegen, damit das gesamte Feld reagiert
    return `<td class="score-cell ${cls}" title="${com}" style="color:${color}" data-suggestion="${sug}" data-comment="${com}">${scoreText}</td>`;
}

export function attachScoreHandlers(tbody, files) {
    tbody.querySelectorAll('.score-cell').forEach(cell => {
        const id = Number(cell.parentElement?.dataset.id);
        const comment = cell.dataset.comment;
        // Beim Überfahren erscheint der Kommentar
        const tooltipText = comment;
        cell.addEventListener('mouseenter', ev => openScoreTooltip(ev, tooltipText));
        cell.addEventListener('mouseleave', closeScoreTooltip);
        // Klick zeigt nur noch den Kommentar
        cell.addEventListener('click', ev => openScoreTooltip(ev, tooltipText));
    });
}

// Tooltip anzeigen
export function openScoreTooltip(ev, text) {
    closeScoreTooltip();
    if (!text) return;
    const box = document.createElement('div');
    box.className = 'info-tooltip';
    box.id = 'scoreTooltip';
    box.textContent = text;
    box.style.left = ev.clientX + 'px';
    box.style.top = ev.clientY + 'px';
    document.body.appendChild(box);
}

export function closeScoreTooltip() {
    const box = document.getElementById('scoreTooltip');
    if (box) box.remove();
}

function applySuggestion(id, files) {
    const file = files.find(f => f.id === id);
    if (!file || !file.suggestion) return;
    file.deText = file.suggestion;
    window.isDirty = true;
    const row = document.querySelector(`tr[data-id='${id}']`);
    const deCell = row?.querySelectorAll('textarea.text-input')[1];
    if (deCell) {
        deCell.value = file.deText;
        deCell.classList.add('blink-blue');
        setTimeout(() => deCell.classList.remove('blink-blue'), 600);
    }
}

// Export für Node-Tests
if (typeof module !== 'undefined') {
    module.exports = {
        scoreClass,
        scoreCellTemplate,
        attachScoreHandlers,
        getContrastingTextColor,
        SCORE_COLORS,
        openScoreTooltip,
        closeScoreTooltip
    };
}
