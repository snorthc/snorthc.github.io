// Subpages: shared boot + a light starfield + page-specific behaviour.
import { boot, $, $$, site, esc, md, fmtBytes, fmtDate, sound, reduce, MARK } from './core.js'
boot()

/* ---- starfield (cheap 2D, parallax on scroll) ---- */
{
  const cv = document.createElement('canvas'); cv.className = 'stars-bg'; document.body.prepend(cv)
  const ctx = cv.getContext('2d'); let W, H, D, S
  const size = () => { D = Math.min(2, devicePixelRatio); W = cv.width = innerWidth * D; H = cv.height = innerHeight * D; cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px'; S = Array.from({ length: Math.round(innerWidth * innerHeight / 6500) }, () => ({ x: Math.random() * W, y: Math.random() * H, z: Math.random(), p: Math.random() * 6.3 })) }
  size(); addEventListener('resize', size)
  const draw = (t) => {
    ctx.clearRect(0, 0, W, H)
    for (const s of S) {
      let y = (s.y - scrollY * D * (.05 + s.z * .22)) % H; if (y < 0) y += H
      ctx.globalAlpha = (reduce ? .7 : .45 + .55 * Math.abs(Math.sin(s.p + t / 1000 * (.3 + s.z)))) * (.2 + s.z * .8)
      ctx.fillStyle = s.z > .85 ? '#ffeacc' : '#fff'; ctx.beginPath(); ctx.arc(s.x, y, (.4 + s.z * 1.5) * D, 0, 6.283); ctx.fill()
    }
    if (!reduce) requestAnimationFrame(draw)
  }
  requestAnimationFrame(draw)
}

/* ---- copy buttons ---- */
$$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
  const src = b.dataset.copy.startsWith('#') ? $(b.dataset.copy)?.textContent : b.dataset.copy
  try { await navigator.clipboard.writeText(src.trim()); const t = b.textContent; b.textContent = 'Copied'; b.classList.add('done'); sound.play('sparkle'); setTimeout(() => { b.textContent = t; b.classList.remove('done') }, 1500) } catch {}
}))

