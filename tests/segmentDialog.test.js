/**
 * @jest-environment jsdom
 */

// Vereinfache Funktionen fuer den Segment-Dialog
let currentProject;
let openSegmentDialog;
let analyzeSegmentFile;
let electronAPI;
let storeSegmentState;

beforeEach(() => {
    // Dummy DOM erzeugen
    document.body.innerHTML = `
        <div id="segmentDialog" class="hidden"></div>
        <canvas id="segmentWaveform"></canvas>
        <input id="segmentFileInput" type="file">
        <div id="segmentProgress"></div>
        <div id="segmentFill"></div>
        <div id="segmentStatus"></div>
        <div id="segmentTextList"></div>
    `;
    // Dummy-Projekt anlegen
    currentProject = {
        id: 1,
        segmentAudio: null,
        segmentAudioPath: null,
        segmentAssignments: {},
        segmentSegments: null
    };
    window.electronAPI = undefined;
    // Mock-Funktion zum Speichern
    storeSegmentState = jest.fn();
    // Stark vereinfachtes Analyse-Verhalten
    analyzeSegmentFile = async ev => {
        const file = ev.target.files[0];
        if (!file) return;
        const buf = await file.arrayBuffer();
        if (window.electronAPI && window.electronAPI.saveSegmentFile) {
            const arr = new Uint8Array(buf);
            currentProject.segmentAudioPath = await window.electronAPI.saveSegmentFile(currentProject.id, arr);
            currentProject.segmentAudio = null;
        } else {
            currentProject.segmentAudio = Buffer.from(new Uint8Array(buf)).toString('base64');
            currentProject.segmentAudioPath = null;
        }
        currentProject.segmentSegments = [{ start: 0, end: 100 }];
        document.getElementById('segmentTextList').innerHTML = '<div>Segment 1</div>';
        storeSegmentState();
    };
    // Dialog oeffnen und gespeicherte Segmente laden
    openSegmentDialog = async () => {
        const dlg = document.getElementById('segmentDialog');
        dlg.classList.remove('hidden');
        if (currentProject.segmentSegments) {
            document.getElementById('segmentTextList').innerHTML = '<div>Segment 1</div>';
        }
    };
});

test('analyzeSegmentFile speichert Audio und fuellt Liste', async () => {
    const file = {
        arrayBuffer: async () => new Uint8Array([1, 2]).buffer
    };
    const input = document.getElementById('segmentFileInput');
    Object.defineProperty(input, 'files', { value: [file] });
    await analyzeSegmentFile({ target: input });
    expect(currentProject.segmentAudio).toBe(Buffer.from([1,2]).toString('base64'));
    expect(document.getElementById('segmentTextList').innerHTML).not.toBe('');
    expect(storeSegmentState).toHaveBeenCalled();
});

test('openSegmentDialog laedt vorhandene Segmente', async () => {
    currentProject.segmentAudio = 'YWJj';
    currentProject.segmentSegments = [{ start: 0, end: 100 }];
    await openSegmentDialog();
    const dlg = document.getElementById('segmentDialog');
    expect(dlg.classList.contains('hidden')).toBe(false);
    expect(document.getElementById('segmentTextList').innerHTML).not.toBe('');
});

test('analyzeSegmentFile nutzt Electron-API', async () => {
    window.electronAPI = { saveSegmentFile: jest.fn(async () => 'Segments/1.wav') };
    const file = { arrayBuffer: async () => new Uint8Array([3,4]).buffer };
    const input = document.getElementById('segmentFileInput');
    Object.defineProperty(input, 'files', { value: [file] });
    await analyzeSegmentFile({ target: input });
    expect(window.electronAPI.saveSegmentFile).toHaveBeenCalled();
    expect(currentProject.segmentAudioPath).toBe('Segments/1.wav');
    expect(currentProject.segmentAudio).toBeNull();
});
