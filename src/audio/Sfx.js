export class Sfx {
  constructor() {
    this._ctx = null
  }

  _ensure() {
    if (this._ctx) return this._ctx
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null
    this._ctx = new AudioCtx()
    return this._ctx
  }

  async unlock() {
    const ctx = this._ensure()
    if (!ctx) return
    if (ctx.state === 'suspended') await ctx.resume()
  }

  _tone({ freq = 440, durationMs = 80, type = 'sine', gain = 0.04, when = 0 } = {}) {
    const ctx = this._ensure()
    if (!ctx) return
    const t0 = ctx.currentTime + when
    const t1 = t0 + durationMs / 1000

    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)

    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t1)

    osc.connect(g)
    g.connect(ctx.destination)
    osc.start(t0)
    osc.stop(t1 + 0.02)
  }

  digStart() {
    this._tone({ freq: 220, type: 'square', durationMs: 60, gain: 0.03 })
    this._tone({ freq: 180, type: 'square', durationMs: 70, gain: 0.025, when: 0.04 })
  }

  empty() {
    this._tone({ freq: 330, type: 'triangle', durationMs: 70, gain: 0.03 })
    this._tone({ freq: 220, type: 'triangle', durationMs: 120, gain: 0.03, when: 0.08 })
  }

  chestFound() {
    this._tone({ freq: 523.25, type: 'sine', durationMs: 90, gain: 0.045 })
    this._tone({ freq: 659.25, type: 'sine', durationMs: 110, gain: 0.05, when: 0.09 })
    this._tone({ freq: 783.99, type: 'sine', durationMs: 140, gain: 0.055, when: 0.2 })
  }

  gemsInChest() {
    this._tone({ freq: 880, type: 'sine', durationMs: 70, gain: 0.05 })
    this._tone({ freq: 988, type: 'sine', durationMs: 70, gain: 0.05, when: 0.07 })
    this._tone({ freq: 1174, type: 'sine', durationMs: 90, gain: 0.05, when: 0.14 })
    this._tone({ freq: 1568, type: 'sine', durationMs: 140, gain: 0.05, when: 0.24 })
  }

  /** Longer celebration when gems pour out of a chest. */
  gemsCelebration() {
    const notes = [523, 659, 784, 988, 1175, 1319, 1568, 1760]
    notes.forEach((freq, i) => {
      this._tone({ freq, type: 'sine', durationMs: 120, gain: 0.055, when: i * 0.1 })
      this._tone({ freq: freq * 1.25, type: 'triangle', durationMs: 90, gain: 0.03, when: i * 0.1 + 0.05 })
    })
    this._tone({ freq: 2093, type: 'sine', durationMs: 280, gain: 0.06, when: 0.85 })
  }

  lowDigs() {
    this._tone({ freq: 196, type: 'sawtooth', durationMs: 90, gain: 0.035 })
    this._tone({ freq: 196, type: 'sawtooth', durationMs: 90, gain: 0.035, when: 0.16 })
  }

  caveRumble() {
    this._tone({ freq: 110, type: 'square', durationMs: 140, gain: 0.03 })
    this._tone({ freq: 92, type: 'square', durationMs: 180, gain: 0.03, when: 0.12 })
  }

  /** Silly bonk when a bat bumps the miner. */
  batHit() {
    this._tone({ freq: 520, type: 'square', durationMs: 55, gain: 0.05 })
    this._tone({ freq: 180, type: 'sawtooth', durationMs: 140, gain: 0.045, when: 0.06 })
    this._tone({ freq: 90, type: 'triangle', durationMs: 220, gain: 0.04, when: 0.1 })
    this._tone({ freq: 660, type: 'sine', durationMs: 90, gain: 0.035, when: 0.18 })
  }

  /** Brassy thump when the young dragon bumps the miner. */
  dragonHit() {
    this._tone({ freq: 140, type: 'sawtooth', durationMs: 120, gain: 0.05 })
    this._tone({ freq: 220, type: 'square', durationMs: 80, gain: 0.04, when: 0.08 })
    this._tone({ freq: 392, type: 'triangle', durationMs: 100, gain: 0.035, when: 0.14 })
    this._tone({ freq: 98, type: 'sine', durationMs: 200, gain: 0.04, when: 0.1 })
  }

  boatShoot() {
    this._tone({ freq: 180, type: 'square', durationMs: 50, gain: 0.04 })
    this._tone({ freq: 120, type: 'sawtooth', durationMs: 80, gain: 0.035, when: 0.04 })
  }

  whaleHit() {
    this._tone({ freq: 440, type: 'sine', durationMs: 90, gain: 0.05 })
    this._tone({ freq: 660, type: 'sine', durationMs: 120, gain: 0.055, when: 0.08 })
    this._tone({ freq: 880, type: 'triangle', durationMs: 150, gain: 0.05, when: 0.16 })
  }

  whaleExplosion() {
    this._tone({ freq: 90, type: 'sawtooth', durationMs: 120, gain: 0.06 })
    this._tone({ freq: 55, type: 'square', durationMs: 180, gain: 0.05, when: 0.06 })
    this._tone({ freq: 330, type: 'triangle', durationMs: 100, gain: 0.04, when: 0.1 })
    this._tone({ freq: 220, type: 'sine', durationMs: 200, gain: 0.035, when: 0.15 })
  }
}

