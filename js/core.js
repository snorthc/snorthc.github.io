// Shared engine for every page: chrome (nav/footer), split/reveal, scenes, sound, site data.
import { sound } from './sound.js'
import { icon } from './icons.js'

export const $ = (s, r = document) => r.querySelector(s)
export const $$ = (s, r = document) => [...r.querySelectorAll(s)]
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x))
export const lerp = (a, b, t) => a + (b - a) * t
export const prog = (x, a, b) => clamp((x - a) / (b - a))
export const ease = { out: (t) => 1 - Math.pow(1 - t, 3), inOut: (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, expo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t), in: (t) => t * t * t }
export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
export const fine = matchMedia('(pointer: fine)').matches
export { sound }

export const MARK = `<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="mkh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffaf2"/><stop offset=".55" stop-color="#f6dfbd"/><stop offset="1" stop-color="#d7a568" stop-opacity=".6"/></linearGradient><linearGradient id="mkd" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e2b884" stop-opacity="0"/><stop offset=".5" stop-color="#fffbf4"/><stop offset="1" stop-color="#e2b884" stop-opacity="0"/></linearGradient><clipPath id="mkf"><rect x="0" y="32" width="64" height="32"/></clipPath></defs><path d="M1 32 Q32 24.5 63 32 Q32 39.5 1 32Z" fill="url(#mkd)"/><circle cx="32" cy="32" r="14.2" fill="none" stroke="url(#mkh)" stroke-width="3.6"/><circle cx="32" cy="32" r="12.3" fill="#060608"/><path d="M1 32 Q32 24.5 63 32 Q32 39.5 1 32Z" fill="url(#mkd)" clip-path="url(#mkf)"/></svg>`
export const ARROW = `<svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`

/* ------------------------------------------------------------------ chrome */
const PAGES = [['/#features', 'Features'], ['/#pricing', 'Pricing'], ['/help.html', 'Help'], ['/faq.html', 'FAQ']]
function chrome() {
  const here = location.pathname.replace(/index\.html$/, '')
  const nav = document.createElement('header')
  nav.className = 'nav'
  nav.innerHTML = `
    <a class="brand" href="/" aria-label="Astrala home">${MARK}ASTRALA</a>
    <nav class="nav-links">${PAGES.map(([h, t]) => `<a href="${h}" class="${h === here ? 'active' : ''}">${t}</a>`).join('')}</nav>
    <a class="btn btn-gold" href="/download.html">Download</a>
    <button class="menu-btn" aria-label="Menu" aria-expanded="false"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 8h16M4 16h16"/></svg></button>`
  document.body.prepend(nav)
  const ann = document.createElement('div'); ann.className = 'announce'; ann.setAttribute('role', 'status'); document.body.prepend(ann)
  $('.menu-btn', nav).addEventListener('click', (e) => e.currentTarget.setAttribute('aria-expanded', String($('.nav-links', nav).classList.toggle('open'))))
  $$('.nav-links a', nav).forEach((a) => a.addEventListener('click', () => { $('.nav-links', nav).classList.remove('open'); $('.menu-btn', nav).setAttribute('aria-expanded', 'false') }))
  // hide on scroll down, show on scroll up
  let lastY = scrollY
  addEventListener('scroll', () => { const y = scrollY; nav.classList.toggle('hide', y > 200 && y > lastY + 4); if (y < lastY - 4 || y < 200) nav.classList.remove('hide'); lastY = y }, { passive: true })
  const foot = $('footer[data-footer]')
  if (foot) {
    foot.className = 'footer'
    foot.innerHTML = `<div class="wrap">
      <div class="f-grid">
        <div><a class="brand" href="/">${MARK}ASTRALA</a>
          <p class="muted" style="margin-top:16px;max-width:30ch;font-size:15px">The private, self-custody crypto wallet for Mac. Free to download.</p>
          <div class="f-soc" data-links="icons"></div></div>
        <div class="f-col"><h4>Product</h4><a href="/#features">Features</a><a href="/#pricing">Pricing</a><a href="/download.html">Download</a><a href="/download.html#extension">Browser extension</a><a href="#" data-source>Source code</a></div>
        <div class="f-col"><h4>Learn</h4><a href="/help.html">Help center</a><a href="/faq.html">FAQ</a><a href="/download.html#verify">Verify a download</a><a href="/faq.html#scam">Is it safe?</a></div>
        <div class="f-col"><h4>Community</h4><div data-links="list"></div></div>
      </div>
      <div class="f-bottom"><span>© ${new Date().getFullYear()} Astrala · Public beta</span><span>This site counts page views. No cookies, no IP addresses, no trackers.</span></div>
      <p class="f-legal">Astrala is self-custody software. You alone hold your keys and are responsible for your funds. Crypto assets are volatile and you may get back less than you put in. Astrala is not a bank, broker, custodian or financial adviser and gives no financial advice. Public beta: use a fresh wallet with amounts you can afford to lose.</p></div>`
  }
}

