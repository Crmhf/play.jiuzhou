const SAMPLE_ROOT = 'assets/audio/combat/';

export const COMBAT_AUDIO = {
  blade: ['blade-swing-01.mp3', 'blade-swing-02.mp3'],
  polearm: ['polearm-swing-01.mp3', 'polearm-swing-02.mp3'],
  bow: ['bow-release-01.mp3', 'bow-release-02.mp3'],
  body: ['hit-body-01.mp3', 'hit-body-02.mp3'],
  armor: ['hit-armor-01.mp3', 'hit-armor-02.mp3'],
  heavy: ['hit-heavy-01.mp3', 'hit-heavy-02.mp3'],
  skillWind: ['skill-wind-01.mp3'],
  skillImpact: ['skill-impact-01.mp3'],
  ultimate: ['ultimate-blade-01.mp3']
};

const MUSIC_LEVELS = {
  menu: .14,
  select: .18,
  story: .2,
  combat: .34,
  paused: .075,
  result: .15
};

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.sfxGain = null;
    this.enabled = true;
    this.scene = 'menu';
    this.bossActive = false;
    this.duck = 0;
    this.buffers = new Map();
    this.loading = null;
    this.lastSample = new Map();
    this.lastPlayedAt = new Map();
    this.music = new Audio('assets/audio/jiuzhou-theme.mp3');
    this.pressure = new Audio('assets/audio/jiuzhou-boss.mp3');
    for (const track of [this.music, this.pressure]) {
      track.loop = true;
      track.preload = 'auto';
      track.volume = 0;
    }
  }

  async loadSamples() {
    if (!this.ctx || this.loading) return this.loading;
    const entries = Object.entries(COMBAT_AUDIO).flatMap(([group, files]) => files.map(file => [group, file]));
    this.loading = Promise.all(entries.map(async ([group, file]) => {
      try {
        const response = await fetch(`${SAMPLE_ROOT}${file}`);
        if (!response.ok) throw new Error(`${response.status} ${file}`);
        const buffer = await this.ctx.decodeAudioData(await response.arrayBuffer());
        if (!this.buffers.has(group)) this.buffers.set(group, []);
        this.buffers.get(group).push(buffer);
      } catch (error) {
        console.warn('[audio] sample unavailable:', error);
      }
    }));
    return this.loading;
  }

  start(scene = this.scene) {
    if (!this.enabled) return;
    this.scene = scene;
    if (!this.ctx) {
      const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (AudioContextClass) {
        try { this.ctx = new AudioContextClass({ latencyHint: 'interactive' }); }
        catch { this.ctx = new AudioContextClass(); }
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = .82;
        this.sfxGain.connect(this.ctx.destination);
        this.loadSamples();
      }
    }
    this.ctx?.resume();
    this.music.play().catch(() => {});
    try {
      if (Math.abs(this.pressure.currentTime - this.music.currentTime) > .15) this.pressure.currentTime = this.music.currentTime;
    } catch { /* Metadata may not be ready on the first mobile gesture. */ }
    this.pressure.play().catch(() => {});
  }

  setScene(scene) {
    this.scene = scene;
    if (this.enabled && !['paused'].includes(scene)) this.start(scene);
  }

  setBoss(active) {
    this.bossActive = active;
    if (active) this.duck = Math.max(this.duck, .32);
  }

  update(dt) {
    this.duck = Math.max(0, Math.min(1.2, this.duck - dt * 1.8));
    const base = this.enabled ? (MUSIC_LEVELS[this.scene] ?? .18) : 0;
    const musicTarget = Math.max(0, Math.min(1, base * (1 - this.duck * .32)));
    const pressureTarget = Math.max(0, Math.min(1, this.enabled && this.scene === 'combat' && this.bossActive ? .19 : 0));
    const blend = 1 - Math.exp(-dt * (pressureTarget > this.pressure.volume ? 3.8 : 5.8));
    this.music.volume += (musicTarget - this.music.volume) * blend;
    this.pressure.volume += (pressureTarget - this.pressure.volume) * blend;
  }

  sample(group, { volume = .35, rate = 1, rateJitter = .035, pan = 0, delay = 0, minGap = 28 } = {}) {
    if (!this.enabled || !this.ctx || !this.sfxGain) return false;
    const pool = this.buffers.get(group);
    if (!pool?.length) return false;
    const nowMs = performance.now();
    if (nowMs - (this.lastPlayedAt.get(group) || 0) < minGap) return false;
    this.lastPlayedAt.set(group, nowMs);
    let index = Math.floor(Math.random() * pool.length);
    if (pool.length > 1 && index === this.lastSample.get(group)) index = (index + 1) % pool.length;
    this.lastSample.set(group, index);
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    source.buffer = pool[index];
    source.playbackRate.value = Math.max(.55, rate + (Math.random() * 2 - 1) * rateJitter);
    gain.gain.value = volume;
    source.connect(gain);
    if (this.ctx.createStereoPanner) {
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, pan));
      gain.connect(panner).connect(this.sfxGain);
    } else {
      gain.connect(this.sfxGain);
    }
    source.start(this.ctx.currentTime + delay);
    return true;
  }

  tone(freq = 220, dur = .08, type = 'sine', gain = .08, slide = .55, delay = 0) {
    if (!this.enabled || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime + delay;
    const oscillator = this.ctx.createOscillator();
    const envelope = this.ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(35, freq), t);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(35, freq * slide), t + dur);
    envelope.gain.setValueAtTime(gain, t);
    envelope.gain.exponentialRampToValueAtTime(.001, t + dur);
    oscillator.connect(envelope).connect(this.sfxGain);
    oscillator.start(t);
    oscillator.stop(t + dur + .01);
  }

  noise(dur = .06, gain = .04, delay = 0) {
    if (!this.enabled || !this.ctx || !this.sfxGain) return;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const envelope = this.ctx.createGain();
    const t = this.ctx.currentTime + delay;
    filter.type = 'bandpass';
    filter.frequency.value = 980;
    envelope.gain.setValueAtTime(gain, t);
    envelope.gain.exponentialRampToValueAtTime(.001, t + dur);
    source.buffer = buffer;
    source.connect(filter).connect(envelope).connect(this.sfxGain);
    source.start(t);
    source.stop(t + dur);
  }

  weaponSwing(hero = 'heling', step = 1) {
    const group = hero === 'shutong' ? 'bow' : hero === 'yanshuo' ? 'blade' : 'polearm';
    const heavy = step === 3;
    this.sample(group, { volume: group === 'bow' ? .44 : heavy ? .42 : .31, rate: heavy ? .88 : 1.03 + step * .015, minGap: 45 });
    if (heavy && group !== 'bow') this.tone(108, .075, 'triangle', .018, .62);
  }

  hit(power = 1, armored = false) {
    const heavy = power >= 1.45;
    const group = heavy ? 'heavy' : armored ? 'armor' : 'body';
    this.sample(group, { volume: heavy ? .5 : armored ? .36 : .32, rate: heavy ? .94 : 1.02, minGap: heavy ? 85 : 34 });
    this.duck = Math.max(this.duck, heavy ? .44 : .18);
    this.tone(130 + power * 40, .075, 'square', .028 + power * .012, .31);
    this.noise(.045, .014 + power * .007, .012);
  }

  heavy() {
    this.sample('heavy', { volume: .48, rate: .92, minGap: 90 });
    this.tone(76, .16, 'sawtooth', .075, .28);
    this.noise(.11, .045, .01);
  }

  skill(hero = 'heling') {
    const group = hero === 'shutong' ? 'bow' : 'skillWind';
    this.sample(group, { volume: group === 'bow' ? .46 : .4, rate: hero === 'xuanhong' ? .78 : hero === 'yanshuo' ? .9 : hero === 'shutong' ? 1.08 : 1, minGap: 100 });
    this.tone(270, .22, 'sawtooth', .055, 2.55);
    this.tone(620, .16, 'sine', .025, .68, .06);
  }

  ultimate(hero = 'heling') {
    this.sample('ultimate', { volume: .52, rate: hero === 'xuanhong' ? .8 : hero === 'yanshuo' ? .9 : hero === 'shutong' ? 1.1 : 1, minGap: 220 });
    this.sample('skillImpact', { volume: .3, rate: .9, delay: .08, minGap: 180 });
    this.duck = Math.max(this.duck, .58);
    this.tone(92, .32, 'sawtooth', .085, 2.8);
    this.tone(420, .4, 'sine', .04, 1.75, .08);
    this.noise(.22, .035, .12);
  }

  enemyWindup(boss = false) {
    this.tone(boss ? 105 : 170, boss ? .22 : .11, boss ? 'sawtooth' : 'triangle', boss ? .045 : .022, boss ? .72 : .82);
  }

  enemyAttack(boss = false) {
    this.sample(boss ? 'heavy' : 'polearm', { volume: boss ? .45 : .24, rate: boss ? .88 : 1.08, minGap: boss ? 95 : 55 });
    this.tone(boss ? 82 : 145, boss ? .16 : .07, boss ? 'square' : 'sawtooth', boss ? .06 : .025, .34);
    this.noise(boss ? .1 : .04, boss ? .035 : .012);
  }

  bossStep() {
    this.tone(58, .11, 'triangle', .03, .48);
    this.noise(.07, .018);
  }

  bossImpact() {
    this.sample('heavy', { volume: .56, rate: .78, minGap: 120 });
    this.sample('armor', { volume: .24, rate: .76, delay: .035, minGap: 90 });
    this.duck = Math.max(this.duck, .62);
    this.tone(48, .24, 'sawtooth', .09, .24);
    this.noise(.18, .055, .015);
  }

  step(run = false) {
    this.noise(run ? .032 : .022, run ? .009 : .005);
    this.tone(run ? 82 : 68, .028, 'triangle', run ? .005 : .003, .72);
  }

  dash() {
    this.sample('skillWind', { volume: .2, rate: 1.42, minGap: 120 });
    this.tone(210, .12, 'sawtooth', .038, 2.4);
  }

  jump() { this.tone(280, .09, 'triangle', .035, 1.8); }
  hurt() {
    this.sample('body', { volume: .38, rate: .84, minGap: 90 });
    this.tone(90, .18, 'sawtooth', .055, .45);
    this.noise(.07, .022);
    this.duck = Math.max(this.duck, .28);
  }
  ui() { this.tone(520, .06, 'sine', .03, 1.4); }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.music.pause();
      this.pressure.pause();
    } else {
      this.start(this.scene);
    }
    return this.enabled;
  }
}
