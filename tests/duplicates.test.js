// Teste die Erkennung und Bereinigung von doppelten Dateipfaden

// Hilfsdatenbanken simulieren die globale Umgebung des Tools
let filePathDatabase;
let textDatabase;
let projects;
let audioFileCache;

beforeEach(() => {
    // Einfache Beispieldaten mit einem Duplikat in "chars"
    filePathDatabase = {
        'speech.wav': [
            { folder: 'chars', fullPath: '/game/chars/speech.wav', fileObject: {} },
            { folder: 'chars', fullPath: '/game/duplicate/speech.wav', fileObject: {} }
        ],
        'other.wav': [
            { folder: 'chars', fullPath: '/game/chars/other.wav', fileObject: {} }
        ]
    };

    textDatabase = {
        'chars/speech.wav': { en: 'hello', de: 'hallo' }
    };

    projects = [
        { files: [{ filename: 'speech.wav', folder: 'chars' }] }
    ];

    audioFileCache = {
        '/game/chars/speech.wav': true,
        '/game/duplicate/speech.wav': true
    };
});

function findDuplicates() {
    const allDuplicates = new Map();
    Object.entries(filePathDatabase).forEach(([filename, paths]) => {
        if (paths.length > 1) {
            const folderGroups = new Map();
            paths.forEach((pathInfo, index) => {
                const folder = pathInfo.folder;
                if (!folderGroups.has(folder)) {
                    folderGroups.set(folder, []);
                }
                folderGroups.get(folder).push({
                    filename,
                    pathInfo,
                    pathIndex: index,
                    key: `${pathInfo.folder}/${filename}`,
                    originalFolder: pathInfo.folder
                });
            });
            folderGroups.forEach((group, folderName) => {
                if (group.length > 1) {
                    const duplicateKey = `duplicate_${folderName}/${filename}`;
                    allDuplicates.set(duplicateKey, group);
                }
            });
        }
    });
    return allDuplicates;
}

function scoreDuplicateItem(item) {
    let score = 0;
    const fileKey = item.key;
    if (textDatabase[fileKey] && textDatabase[fileKey].en) {
        score += 10;
    }
    const isInProject = projects.some(project =>
        project.files && project.files.some(file =>
            file.filename === item.filename && file.folder === item.pathInfo.folder
        )
    );
    if (isInProject) {
        score += 20;
    }
    if (audioFileCache[item.pathInfo.fullPath]) {
        score += 5;
    }
    if (textDatabase[fileKey] && textDatabase[fileKey].de) {
        score += 8;
    }
    score += 1 - (item.pathIndex * 0.1);
    return score;
}

function cleanupDuplicates() {
    const duplicates = findDuplicates();
    if (duplicates.size === 0) return;
    const cleanupPlan = [];
    duplicates.forEach((group, key) => {
        const scoredItems = group.map(item => ({ ...item, score: scoreDuplicateItem(item) }));
        scoredItems.sort((a, b) => b.score - a.score);
        const toKeep = scoredItems[0];
        const toDelete = scoredItems.slice(1);
        cleanupPlan.push({ key, keep: toKeep, delete: toDelete });
    });
    cleanupPlan.forEach(plan => {
        const filename = plan.keep.filename;
        if (!filePathDatabase[filename]) return;
        let bestItem = plan.keep;
        let bestScore = bestItem.score;
        [...plan.delete, plan.keep].forEach(item => {
            const score = scoreDuplicateItem(item);
            if (score > bestScore) {
                bestScore = score;
                bestItem = item;
            }
        });
        const newPaths = [{
            folder: bestItem.pathInfo.folder,
            fullPath: bestItem.pathInfo.fullPath,
            fileObject: bestItem.pathInfo.fileObject
        }];
        plan.delete.concat(plan.keep).forEach(item => {
            if (item !== bestItem) {
                if (audioFileCache[item.pathInfo.fullPath]) {
                    delete audioFileCache[item.pathInfo.fullPath];
                }
            }
        });
        filePathDatabase[filename] = newPaths;
    });
}

describe('Duplikaterkennung und Bereinigung', () => {
    test('findDuplicates findet vorhandene Duplikate', () => {
        const result = findDuplicates();
        expect(result.size).toBe(1);
        const [key, group] = Array.from(result.entries())[0];
        expect(key).toBe('duplicate_chars/speech.wav');
        expect(group.length).toBe(2);
    });
    test('cleanupDuplicates entfernt überzählige Pfade', () => {
        cleanupDuplicates();
        expect(filePathDatabase['speech.wav'].length).toBe(1);
        expect(filePathDatabase['speech.wav'][0].fullPath).toBe('/game/chars/speech.wav');
        expect(audioFileCache['/game/duplicate/speech.wav']).toBeUndefined();
    });
});