/* ------------------------------------------------------------------ site data (admin-controlled) */
let siteCache = null
export function site() {
  if (!siteCache) siteCache = fetch('/api/site', { cache: 'no-store' }).then((r) => r.ok ? r.json() : null).catch(() => null)
  return siteCache
}
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])) }
export { esc }
async function applySite() {
  const s = await site()
  const links = s?.links || []
  $$('[data-links="icons"]').forEach((el) => { el.innerHTML = links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener" aria-label="${esc(l.name)}" title="${esc(l.name)}">${icon(l.id)}</a>`).join('') })
  $$('[data-links="list"]').forEach((el) => { el.innerHTML = links.length ? links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.name)}</a>`).join('') : '<span class="dim" style="font-size:14px">Coming soon</span>' })
  $$('[data-links="cards"]').forEach((el) => {
    el.innerHTML = links.length ? links.map((l, i) => `<a class="soc-card" href="${esc(l.url)}" target="_blank" rel="noopener" data-reveal style="--d:${i * 70}ms">${icon(l.id)}<span>${esc(l.name)}</span><svg class="soc-go" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17 17 7M9 7h8v8"/></svg></a>`).join('')
      : `<p class="dim" style="grid-column:1/-1;text-align:center">Community channels open at launch.</p>`
    observeReveals(el)
  })
  $$('[data-source]').forEach((a) => { if (s?.source) { a.href = s.source; a.target = '_blank'; a.rel = 'noopener' } else a.removeAttribute('href') })
  const a = s?.announcement, bar = $('.announce')
  if (a && bar) {
    bar.className = `announce tone-${a.tone}`
    bar.innerHTML = `<i class="dot"></i><span>${esc(a.text)}</span>${a.link ? `<a href="${esc(a.link)}">Learn more</a>` : ''}`
    requestAnimationFrame(() => { bar.classList.add('show'); document.body.classList.add('has-announce') })
  }
  document.dispatchEvent(new CustomEvent('site', { detail: s }))
}

