const { TextEncoder, TextDecoder } = require('util');
const path = require('path');

const createMockElement = () => ({
    tagName: '',
    style: {},
    classList: {
        add: jest.fn(),
        remove: jest.fn(),
        toggle: jest.fn()
    },
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    remove: jest.fn(),
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    querySelector: jest.fn(() => createMockElement()),
    querySelectorAll: jest.fn(() => []),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    focus: jest.fn(),
    blur: jest.fn(),
    getContext: jest.fn(() => ({
        clearRect: jest.fn(),
        fillRect: jest.fn(),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        stroke: jest.fn(),
        fillText: jest.fn(),
        measureText: jest.fn(() => ({ width: 0 }))
    })),
    getBoundingClientRect: jest.fn(() => ({ top: 0, left: 0, width: 0, height: 0 })),
    innerHTML: '',
    textContent: '',
    value: ''
});

const ensureDocumentStubs = () => {
    if (!global.document) {
        global.document = {};
    }
    if (typeof global.document.addEventListener !== 'function') {
        global.document.addEventListener = jest.fn();
    }
    if (typeof global.document.removeEventListener !== 'function') {
        global.document.removeEventListener = jest.fn();
    }
    global.document.getElementById = jest.fn(() => createMockElement());
    global.document.querySelector = jest.fn(() => createMockElement());
    global.document.querySelectorAll = jest.fn(() => []);
    global.document.createElement = jest.fn(() => createMockElement());
};

const ensureWindowStubs = () => {
    if (!global.window) {
        global.window = {};
    }
    if (typeof global.window.addEventListener !== 'function') {
        global.window.addEventListener = jest.fn();
    }
    if (typeof global.window.removeEventListener !== 'function') {
        global.window.removeEventListener = jest.fn();
    }
    if (typeof global.window.requestAnimationFrame !== 'function') {
        global.window.requestAnimationFrame = cb => setTimeout(cb, 0);
    }
    if (typeof global.window.cancelAnimationFrame !== 'function') {
        global.window.cancelAnimationFrame = id => clearTimeout(id);
    }
    if (!global.window.electronAPI) {
        global.window.electronAPI = {};
    }
    if (typeof global.window.electronAPI.join !== 'function') {
        global.window.electronAPI.join = path.join;
    }
    if (typeof global.window.electronAPI.fsReadFile !== 'function') {
        global.window.electronAPI.fsReadFile = () => new Uint8Array();
    }
};

if (typeof global.TextEncoder === 'undefined') {
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
}

ensureWindowStubs();
ensureDocumentStubs();

if (typeof global.fetch === 'undefined') {
    const jestFetch = jest.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({}),
        text: async () => '',
        arrayBuffer: async () => new ArrayBuffer(0)
    }));
    global.fetch = jestFetch;
    global.jestFetch = jestFetch;
}

beforeEach(() => {
    ensureWindowStubs();
    ensureDocumentStubs();
    if (typeof global.cancelTranslationQueue !== 'function') {
        global.cancelTranslationQueue = jest.fn();
    }
    if (typeof global.scanEnOrdner !== 'function') {
        global.scanEnOrdner = jest.fn();
    }
    if (typeof global.showToast !== 'function') {
        global.showToast = jest.fn();
    }
    if (typeof global.updateStatus !== 'function') {
        global.updateStatus = jest.fn();
    }
    if (typeof global.updateAllProjectsAfterScan !== 'function') {
        global.updateAllProjectsAfterScan = jest.fn();
    }
    if (typeof global.Headers === 'undefined') {
        global.Headers = class Headers {};
    }
    if (typeof global.Request === 'undefined') {
        global.Request = class Request {};
    }
    if (typeof global.Response === 'undefined') {
        global.Response = class Response {};
    }
});
