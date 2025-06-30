// Neue Sidebar mit Kapitel- und Level-Fortschritt
// Diese Datei erstellt die Strukturen gemäß der Vorgaben

function progressColor(pct) {
    if (pct >= 90) return 'progress-green';
    if (pct >= 75) return 'progress-yellow';
    return 'progress-red';
}

function starColor(score) {
    if (score >= 90) return 'star-high';
    if (score >= 75) return 'star-medium';
    return 'star-low';
}

// Werte für ein Level zusammenfassen
function aggregateLevelStats(list) {
    let sum = 0;
    let starSum = 0;
    list.forEach(p => {
        const s = calculateProjectStats(p);
        sum += s.completedPercent;
        starSum += s.scoreAvg;
    });
    const count = list.length || 1;
    return {
        progress: Math.round(sum / count),
        star: Math.round(starSum / count)
    };
}

// Kapitelwerte berechnen
function aggregateChapterStats(levelMap) {
    let sum = 0;
    let starSum = 0;
    let count = 0;
    Object.values(levelMap).forEach(list => {
        const s = aggregateLevelStats(list);
        sum += s.progress;
        starSum += s.star;
        count++;
    });
    count = count || 1;
    return {
        progress: Math.round(sum / count),
        star: Math.round(starSum / count)
    };
}

// Hauptfunktion zum Zeichnen der Sidebar
function renderSidebarProgress() {
    const root = document.getElementById('projectList');
    if (!root) return;
    root.innerHTML = '';

    const chMap = {};
    projects.forEach(p => {
        const lvl = p.levelName || '–';
        const ch = getLevelChapter(lvl);
        if (!chMap[ch]) chMap[ch] = {};
        if (!chMap[ch][lvl]) chMap[ch][lvl] = [];
        chMap[ch][lvl].push(p);
    });

    Object.entries(chMap)
        .sort((a,b)=> getChapterOrder(a[0]) - getChapterOrder(b[0]))
        .forEach(([chName, levels]) => {
            const chStats = aggregateChapterStats(levels);
            const chDiv = document.createElement('div');
            chDiv.className = 'chapter-container';

            const title = document.createElement('div');
            title.className = 'chapter';
            title.innerHTML = `<span class="chapter-title">${chName}</span>`+
                `<span class="star ${starColor(chStats.star)}">★ ${chStats.star}</span>`;
            chDiv.appendChild(title);

            const bar = document.createElement('div');
            bar.className = 'progress-bar';
            bar.innerHTML = `<div class="${progressColor(chStats.progress)}" style="width:${chStats.progress}%"></div>`;
            chDiv.appendChild(bar);

            Object.entries(levels)
                .sort((a,b)=> getLevelOrder(a[0]) - getLevelOrder(b[0]))
                .forEach(([lvlName, prjs]) => {
                    const lvlStats = aggregateLevelStats(prjs);
                    const lvlDiv = document.createElement('div');
                    lvlDiv.className = 'level-container';

                    const row = document.createElement('div');
                    row.className = 'level';
                    row.innerHTML = `<span>${lvlName}</span>`+
                        `<div class="progress-bar"><div class="${progressColor(lvlStats.progress)}" style="width:${lvlStats.progress}%"></div></div>`+
                        `<span class="toggle">▶</span>`;
                    row.onclick = () => lvlDiv.classList.toggle('active');
                    lvlDiv.appendChild(row);

                    const list = document.createElement('ul');
                    list.className = 'projects';

                    prjs.sort((a,b)=> a.levelPart - b.levelPart).forEach(prj => {
                        const s = calculateProjectStats(prj);
                        const li = document.createElement('li');
                        li.className = 'project';
                        const top = document.createElement('div');
                        top.className = 'project-row top-row';
                        top.innerHTML =
                            `<span class="project-title">${prj.levelPart}. ${prj.name}</span>`+
                            `<span class="badge-summary">Σ ${s.completedPercent}%</span>`+
                            `<span class="star ${starColor(s.scoreAvg)}">★ ${s.scoreAvg}</span>`;
                        const details = document.createElement('div');
                        details.className = 'details';
                        details.innerHTML =
                            `<span class="badge-detail en">EN ${s.enPercent}%</span>`+
                            `<span class="badge-detail de">DE ${s.dePercent}%</span>`+
                            `<span class="badge-detail audio">🔊 ${s.deAudioPercent}%</span>`;
                        li.appendChild(top);
                        li.appendChild(details);
                        list.appendChild(li);
                    });

                    lvlDiv.appendChild(list);
                    chDiv.appendChild(lvlDiv);
                });
            root.appendChild(chDiv);
        });
}

document.addEventListener('DOMContentLoaded', renderSidebarProgress);

// Für Tests und andere Module verfügbar machen
if (typeof window !== 'undefined') {
    window.renderSidebarProgress = renderSidebarProgress;
}
