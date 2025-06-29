// Erzeugt den HTML-Code für eine Score-Zelle und bindet Tooltip sowie Klick
// Ermittelt die passende CSS-Klasse basierend auf dem Score
// Liefert die CSS-Klasse abhängig von der prozentualen Bewertung
// Liefert die CSS-Klasse abhängig von der prozentualen Bewertung
export function scoreClass(score) {
    if (score === undefined || score === null) return 'score-none';
    return score >= 95 ? 'score-high' : score >= 85 ? 'score-medium' : 'score-low';
}

// Farbwerte passend zu den Score-Klassen
export const SCORE_COLORS = {
    'score-none': '#666',
    'score-low': '#A33',
    'score-medium': '#BB8',
    'score-high': '#3A3'
};

// Ermittelt bei heller Hintergrundfarbe automatisch schwarze Schrift
export function getContrastingTextColor(hex) {
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
    const title = escapeHtml([file.comment, file.suggestion].filter(Boolean).join(' - '));
    // Score immer als Prozentwert anzeigen
    const scoreText = noScore ? '0' : file.score;
    return `<td class="score-cell ${cls}" style="color:${color}" data-suggestion="${sug}" data-comment="${com}" title="${title}">${scoreText}%</td>`;
}

export function attachScoreHandlers(tbody, files) {
    tbody.querySelectorAll('.score-cell').forEach(cell => {
        const id = Number(cell.parentElement?.dataset.id);
        const suggestion = cell.dataset.suggestion;
        const comment = cell.dataset.comment;
        const tooltipText = [comment, suggestion].filter(Boolean).join(' - ');
        cell.addEventListener('mouseenter', ev => openScoreTooltip(ev, tooltipText));
        cell.addEventListener('mouseleave', closeScoreTooltip);
        if (suggestion) {
            cell.addEventListener('click', () => applySuggestion(id, files));
        }
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
