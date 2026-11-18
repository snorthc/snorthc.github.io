// Synthesized site sound: no files, nothing tonal enough to fight a song. Off until the visitor opts in.
const KEY = 'astrala-sound'
let ctx = null, master = null, comp = null, amb = null, noiseBuf = null
let enabled = (() => { try { return localStorage.getItem(KEY) === 'on' } catch { return false } })()
const listeners = new Set()

function ensure() {
  if (ctx) return ctx
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4
  master = ctx.createGain(); master.gain.value = 0
  master.connect(comp); comp.connect(ctx.destination)
  // 2s of white noise, reused by every effect
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return ctx
}
const now = () => ctx.currentTime
function noise(dur) { const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = dur > 1.9; return s }
function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d) }

function ambient(on) {
  if (!ctx) return
  if (on && !amb) {
    // deep space bed: filtered brown-ish noise breathing slowly + a sub hum, very quiet
    const n = noise(3); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260; lp.Q.value = .7
    const g = ctx.createGain(); g.gain.value = 0
    const lfo = ctx.createOscillator(); lfo.frequency.value = .07; const lg = ctx.createGain(); lg.gain.value = 120; lfo.connect(lg); lg.connect(lp.frequency)
    const sub = ctx.createOscillator(); sub.type = 'sine'; sub.frequency.value = 43; const sg = ctx.createGain(); sg.gain.value = .045
    n.connect(lp); lp.connect(g); sub.connect(sg); sg.connect(g); g.connect(master)
    n.start(); lfo.start(); sub.start()
    g.gain.linearRampToValueAtTime(.12, now() + 3)
    amb = { g, stop: () => { g.gain.cancelScheduledValues(now()); g.gain.setTargetAtTime(0, now(), .4); setTimeout(() => { try { n.stop(); lfo.stop(); sub.stop() } catch {} }, 1500) } }
  } else if (!on && amb) { amb.stop(); amb = null }
}

const FX = {
  tick() { // hover: a dry 6ms click
    const t = now(), n = noise(.05), hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3800
    const g = ctx.createGain(); env(g, t, .002, .09, .03); n.connect(hp); hp.connect(g); g.connect(master); n.start(t); n.stop(t + .05)
  },
  click() { // press: soft thump + click
    const t = now(), o = ctx.createOscillator(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(48, t + .09)
    const g = ctx.createGain(); env(g, t, .003, .5, .12); o.connect(g); g.connect(master); o.start(t); o.stop(t + .2)
    FX.tick()
  },
  whoosh(dur = .9, up = true) { // filtered noise sweep
    const t = now(), n = noise(dur + .1), bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.4
    bp.frequency.setValueAtTime(up ? 300 : 4000, t); bp.frequency.exponentialRampToValueAtTime(up ? 5000 : 260, t + dur)
    const g = ctx.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.5, t + dur * .7); g.gain.exponentialRampToValueAtTime(.0001, t + dur)
    n.connect(bp); bp.connect(g); g.connect(master); n.start(t); n.stop(t + dur + .1)
  },
  impact(weight = 1) { // landing / slam: sub drop + noise burst
    const t = now(), o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(32, t + .5)
    const g = ctx.createGain(); env(g, t, .004, .9 * weight, .7); o.connect(g); g.connect(master); o.start(t); o.stop(t + .8)
    const n = noise(.6), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(5000, t); lp.frequency.exponentialRampToValueAtTime(200, t + .4)
    const g2 = ctx.createGain(); env(g2, t, .002, .45 * weight, .35); n.connect(lp); lp.connect(g2); g2.connect(master); n.start(t); n.stop(t + .6)
  },
  sparkle() { // something arrived: airy high noise shimmer, not a note
    const t = now(), n = noise(.6), bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 7200; bp.Q.value = 3
    const g = ctx.createGain(); env(g, t, .01, .22, .45); n.connect(bp); bp.connect(g); g.connect(master); n.start(t); n.stop(t + .6)
  },
  glitch() { // stuttering crushed noise
    const t = now()
    for (let i = 0; i < 7; i++) {
      const s = t + i * .045 + Math.random() * .02, n = noise(.05), bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 600 + Math.random() * 5000; bp.Q.value = 6
      const g = ctx.createGain(); env(g, s, .001, .35, .03); n.connect(bp); bp.connect(g); g.connect(master); n.start(s); n.stop(s + .06)
    }
  },
  slash() { // blade: fast downward sweep + crack
    FX.whoosh(.28, false)
    const t = now() + .2, n = noise(.1), hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500
    const g = ctx.createGain(); env(g, t, .001, .5, .08); n.connect(hp); hp.connect(g); g.connect(master); n.start(t); n.stop(t + .1)
  },
  switch() { // segmented control / toggle
    const t = now(), o = ctx.createOscillator(); o.type = 'square'; o.frequency.setValueAtTime(1800, t); o.frequency.exponentialRampToValueAtTime(600, t + .03)
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400
    const g = ctx.createGain(); env(g, t, .001, .12, .04); o.connect(lp); lp.connect(g); g.connect(master); o.start(t); o.stop(t + .06)
  },
  type() { // terminal key
    const t = now(), n = noise(.03), bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2200 + Math.random() * 1500; bp.Q.value = 2
    const g = ctx.createGain(); env(g, t, .001, .12, .02); n.connect(bp); bp.connect(g); g.connect(master); n.start(t); n.stop(t + .03)
  },
  warp() { // entering: long rise into a drop
    FX.whoosh(1.6, true); setTimeout(() => enabled && FX.impact(.8), 1350)
  },
  drop() { // tunnel drop: down-sweep + clunk
    FX.whoosh(.5, false); setTimeout(() => enabled && FX.impact(.55), 380)
  }
}

export const sound = {
  get on() { return enabled },
  play(name, ...a) { if (!enabled || !ctx || ctx.state !== 'running') return; try { FX[name]?.(...a) } catch {} },
  // must be called from a user gesture the first time
  async enable(v = true) {
    enabled = v
    try { localStorage.setItem(KEY, v ? 'on' : 'off') } catch {}
    if (v) { if (!ensure()) return; await ctx.resume(); master.gain.setTargetAtTime(.9, now(), .05); ambient(true) }
    else if (ctx) { ambient(false); master.gain.setTargetAtTime(0, now(), .1) }
    listeners.forEach((f) => f(v))
  },
  // resume after a page load once the visitor interacts (browsers require a gesture per page)
  async wake() { if (enabled && (!ctx || ctx.state !== 'running')) await sound.enable(true) },
  onChange(f) { listeners.add(f); return () => listeners.delete(f) }
}
