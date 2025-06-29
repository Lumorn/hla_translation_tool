// Erzeugt den HTML-Code für eine Score-Zelle und bindet Tooltip sowie Klick
export function scoreCellTemplate(file, escapeHtml) {
    const noScore = file.score === undefined || file.score === null;
    const cls = noScore
        ? 'score-none'
        : file.score >= 70
            ? 'score-high'
            : file.score >= 40
                ? 'score-medium'
                : 'score-low';
    const sug = escapeHtml(file.suggestion || '');
    const com = escapeHtml(file.comment || '');
    const title = escapeHtml([file.comment, file.suggestion].filter(Boolean).join(' - '));
    const scoreText = noScore ? '0' : file.score;
    return `<td class="score-cell ${cls}" data-suggestion="${sug}" data-comment="${com}" title="${title}">${scoreText}</td>`;
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
