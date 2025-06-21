/**
 * @jest-environment jsdom
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

function loadModule() {
    const code = fs.readFileSync(path.join(__dirname, '../web/ytPlayer.js'), 'utf8')
        .replace(/export\s+(async\s+)?function/g, '$1function');
    const sandbox = { module: { exports: {} }, window, document, localStorage, setInterval, clearInterval, YT: {} };
    vm.runInNewContext(code, sandbox);
    return sandbox;
}

describe('Overlay-Position wird geladen', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="videoPlayerSection">
                <iframe id="videoPlayerFrame"></iframe>
                <div class="player-controls"><input id="videoSlider" type="range"></div>
                <div id="ocrOverlay"></div>
            </div>`;
        localStorage.clear();
    });

    test('positionOverlay nutzt gespeicherte Werte', async () => {
        localStorage.setItem('hla_ocrOverlayRect', JSON.stringify({ left:0.1, top:0.2, width:0.5, height:0.25 }));
        const sandbox = loadModule();
        const iframe = document.getElementById('videoPlayerFrame');
        iframe.getBoundingClientRect = () => ({ left:10, top:20, width:100, height:80, bottom:100 });
        const section = document.getElementById('videoPlayerSection');
        section.getBoundingClientRect = () => ({ left:0, top:0 });
        const controls = document.querySelector('.player-controls');
        controls.offsetHeight = 20;
        controls.querySelector = () => ({ getBoundingClientRect: () => ({ top:100 }) });

        await sandbox.positionOverlay();
        const ov = document.getElementById('ocrOverlay');
        expect(parseFloat(ov.style.left)).toBeCloseTo(20);
        expect(parseFloat(ov.style.top)).toBeCloseTo(36);
        expect(parseFloat(ov.style.width)).toBeCloseTo(50);
        expect(parseFloat(ov.style.height)).toBeCloseTo(20);
    });
});
