/* Sahana Madhavan — portfolio interactions (no dependencies) */
(function () {
  'use strict';


  /* ---------- Sticky nav: shadow on scroll + mobile menu ---------- */
  var nav = document.querySelector('.nav');
  var toggle = document.querySelector('.nav__toggle');
  var links = document.getElementById('nav-links');

  function onScroll() { nav.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    toggle.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
  }
  toggle.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
  links.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); } });

  /* ---------- Active section highlighting ---------- */
  var navAnchors = Array.prototype.slice.call(links.querySelectorAll('a'));
  var sections = navAnchors.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
  if ('IntersectionObserver' in window) {
    var visible = new Map();
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible.set(en.target.id, en.isIntersecting ? en.intersectionRatio : 0); });
      var best = null, bestRatio = 0;
      visible.forEach(function (r, id) { if (r > bestRatio) { bestRatio = r; best = id; } });
      navAnchors.forEach(function (a) {
        if (best && a.getAttribute('href') === '#' + best) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.01, 0.5, 1] });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Subtle reveal ---------- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var reveals = document.querySelectorAll('.reveal');
  if (!reduce && 'IntersectionObserver' in window) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-visible'); ro.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { ro.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Tabs (screenshot gallery) ---------- */
  document.querySelectorAll('[data-gallery]').forEach(function (gallery) {
    var tabs = Array.prototype.slice.call(gallery.querySelectorAll('[role="tab"]'));
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') n = tabs[0];
        if (e.key === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
  });

  /* ---------- Screenshot viewer: zoom, pan, pinch, swipe ---------- */
  var dlg = document.getElementById('lightbox');
  var lb = dlg.querySelector('.lb');
  var stage = dlg.querySelector('.lb__stage');
  var img = dlg.querySelector('.lb__img');
  var capEl = dlg.querySelector('.lb__caption');
  var countEl = dlg.querySelector('.lb__count');
  var zoomEl = dlg.querySelector('.lb__zoom');
  var btnIn = dlg.querySelector('[data-lb="in"]');
  var btnOut = dlg.querySelector('[data-lb="out"]');
  var btnPrev = dlg.querySelector('[data-lb="prev"]');
  var btnNext = dlg.querySelector('[data-lb="next"]');
  var MIN = 1, MAX = 5;
  var groups = {};
  var items = [], index = 0, trigger = null;
  var s = 1, tx = 0, ty = 0;
  var pointers = new Map();
  var gesture = null;
  var lastTap = { t: 0, x: 0, y: 0 };
  var closing = false;

  document.querySelectorAll('[data-zoom]').forEach(function (btn) {
    var g = btn.dataset.group || btn.dataset.zoom;
    (groups[g] = groups[g] || []).push(btn);
    btn.addEventListener('click', function () { open(btn); });
  });

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function anim(el, frames, opts) { return (!reduce && el.animate) ? el.animate(frames, opts) : null; }

  function bounds() {
    var r = stage.getBoundingClientRect();
    var w = img.offsetWidth * s, h = img.offsetHeight * s;
    return { mx: Math.max(0, (w - r.width) / 2 + 8), my: Math.max(0, (h - r.height) / 2 + 8) };
  }
  function apply(animate) {
    if (s <= MIN + 0.001) { s = MIN; tx = 0; ty = 0; }
    var b = bounds();
    tx = clamp(tx, -b.mx, b.mx); ty = clamp(ty, -b.my, b.my);
    img.classList.toggle('is-animating', !!animate && !reduce);
    img.style.transform = 'translate3d(' + tx + 'px,' + ty + 'px,0) scale(' + s + ')';
    var zoomed = s > MIN + 0.01;
    lb.classList.toggle('is-zoomed', zoomed);
    stage.classList.toggle('is-zoomed', zoomed);
    zoomEl.textContent = Math.round(s * 100) + '%';
    btnOut.disabled = !zoomed;
    btnIn.disabled = s >= MAX - 0.01;
  }
  /* zoom so the image point under screen point (qx, qy) stays put */
  function zoomAt(ns, qx, qy, animate) {
    ns = clamp(ns, MIN, MAX);
    var r = stage.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (qx == null) { qx = cx; qy = cy; }
    var k = ns / s;
    tx = (qx - cx) - k * (qx - cx - tx);
    ty = (qy - cy) - k * (qy - cy - ty);
    s = ns;
    apply(animate);
  }
  function reset(animate) { s = 1; tx = 0; ty = 0; apply(animate); }

  function show(i, dir) {
    index = (i + items.length) % items.length;
    var btn = items[index];
    var thumb = btn.querySelector('img');
    var multi = items.length > 1;
    btnPrev.hidden = !multi; btnNext.hidden = !multi;
    countEl.textContent = multi ? (index + 1) + ' / ' + items.length : '';
    capEl.textContent = btn.dataset.caption || '';
    img.alt = thumb ? thumb.alt : '';
    img.classList.toggle('is-phone', btn.hasAttribute('data-phone'));
    reset(false);
    var src = btn.dataset.zoom.replace(/\.png$/, '.webp');
    var ready = new Promise(function (res) {
      var probe = new Image();
      probe.onload = function () { res(src); };
      probe.onerror = function () { res(btn.dataset.zoom); };
      probe.src = src;
    });
    return ready.then(function (url) {
      img.src = url;
      return img.decode ? img.decode().catch(function () {}) : null;
    }).then(function () {
      if (dir) anim(img, [{ opacity: 0, transform: 'translate3d(' + (dir * 60) + 'px,0,0) scale(.98)' }, { opacity: 1, transform: 'translate3d(0,0,0) scale(1)' }], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
    });
  }

  function open(btn) {
    if (typeof dlg.showModal !== 'function') { window.open(btn.dataset.zoom, '_blank', 'noopener'); return; }
    trigger = btn;
    items = groups[btn.dataset.group || btn.dataset.zoom];
    closing = false;
    img.style.opacity = '0';
    dlg.showModal();
    dlg.querySelector('[data-lb="close"]').focus({ preventScroll: true });
    document.documentElement.style.overflow = 'hidden';
    anim(lb, [{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
    show(items.indexOf(btn)).then(function () {
      img.style.opacity = '';
      var from = (btn.querySelector('img') || btn).getBoundingClientRect();
      var to = img.getBoundingClientRect();
      if (!to.width) return;
      var dx = (from.left + from.width / 2) - (to.left + to.width / 2);
      var dy = (from.top + from.height / 2) - (to.top + to.height / 2);
      var k = from.width / to.width;
      anim(img, [{ transform: 'translate3d(' + dx + 'px,' + dy + 'px,0) scale(' + k + ')', opacity: .6 }, { transform: 'translate3d(0,0,0) scale(1)', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)' });
    });
  }
  function close() {
    if (closing || !dlg.open) return;
    closing = true;
    var a = anim(lb, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.98)' }], { duration: 180, easing: 'ease-in' });
    var done = function () { dlg.close(); };
    if (a) a.onfinish = done; else done();
  }
  dlg.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
  dlg.addEventListener('close', function () {
    document.documentElement.style.overflow = '';
    pointers.clear(); gesture = null;
    if (trigger) trigger.focus();
  });
  function go(d) { if (items.length > 1) show(index + d, d); }

  dlg.addEventListener('click', function (e) {
    var b = e.target.closest('[data-lb]');
    if (!b) { if (e.target === dlg || e.target === lb) close(); return; }
    var act = b.dataset.lb;
    if (act === 'in') zoomAt(s * 1.5, null, null, true);
    else if (act === 'out') zoomAt(s / 1.5, null, null, true);
    else if (act === 'reset') reset(true);
    else if (act === 'close') close();
    else if (act === 'prev') go(-1);
    else if (act === 'next') go(1);
  });
  dlg.addEventListener('keydown', function (e) {
    if (e.target.closest && e.target.closest('input, textarea')) return;
    if (e.key === 'ArrowRight' && s === 1) { e.preventDefault(); go(1); }
    else if (e.key === 'ArrowLeft' && s === 1) { e.preventDefault(); go(-1); }
    else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomAt(s * 1.5, null, null, true); }
    else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomAt(s / 1.5, null, null, true); }
    else if (e.key === '0') { e.preventDefault(); reset(true); }
  });

  /* mouse wheel & trackpad pinch */
  stage.addEventListener('wheel', function (e) {
    e.preventDefault();
    var dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    zoomAt(s * Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0018)), e.clientX, e.clientY, false);
  }, { passive: false });

  /* double-click (mouse) */
  var lastPointerType = 'mouse';
  stage.addEventListener('dblclick', function (e) {
    if (lastPointerType !== 'mouse') return;
    if (s > 1.01) reset(true); else zoomAt(2.5, e.clientX, e.clientY, true);
  });

  /* pointer gestures: pan, pinch, swipe, double-tap */
  function mid() {
    var p = Array.from(pointers.values());
    return { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2, d: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1 };
  }
  function startGesture() {
    if (pointers.size >= 2) {
      var m = mid();
      gesture = { type: 'pinch', s0: s, tx0: tx, ty0: ty, m0: m };
    } else if (pointers.size === 1) {
      var p = pointers.values().next().value;
      gesture = { type: s > 1.01 ? 'pan' : 'swipe', x0: p.x, y0: p.y, tx0: tx, ty0: ty, moved: false };
    }
  }
  stage.addEventListener('pointerdown', function (e) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    lastPointerType = e.pointerType;
    stage.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    startGesture();
    stage.classList.add('is-dragging');
  });
  stage.addEventListener('pointermove', function (e) {
    if (!pointers.has(e.pointerId) || !gesture) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (gesture.type === 'pinch' && pointers.size >= 2) {
      var m = mid(), g = gesture;
      s = g.s0; tx = g.tx0; ty = g.ty0;
      var ns = clamp(g.s0 * (m.d / g.m0.d), MIN * 0.85, MAX * 1.15);
      var r = stage.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var k = ns / g.s0;
      tx = (g.m0.x - cx) - k * (g.m0.x - cx - g.tx0) + (m.x - g.m0.x);
      ty = (g.m0.y - cy) - k * (g.m0.y - cy - g.ty0) + (m.y - g.m0.y);
      s = ns;
      img.classList.remove('is-animating');
      img.style.transform = 'translate3d(' + tx + 'px,' + ty + 'px,0) scale(' + s + ')';
      zoomEl.textContent = Math.round(s * 100) + '%';
      return;
    }
    var dx = e.clientX - gesture.x0, dy = e.clientY - gesture.y0;
    if (Math.abs(dx) + Math.abs(dy) > 6) gesture.moved = true;
    if (gesture.type === 'pan') {
      tx = gesture.tx0 + dx; ty = gesture.ty0 + dy; apply(false);
    } else if (gesture.type === 'swipe' && gesture.moved) {
      var horizontal = Math.abs(dx) > Math.abs(dy);
      var ox = horizontal && items.length > 1 ? dx : 0;
      var oy = !horizontal && dy > 0 ? dy : 0;
      img.classList.remove('is-animating');
      img.style.transform = 'translate3d(' + ox + 'px,' + oy + 'px,0) scale(' + (1 - Math.min(oy, 300) / 1500) + ')';
      lb.style.opacity = String(1 - Math.min(oy, 300) / 600);
    }
  });
  function endPointer(e) {
    if (!pointers.has(e.pointerId)) return;
    var g = gesture;
    pointers.delete(e.pointerId);
    if (g && g.type === 'pinch') {
      if (pointers.size < 2) { s = clamp(s, MIN, MAX); apply(true); startGesture(); }
      if (!pointers.size) stage.classList.remove('is-dragging');
      return;
    }
    stage.classList.remove('is-dragging');
    gesture = null;
    if (!g) return;
    var dx = e.clientX - g.x0, dy = e.clientY - g.y0;
    if (g.type === 'swipe') {
      lb.style.opacity = '';
      if (g.moved && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) && items.length > 1) { go(dx < 0 ? 1 : -1); return; }
      if (g.moved && dy > 110 && dy > Math.abs(dx)) { close(); return; }
      apply(true);
    }
    if (!g.moved && e.pointerType !== 'mouse') {
      var now = Date.now();
      if (now - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 40) {
        if (s > 1.01) reset(true); else zoomAt(2.5, e.clientX, e.clientY, true);
        lastTap.t = 0;
      } else {
        lastTap = { t: now, x: e.clientX, y: e.clientY };
      }
    }
  }
  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', endPointer);
  window.addEventListener('resize', function () { if (dlg.open) apply(false); });

  /* ---------- Footer year ---------- */
  var y = document.querySelector('[data-year]');
  if (y) y.textContent = String(new Date().getFullYear());
})();
