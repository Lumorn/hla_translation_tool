const { beforeEach, expect, test } = require('@jest/globals');
let splitSegmentAt, __setSegmentInfo, __setSegmentAssignments, __getSegmentInfo, __getSegmentAssignments;

function loadMain() {
    jest.resetModules();
    global.window = { addEventListener: jest.fn(), electronAPI: undefined };
    global.document = {
        addEventListener: jest.fn(),
        querySelectorAll: jest.fn(() => []),
        querySelector: jest.fn(() => null),
        getElementById: jest.fn(id => {
            if (id === 'segmentWaveform') {
                return { width: 100, height: 50, getContext: () => ({ clearRect: jest.fn(), fillRect: jest.fn(), beginPath: jest.fn(), moveTo: jest.fn(), lineTo: jest.fn(), stroke: jest.fn(), strokeStyle: '', fillStyle: '' }), addEventListener: jest.fn() };
            }
            if (id === 'segmentTextList') {
                return { innerHTML: '', querySelectorAll: () => [], appendChild: jest.fn() };
            }
            return { addEventListener: jest.fn() };
        })
    };
    global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} };
    ({ splitSegmentAt, __setSegmentInfo, __setSegmentAssignments, __getSegmentInfo, __getSegmentAssignments } = require('../web/src/main.js'));
}

beforeEach(loadMain);

test('splitSegmentAt fuegt Segment ein und passt Nummern an', () => {
    const buffer = { sampleRate: 1000, length: 2000, getChannelData: () => new Float32Array(2000), numberOfChannels:1 };
    __setSegmentInfo({ buffer, segments: [{ start: 0, end: 100 }, { start: 100, end: 200 }] });
    __setSegmentAssignments({ 0: [1, 2] });
    splitSegmentAt(0, 50);
    const info = __getSegmentInfo();
    expect(info.segments.length).toBe(3);
    expect(__getSegmentAssignments()[0]).toEqual([1,2,3]);
});
