async function renderCombineEffect(input, opts = {}) {
    // Eingabeverarbeitung und Optionen
    const profiles = {
        soldier: { freq: 120, depth: 0.35, wet: 0.45 },
        metrocop: { freq: 95, depth: 0.25, wet: 0.35 },
        elite: { freq: 140, depth: 0.5, wet: 0.55 }
    };

    let buffer;
    let sampleRate;

    if (typeof AudioBuffer !== 'undefined' && input instanceof AudioBuffer) {
        buffer = input;
        sampleRate = buffer.sampleRate;
    } else if (input instanceof Float32Array) {
        if (!opts.sampleRate) throw new Error('sampleRate erforderlich bei Float32Array');
        sampleRate = opts.sampleRate;
        buffer = new AudioBuffer({ length: input.length, numberOfChannels: 1, sampleRate });
        buffer.copyToChannel(input, 0);
    } else {
        throw new Error('Eingabe muss AudioBuffer oder Float32Array sein');
    }

    let {
        freq = 120,
        depth = 0.35,
        wet = 0.45,
        hp = 300,
        lp = 3800,
        drive = 1.6,
        compress = true,
        mono = true
    } = opts;

    if (opts.profile && profiles[opts.profile]) {
        ({ freq, depth, wet } = profiles[opts.profile]);
    }

    depth = Math.min(Math.max(depth, 0), 1);
    wet = Math.min(Math.max(wet, 0), 1);

    const channels = mono ? 1 : buffer.numberOfChannels;
    const ctx = new OfflineAudioContext(channels, buffer.length, sampleRate);

    // Dry/Wet-Quellen anlegen
    const drySource = ctx.createBufferSource();
    drySource.buffer = buffer;
    const wetSource = ctx.createBufferSource();
    wetSource.buffer = buffer;

    const dryGain = ctx.createGain();
    dryGain.gain.value = 1 - wet;
    const wetGain = ctx.createGain();
    wetGain.gain.value = wet;

    // Wet-Pfad: Bandbegrenzung
    const high = ctx.createBiquadFilter();
    high.type = 'highpass';
    high.frequency.value = hp;

    const low = ctx.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = lp;

    const presence = ctx.createBiquadFilter();
    presence.type = 'peaking';
    presence.frequency.value = 1700;
    presence.gain.value = 3.5;
    presence.Q.value = 1.2;

    const lowMid = ctx.createBiquadFilter();
    lowMid.type = 'peaking';
    lowMid.frequency.value = 500;
    lowMid.gain.value = -3;
    lowMid.Q.value = 1.3;

    // Ringmodulation mit DC-Offset
    const amGain = ctx.createGain();
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const depthGain = ctx.createGain();
    depthGain.gain.value = depth;
    const dc = ctx.createConstantSource();
    dc.offset.value = 1 - depth;
    osc.connect(depthGain);
    depthGain.connect(amGain.gain);
    dc.connect(amGain.gain);

    // Weiche Sättigung
    const shaper = ctx.createWaveShaper();
    const curve = new Float32Array(65536);
    for (let i = 0; i < curve.length; i++) {
        const x = (i / (curve.length - 1)) * 2 - 1;
        curve[i] = Math.tanh(x * drive) / Math.tanh(drive);
    }
    shaper.curve = curve;
    shaper.oversample = '2x';

    // Optionaler Kompressor
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 6;
    comp.attack.value = 0.002;
    comp.release.value = 0.08;
    comp.knee.value = 4;

    // Signalverknüpfung
    wetSource.connect(high);
    high.connect(low);
    low.connect(presence);
    presence.connect(lowMid);
    lowMid.connect(amGain);
    amGain.connect(shaper);
    if (compress) {
        shaper.connect(comp);
        comp.connect(wetGain);
    } else {
        shaper.connect(wetGain);
    }
    wetGain.connect(ctx.destination);

    drySource.connect(dryGain).connect(ctx.destination);

    // Start der Quellen
    wetSource.start();
    drySource.start();
    osc.start();
    dc.start();

    // Rendering und Ergebnis
    const rendered = await ctx.startRendering();
    return rendered;
}

if (typeof window !== 'undefined') window.renderCombineEffect = renderCombineEffect;
if (typeof module !== 'undefined' && module.exports) module.exports = renderCombineEffect;
