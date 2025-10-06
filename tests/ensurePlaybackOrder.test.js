/**
 * @jest-environment jsdom
 */
let ensurePlaybackOrder, __setFiles, __setDisplayOrder, __getDisplayOrder;

function createElementStub() {
    return {
        textContent: '',
        innerHTML: '',
        value: '',
        checked: false,
        style: {},
        dataset: {},
        classList: {
            add: jest.fn(),
            remove: jest.fn(),
            toggle: jest.fn(),
            contains: jest.fn(() => false)
        },
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        appendChild: jest.fn(),
        querySelector: jest.fn(() => null),
        querySelectorAll: jest.fn(() => []),
        scrollIntoView: jest.fn(),
        focus: jest.fn(),
        blur: jest.fn(),
        setAttribute: jest.fn(),
        removeAttribute: jest.fn()
    };
}

beforeEach(() => {
    jest.resetModules();

    const storageData = {};
    const storageMock = {
        getItem: jest.fn(key => (Object.prototype.hasOwnProperty.call(storageData, key) ? storageData[key] : null)),
        setItem: jest.fn((key, value) => { storageData[key] = String(value); }),
        removeItem: jest.fn(key => { delete storageData[key]; }),
        clear: jest.fn(() => { Object.keys(storageData).forEach(k => delete storageData[k]); }),
        key: jest.fn(index => Object.keys(storageData)[index] || null)
    };
    Object.defineProperty(storageMock, 'length', {
        get: () => Object.keys(storageData).length
    });

    Object.defineProperty(window, 'localStorage', {
        value: storageMock,
        configurable: true
    });
    window.storage = storageMock;
    global.localStorage = storageMock;

    const elementStub = createElementStub();
    document.getElementById = jest.fn(id => {
        if (id === 'audioPlayer') {
            return {
                play: jest.fn(() => Promise.resolve()),
                pause: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                load: jest.fn(),
                currentTime: 0,
                src: '',
                volume: 1
            };
        }
        return createElementStub();
    });
    document.querySelector = jest.fn(() => elementStub);
    document.querySelectorAll = jest.fn(() => []);
    document.createElement = jest.fn(() => createElementStub());

    window.acquireProjectLock = jest.fn(() => Promise.resolve({ release: jest.fn(), readOnly: false }));
    window.showToast = jest.fn();
    window.updateStatus = jest.fn();
    window.projects = [];
    window.navigator.clipboard = {
        writeText: jest.fn(() => Promise.resolve()),
        readText: jest.fn(() => Promise.resolve(''))
    };
    window.navigator.storage = {
        persist: jest.fn(() => Promise.resolve(true)),
        estimate: jest.fn(() => Promise.resolve({ quota: 0, usage: 0 }))
    };

    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});

    ({ ensurePlaybackOrder, __setFiles, __setDisplayOrder, __getDisplayOrder } = require('../web/src/main.js'));
});

afterEach(() => {
    if (console.warn.mockRestore) console.warn.mockRestore();
    if (console.error.mockRestore) console.error.mockRestore();
    if (console.log.mockRestore) console.log.mockRestore();
});

test('ensurePlaybackOrder korrigiert die Reihenfolge', () => {
    const testFiles = [
        { id: 1, folder: 'f', filename: 'a.mp3' },
        { id: 2, folder: 'f', filename: 'b.wav' },
        { id: 3, folder: 'f', filename: 'c.mp3' }
    ];
    __setFiles(testFiles);
    // Falsche Reihenfolge simulieren
    __setDisplayOrder([
        { file: testFiles[2], originalIndex: 2 },
        { file: testFiles[0], originalIndex: 0 },
        { file: testFiles[1], originalIndex: 1 }
    ]);

    ensurePlaybackOrder();
    const order = __getDisplayOrder().map(item => item.file.id);
    expect(order).toEqual([1, 2, 3]);
});
