const { expect, test } = require('@jest/globals');

test('Segment-Zuordnungen bleiben nach Serialisierung erhalten', () => {
    const project = {
        segmentAssignments: { 0: [1,2] },
        segmentSegments: [{ start: 0, end: 100 }],
        segmentAudio: 'abc'
    };
    const serialized = JSON.stringify([project]);
    const loaded = JSON.parse(serialized)[0];
    expect(loaded.segmentAssignments['0']).toEqual([1,2]);
    expect(Array.isArray(loaded.segmentSegments)).toBe(true);
    expect(loaded.segmentAudio).toBe('abc');
});
