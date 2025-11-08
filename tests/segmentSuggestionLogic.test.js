// Tests für die neue Segment-Vorschlagslogik im DE-Editor
let originalSetTimeout = null;

function loadMain() {
    jest.resetModules();
    const fakeStorage = {
        getItem: () => null,
        setItem: () => {}
    };
    const createDummyElement = () => ({
        textContent: '',
        innerHTML: '',
        style: {},
        value: '',
        checked: false,
        disabled: false,
        dataset: {},
        classList: { add: () => {}, remove: () => {}, toggle: () => {} },
        appendChild: () => {},
        querySelector: () => createDummyElement(),
        addEventListener: () => {},
        removeEventListener: () => {},
        setAttribute: () => {},
        focus: () => {},
        blur: () => {},
        remove: () => {}
    });
    global.window = {
        localStorage: fakeStorage,
        addEventListener: () => {}
    };
    global.document = {
        getElementById: () => createDummyElement(),
        querySelector: () => null,
        createElement: () => createDummyElement(),
        addEventListener: () => {},
        removeEventListener: () => {}
    };
    global.storage = fakeStorage;
    originalSetTimeout = originalSetTimeout ?? global.setTimeout;
    global.setTimeout = fn => {
        if (typeof fn === 'function') {
            fn();
        }
        return 0;
    };
    return require('../web/src/main.js');
}

function cleanupGlobals() {
    if (originalSetTimeout) {
        global.setTimeout = originalSetTimeout;
    }
    delete global.window;
    delete global.document;
    delete global.storage;
}

afterEach(() => {
    cleanupGlobals();
});

test('Segmentgrenzen berücksichtigen Puffer und Overrides', () => {
    const {
        __setAutoSegments,
        __setSegmentOverrides,
        __setSegmentDecisions,
        __setSegmentPaddingMs,
        __setEditDurationMs,
        __getSegmentFinalBounds
    } = loadMain();

    __setEditDurationMs(2000);
    __setAutoSegments([
        { start: 200, end: 400 },
        { start: 800, end: 1000 }
    ]);
    __setSegmentOverrides([null, { start: 780, end: 990 }]);
    __setSegmentDecisions(['keep', 'drop']);
    __setSegmentPaddingMs(100);

    expect(__getSegmentFinalBounds(0)).toEqual({
        start: 100,
        end: 500,
        rawStart: 200,
        rawEnd: 400
    });
    expect(__getSegmentFinalBounds(1)).toEqual({
        start: 680,
        end: 1090,
        rawStart: 780,
        rawEnd: 990
    });
});

test('CollectFinalSegments sortiert nach Start und bewahrt Entscheidungen', () => {
    const {
        __setAutoSegments,
        __setSegmentOverrides,
        __setSegmentDecisions,
        __setSegmentPaddingMs,
        __setEditDurationMs,
        __collectFinalSegments
    } = loadMain();

    __setEditDurationMs(1500);
    __setSegmentPaddingMs(0);
    __setAutoSegments([
        { start: 400, end: 520 },
        { start: 120, end: 180 },
        { start: 900, end: 980 }
    ]);
    __setSegmentOverrides([null, null, null]);
    __setSegmentDecisions(['drop', 'keep', 'keep']);

    const liste = __collectFinalSegments();
    expect(liste.map(seg => seg.index)).toEqual([1, 0, 2]);
    expect(liste.map(seg => seg.decision)).toEqual(['keep', 'drop', 'keep']);
});

test('rebuildSegmentStructures erzeugt Lücken und aktualisiert Ignorierliste', () => {
    const {
        __setAutoSegments,
        __setSegmentOverrides,
        __setSegmentDecisions,
        __setSegmentPaddingMs,
        __setEditDurationMs,
        __setEditIgnoreRanges,
        __rebuildSegmentStructures,
        __getAutoSilenceGaps,
        __getEditIgnoreRanges
    } = loadMain();

    __setEditDurationMs(2000);
    __setSegmentPaddingMs(0);
    __setAutoSegments([
        { start: 200, end: 400 },
        { start: 800, end: 1000 }
    ]);
    __setSegmentOverrides([null, null]);
    __setSegmentDecisions(['keep', 'drop']);
    __setEditIgnoreRanges([{ start: 50, end: 120 }]);

    __rebuildSegmentStructures();

    expect(__getAutoSilenceGaps()).toEqual([
        { start: 0, end: 200 },
        { start: 400, end: 800 },
        { start: 1000, end: 2000 }
    ]);

    expect(__getEditIgnoreRanges()).toEqual([
        { start: 50, end: 120 },
        { start: 0, end: 200, source: 'segment-gap' },
        { start: 400, end: 800, source: 'segment-gap' },
        { start: 1000, end: 2000, source: 'segment-gap' },
        { start: 800, end: 1000, source: 'segment-auto', segmentIndex: 1 }
    ]);
});
