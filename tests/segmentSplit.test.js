const { beforeEach, expect, test } = require('@jest/globals');
let splitSegmentAt, __setSegmentInfo, __setSegmentAssignments, __getSegmentInfo, __getSegmentAssignments,
    __setIgnoredSegments, __getIgnoredSegments, __findNearestSilence;

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
    ({ splitSegmentAt, __setSegmentInfo, __setSegmentAssignments, __getSegmentInfo, __getSegmentAssignments,
       __setIgnoredSegments, __getIgnoredSegments, __findNearestSilence } = require('../web/src/main.js'));
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

test('splitSegmentAt uebernimmt Ignore-Flag', () => {
    const buffer = { sampleRate: 1000, length: 2000, getChannelData: () => new Float32Array(2000), numberOfChannels:1 };
    __setSegmentInfo({ buffer, segments: [{ start: 0, end: 100 }, { start: 100, end: 200 }] });
    __setIgnoredSegments([1]);
    splitSegmentAt(0, 50);
    expect(__getIgnoredSegments()).toEqual([1,2]);
});

test('findNearestSilence findet nahe Stelle', () => {
    const arr = new Float32Array(200).fill(1);
    for(let i=80;i<100;i++) arr[i] = 0;
    const buffer = { sampleRate: 1000, length: 200, getChannelData: () => arr };
    const pos = __findNearestSilence(buffer, 0, 200, 90, 0.01, 5, 50);
    expect(Math.round(pos)).toBe(90);
});