/* ---- download page: browser-aware extension installer ---- */
const extSetup = $('#ext-setup')
if (extSetup) {
  const copyChip = (url) => `<button type="button" class="ext-copy" data-url="${url}">${url}</button>`
  const chromium = (name, url) => ({
    head: `Detected ${name} — two minutes, no account.`,
    steps: [
      ['Unzip the download', 'You get a folder called <b>astrala-extension</b>. Keep it somewhere you won’t delete.'],
      ['Open the extensions page', `${name} blocks links to it, so copy ${copyChip(url)} and paste it into the address bar.`],
      ['Turn on <b>Developer mode</b>', 'The switch sits in the top-right corner of that page.'],
      ['Click <b>Load unpacked</b>, pick the folder', 'Choose the <b>astrala-extension</b> folder. Astrala lands in your toolbar.'],
    ],
    note: `Installed straight from Astrala, so ${name} shows a “developer mode” reminder and asks you to allow it — expected for a wallet that doesn’t go through a store. ${name === 'Edge' ? 'A free one-click Edge Add-ons listing is on the way.' : 'A free one-click install is on the way.'}`,
  })
  const soft = (name, html) => ({ head: `Detected ${name}.`, html })
  const BROWSERS = {
    chrome: chromium('Chrome', 'chrome://extensions'),
    edge: chromium('Edge', 'edge://extensions'),
    brave: chromium('Brave', 'brave://extensions'),
    opera: chromium('Opera', 'opera://extensions'),
    vivaldi: chromium('Vivaldi', 'vivaldi://extensions'),
    firefox: soft('Firefox', 'A permanent Firefox install needs its own <b>signed build</b> — free, no fee, but a separate step we’re setting up. For now Astrala runs in <b>Chrome, Edge, Brave, Opera or Vivaldi</b>.'),
    safari: soft('Safari', 'Safari packages extensions through Xcode, so there’s no load-from-file option. On a Mac the <a class="inl" href="/download.html">Astrala app</a> above is the better route; for a browser wallet use <b>Chrome, Edge or Brave</b>.'),
  }
  const bindCopy = (root) => $$('.ext-copy', root).forEach((b) => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.url); const t = b.textContent; b.textContent = 'Copied ✓'; b.classList.add('done'); sound.play('sparkle'); setTimeout(() => { b.textContent = t; b.classList.remove('done') }, 1500) } catch {}
  }))
  const render = (key) => {
    const b = BROWSERS[key]
    const br = $('#ext-br'), sw = $('#ext-switch'), det = $('#ext-detect')
    sw.hidden = false
    $$('[data-br]', sw).forEach((x) => x.classList.toggle('on', x.dataset.br === key))
    if (!b) { br.hidden = true; return }
    br.hidden = false; $('#ext-br-name').textContent = b.name === undefined ? key : key[0].toUpperCase() + key.slice(1)
    det.textContent = b.head
    extSetup.innerHTML = b.html
      ? `<p class="ext-soft">${b.html}</p>`
      : `<ol class="ext-steps big">${b.steps.map(([h, s]) => `<li><span class="ext-step-h">${h}</span><span class="ext-step-s">${s}</span></li>`).join('')}</ol><p class="ext-note">${b.note}</p>`
    bindCopy(extSetup)
  }
  const detect = async () => {
    const ua = navigator.userAgent
    if (/Edg\//.test(ua)) return 'edge'
    if (/OPR\//.test(ua)) return 'opera'
    if (/Vivaldi/.test(ua)) return 'vivaldi'
    if (/Firefox\//.test(ua)) return 'firefox'
    try { if (navigator.brave && await navigator.brave.isBrave()) return 'brave' } catch {}
    if (/Chrome\//.test(ua)) return 'chrome'
    if (/Safari\//.test(ua)) return 'safari'
    return null
  }
  $('#ext-switch').addEventListener('click', (e) => { const btn = e.target.closest('[data-br]'); if (btn) { render(btn.dataset.br); sound.play('tick', .3) } })
  detect().then((k) => k && render(k))
}

/* ---- download page: live release from GitHub (via the site server) ---- */
if (document.body.classList.contains('p-download')) {
  site().then((s) => {
    const rel = s?.release, card = $('#rel-card')
    if (rel?.dmg) {
      $('#rel-name').textContent = rel.name || rel.tag
      $('#rel-meta').textContent = [rel.tag, fmtDate(rel.publishedAt), fmtBytes(rel.dmg.size), rel.prerelease ? 'Pre-release' : ''].filter(Boolean).join(' · ')
      $('#rel-btn').href = '/download'; $('#rel-btn').querySelector('span').textContent = `Download ${rel.dmg.name.replace(/^.*?(\.dmg)$/i, '.dmg')}`
      $('#rel-notes').innerHTML = rel.notes ? md(rel.notes) : '<p class="dim">No notes for this release.</p>'
      $('#rel-gh').href = rel.url; $('#rel-gh').hidden = false
      if (rel.dmg.sha256) { $('#sha').textContent = rel.dmg.sha256; $('#sha-row').classList.add('has') }
      $('#sha-cmd').textContent = `shasum -a 256 ~/Downloads/${rel.dmg.name}`
      $('#sha-copy').dataset.copy = `shasum -a 256 ~/Downloads/${rel.dmg.name}`
      card.classList.add('live')
    } else {
      card.classList.add('soon')
      $('#rel-btn')?.removeAttribute('href') // no live release (e.g. static host without the server): don't let the button 404
      if (location.hash === '#soon') card.classList.add('flash')
    }
  })
  $('#notes-toggle')?.addEventListener('click', (e) => { const n = $('#rel-notes-wrap'); const open = n.classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', String(open)); e.currentTarget.querySelector('span').textContent = open ? 'Hide release notes' : 'Release notes' })
}

/* ---- help center: live search across guides ---- */
if (document.body.classList.contains('p-help')) {
  const q = $('#help-q'), items = $$('.guide'), groups = $$('.guide-group'), none = $('#no-results')
  q?.addEventListener('input', () => {
    const v = q.value.trim().toLowerCase(); let shown = 0
    items.forEach((g) => { const hit = !v || g.textContent.toLowerCase().includes(v); g.hidden = !hit; if (hit) shown++; if (v && hit) g.open = true })
    groups.forEach((gr) => { gr.hidden = !$$('.guide', gr).some((g) => !g.hidden) })
    none.hidden = shown > 0
  })
  $$('.cat-card').forEach((c) => c.addEventListener('click', (e) => { e.preventDefault(); const t = $(c.getAttribute('href')); t?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }) }))
}

/* ---- details open/close sound + deep links ---- */
$$('details').forEach((d) => d.addEventListener('toggle', () => sound.play(d.open ? 'whoosh' : 'tick', .35, d.open)))
if (location.hash) { const t = document.getElementById(location.hash.slice(1)); if (t?.tagName === 'DETAILS') t.open = true }
