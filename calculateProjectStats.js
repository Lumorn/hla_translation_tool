function calculateProjectStats(project) {
    const files = project.files || [];
    const totalFiles = files.length;

    if (totalFiles === 0) {
        return {
            enPercent: 0,
            dePercent: 0,
            deAudioPercent: 0,
            completedPercent: 0,
            totalFiles: 0
        };
    }

    const filesWithEN = files.filter(f => f.enText && f.enText.trim().length > 0).length;
    const filesWithDE = files.filter(f => f.deText && f.deText.trim().length > 0).length;
    const filesCompleted = files.filter(f => f.completed).length;
    const filesWithDeAudio = files.filter(f => f.hasDeAudio || f.deAudioPath || f.deAudio).length;

    return {
        enPercent: Math.round((filesWithEN / totalFiles) * 100),
        dePercent: Math.round((filesWithDE / totalFiles) * 100),
        deAudioPercent: Math.round((filesWithDeAudio / totalFiles) * 100),
        completedPercent: Math.round((filesCompleted / totalFiles) * 100),
        totalFiles: totalFiles
    };
}

module.exports = calculateProjectStats;
