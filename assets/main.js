/* N10 v3.1 — intro sequence, smooth scroll, parallax, scroll-linked reveals (no libraries) */
(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STATIC = window.__static === true;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  /* ---------------------------------------------------------
     1. Build "SPACES" as SVG outline letters (one <text> each)
     --------------------------------------------------------- */
  function buildWord() {
    var svg = $('.hw-svg'); if (!svg) return;
    var NS = 'http://www.w3.org/2000/svg', word = svg.dataset.word, x = 0, track = -10;
    svg.innerHTML = '';
    var letters = word.split('').map(function (ch) {
      var t = document.createElementNS(NS, 'text');
      t.textContent = ch; t.setAttribute('x', x); t.setAttribute('y', 0);
      svg.appendChild(t);
      x += t.getComputedTextLength() + track;
      t.style.setProperty('--l', 1700);
      return t;
    });
    var bb = svg.getBBox();
    svg.setAttribute('viewBox', [bb.x - 4, bb.y - 4, bb.width + 8, bb.height + 8].join(' '));
    /* random drawing order */
    letters.map(function (t) { return { t: t, r: Math.random() }; })
      .sort(function (a, b) { return a.r - b.r; })
      .forEach(function (o, i) { o.t.style.setProperty('--d', (i * 0.13 + Math.random() * 0.08).toFixed(2) + 's'); });
  }

  /* ---------------------------------------------------------
     2. Intro timeline
     --------------------------------------------------------- */
  function runIntro() {
    var hero = $('.hero');
    if (reduce || STATIC) { root.classList.add('no-intro', 's-h1done'); hero.classList.add('drawn'); $$('.hero .fl').forEach(function (f) { f.classList.add('show'); }); return; }
    var at = function (ms, fn) { setTimeout(fn, ms); };
    var add = function (c) { return function () { root.classList.add(c); }; };
    at(150, add('intro-on'));                 // gold outlines draw "SPACES", letters in random order
    at(2250, function () { hero.classList.add('drawn'); });  // SPACES fades back first…
    at(2900, add('s-tag'));                   // …then the small text fades down
    at(3050, add('s-h1'));                    // headline lines rise up
    at(4400, add('s-h1done'));                // stop clipping once lines are in place
    $$('.hero .fl').forEach(function (f, i) { // images one by one, tiny gap
      at(3500 + i * 150, function () { f.classList.add('show'); });
    });
    at(3950, add('s-foot'));
    at(4050, add('s-nav'));                   // navbar drops into place
    at(4350, add('s-disc'));                  // scroll badge pops
    at(4950, add('s-spin'));                  // …then starts spinning                  // …then starts spinning
  }

  /* ---------------------------------------------------------
     3. Smooth (inertial) wheel scrolling — desktop only
     --------------------------------------------------------- */
  var target = scrollY, current = scrollY, smooth = !reduce && !STATIC && matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (smooth) {
    root.classList.add('lenis');
    addEventListener('wheel', function (e) {
      if (e.ctrlKey) return;
      e.preventDefault();
      target = clamp(target + e.deltaY * (e.deltaMode === 1 ? 40 : 1), 0, root.scrollHeight - innerHeight);
    }, { passive: false });
    addEventListener('scroll', function () { if (Math.abs(scrollY - current) > 2) { target = current = scrollY; } }, { passive: true });
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href'); if (id.length < 2) return;
        var el = $(id); if (!el) return; e.preventDefault();
        target = clamp(el.getBoundingClientRect().top + scrollY, 0, root.scrollHeight - innerHeight);
      });
    });
  }

  /* split studio statement into words */
  $$('[data-hl]').forEach(function (p) {
    p.innerHTML = p.textContent.trim().split(/\s+/).map(function (w) { return '<span class="hw">' + w + '</span>'; }).join(' ');
  });

  var nav = $('.nav');
  var par = $$('[data-speed]');
  var zoom = $('.zoom'), zs = $('.zoom-sticky'), zE = 0;
  var path = $('#pline'), proc = $('.proc'), len = path ? path.getTotalLength() : 0, drawn = 0;
  var pts = $$('.ps').map(function (el) {
    var x = +el.dataset.x, lo = 0, hi = len;
    for (var k = 0; k < 30; k++) { var m = (lo + hi) / 2; if (path.getPointAtLength(m).x < x) lo = m; else hi = m; }
    return { el: el, at: hi };
  });
  if (path) path.style.setProperty('--len', len);
  var cta = $('.cta'), lines = $$('.big-line'), orb = null, ctaP = 0;

  /* ---------------------------------------------------------
     4. Frame loop
     --------------------------------------------------------- */
  function frame() {
    if (smooth) { current = lerp(current, target, 0.085); if (Math.abs(target - current) < 0.4) current = target; if (Math.abs(scrollY - current) >= 0.5) scrollTo(0, current); }
    var vh = innerHeight, y = smooth ? current : scrollY;
    nav.classList.toggle('solid', y > vh * .8);

    /* parallax */
    if (!STATIC && !reduce) par.forEach(function (el) {
      var r = el.getBoundingClientRect(), s = +el.dataset.speed;
      var mid = el.closest('.hero') ? y : r.top + r.height / 2 - vh / 2;
      el.style.transform = (el.classList.contains('hero-word') ? 'translate(-50%,-50%) ' : '') +
        'translate3d(' + (el._mx || 0) + 'px,' + (-mid * s + (el._my || 0)) + 'px,0)';
    });

    /* studio statement fills word by word */
    $$('.hl-text').forEach(function (p) {
      var r = p.getBoundingClientRect();
      var pr = STATIC ? .55 : clamp((vh * .85 - r.top) / (r.height + vh * .35), 0, 1);
      var ws = p.querySelectorAll('.hw'), n = Math.round(ws.length * pr);
      for (var i = 0; i < ws.length; i++) ws[i].classList.toggle('on', i < n);
    });

    /* arch zoom — eased + smoothed */
    if (zoom) {
      var zr = zoom.getBoundingClientRect();
      var t = STATIC ? .35 : clamp(-zr.top / (zr.height - vh), 0, 1);
      var e = t * t * (3 - 2 * t);
      zE = STATIC ? e : lerp(zE, e, 0.12);
      var rad = Math.round(999 * (1 - zE));
      zs.style.setProperty('--zw', (30 + 70 * zE) + 'vw');
      zs.style.setProperty('--zh', (70 + 30 * zE) + 'vh');
      zs.style.setProperty('--zr', rad + 'px ' + rad + 'px 0 0');
      zs.style.setProperty('--zs', 1.25 - .25 * zE);
      zs.style.setProperty('--zx', (zE * 20) + 'vw');
      zs.style.setProperty('--zo', Math.max(0, 1 - zE * 1.6));
    }

    /* process: line starts when section is at 75% of the screen, points reveal as it reaches them */
    if (path) {
      var pr2 = proc.getBoundingClientRect();
      var span = pr2.height + vh * .3;
      var goal = STATIC ? .62 : clamp((vh * .75 - pr2.top) / span, 0, 1);
      drawn = STATIC ? goal * len : lerp(drawn, goal * len, 0.1);
      path.style.setProperty('--off', len - drawn);
      pts.forEach(function (p) { p.el.classList.toggle('on', drawn >= p.at - 4); });
    }

    /* CTA: big lines slide in from opposite sides */
    if (cta) {
      var cr = cta.getBoundingClientRect();
      var g2 = STATIC ? 1 : clamp((vh - cr.top) / (vh * .9), 0, 1);
      ctaP = STATIC ? g2 : lerp(ctaP, g2, 0.1);
      lines.forEach(function (l) { l.style.transform = 'translate3d(' + (+l.dataset.slide * (1 - ctaP) * 18) + 'vw,0,0)'; });
      if (orb) orb.style.transform = 'rotate(' + (-40 * (1 - ctaP)) + 'deg) scale(' + (0.6 + 0.4 * ctaP) + ')';
    }

    requestAnimationFrame(frame);
  }

  /* mouse parallax in hero */
  var hero = $('.hero');
  if (!reduce && !STATIC && matchMedia('(hover:hover)').matches) {
    hero.addEventListener('mousemove', function (ev) {
      var dx = ev.clientX / innerWidth - .5, dy = ev.clientY / innerHeight - .5;
      $$('[data-mouse]').forEach(function (el) { var m = +el.dataset.mouse; el._mx = -dx * m; el._my = -dy * m; });
    });
  }

  /* reveal-on-view for cards, quotes etc. */
  var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }); }, { threshold: .15 });
  $$('.w, .qc, .f-team span').forEach(function (el) { el.setAttribute('data-reveal', ''); io.observe(el); });
  if (STATIC) $$('[data-reveal]').forEach(function (el) { el.classList.add('in'); });

  /* start once fonts are ready (needed to measure the outline letters) */
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () {
    buildWord(); runIntro(); requestAnimationFrame(frame);
  });
})();