/* ------------------------------------------------------------------ analytics: one anonymous ping per page view */
function hit() {
  if (navigator.doNotTrack === '1' || navigator.webdriver) return
  let newVisit = false
  try { if (!sessionStorage.getItem('astrala-visit')) { sessionStorage.setItem('astrala-visit', '1'); newVisit = true } } catch {}
  let ref = ''
  try { const r = document.referrer && new URL(document.referrer); if (r && r.host !== location.host) ref = r.hostname.replace(/^www\./, '') } catch {}
  fetch('/api/hit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: location.pathname, ref, newVisit }), keepalive: true }).catch(() => {})
}

/* ------------------------------------------------------------------ cursor */
export function split(el) {
  if (el.dataset.splitDone) return
  el.dataset.splitDone = '1'
  let i = 0
  const walk = (node) => {
    for (const n of [...node.childNodes]) {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment()
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return
          if (/^\s+$/.test(part)) { frag.append(document.createTextNode(part)); return }
          const w = document.createElement('span'); w.className = 'w'
          for (const ch of part) { const c = document.createElement('span'); c.className = 'c'; c.textContent = ch; c.style.setProperty('--i', i++); w.append(c) }
          frag.append(w)
        })
        n.replaceWith(frag)
      } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n)
    }
  }
  walk(el)
  // keep gold gradients continuous across split letters
  $$('.gold', el).forEach((g) => { const cs = $$('.c', g); cs.forEach((c, k) => { c.style.setProperty('--gw', `${cs.length * 100}%`); c.style.setProperty('--gx', `${cs.length > 1 ? (k / (cs.length - 1)) * 100 : 0}%`) }) })
}
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }), { threshold: .18, rootMargin: '0px 0px -6% 0px' })
export function observeReveals(root = document) {
  $$('[data-split]', root).forEach((el) => { split(el); if (!el.hasAttribute('data-manual')) io.observe(el) })
  $$('[data-reveal]', root).forEach((el) => io.observe(el))
}

/* ------------------------------------------------------------------ scroll scenes */
// scene(el, fn): fn(p, info) every frame while the scene is near the viewport. p = 0..1 across a pinned section.
const scenes = []
export function scene(el, fn, { smooth = 10 } = {}) { const s = { el, fn, p: 0, sp: null, smooth, near: false }; scenes.push(s); return s }
let lastT = performance.now()
function loop(t) {
  const raw = (t - lastT) / 1000; lastT = t
  const dt = Math.min(.05, raw), sdt = Math.min(.3, raw)   // smoothing uses real elapsed time so slow machines still catch up
  const vh = innerHeight
  // read phase: measure everything before any scene writes styles (avoids a forced layout per scene)
  const rects = scenes.map((s) => s.el.getBoundingClientRect())
  // write phase
  scenes.forEach((s, i) => {
    const r = rects[i]
    s.near = r.bottom > -vh * .5 && r.top < vh * 1.5
    if (!s.near) return
    const span = Math.max(1, r.height - vh)
    s.p = clamp(-r.top / span)
    s.sp = s.sp == null || reduce ? s.p : s.sp + (s.p - s.sp) * (1 - Math.exp(-sdt * s.smooth))
    try { s.fn(s.sp, { dt, t, rect: r, raw: s.p }) } catch (e) { console.error('scene', e); s.fn = () => {} }
  })
  requestAnimationFrame(loop)
}

/* ------------------------------------------------------------------ hover/press sounds everywhere */
/* ------------------------------------------------------------------ boot */
export function boot() {
  chrome()
  observeReveals()
  applySite()
  hit()
  requestAnimationFrame(loop)
}

/* ------------------------------------------------------------------ helpers used by pages */
export function fmtBytes(n) { if (!n) return ''; const u = ['B', 'KB', 'MB', 'GB']; let i = 0; while (n >= 1024 && i < 3) { n /= 1024; i++ } return `${n.toFixed(i ? 1 : 0)} ${u[i]}` }
export function fmtDate(s) { try { return new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return '' } }
// a tiny, safe markdown subset for release notes
export function md(src) {
  const lines = esc(src || '').split(/\r?\n/), out = []; let list = false
  const inline = (s) => s.replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
  for (const l of lines) {
    const li = l.match(/^\s*[-*]\s+(.*)/)
    if (li) { if (!list) { out.push('<ul>'); list = true } out.push(`<li>${inline(li[1])}</li>`); continue }
    if (list) { out.push('</ul>'); list = false }
    const h = l.match(/^(#{1,3})\s+(.*)/)
    if (h) out.push(`<h4>${inline(h[2])}</h4>`); else if (l.trim()) out.push(`<p>${inline(l)}</p>`)
  }
  if (list) out.push('</ul>')
  return out.join('')
}
