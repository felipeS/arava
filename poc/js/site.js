(function () {
  'use strict';

  var doc = document.documentElement;
  doc.classList.add('js');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header: vidrio sobre el hero, blanco al hacer scroll */
  var header = document.querySelector('.mainHeader');
  function onScroll() {
    header.classList.toggle('white', window.scrollY > 40);
  }
  if (header) {
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* Menú móvil */
  var menu = document.querySelector('.plegableMenu');
  var burger = document.querySelector('.burger');
  function setMenu(open) {
    menu.classList.toggle('open', open);
    doc.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) menu.querySelector('.close').focus();
    else burger.focus();
  }
  if (menu && burger) {
    burger.addEventListener('click', function () { setMenu(true); });
    menu.querySelector('.close').addEventListener('click', function () { setMenu(false); });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        menu.classList.remove('open');
        doc.classList.remove('menu-open');
        document.body.style.overflow = '';
        burger.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) setMenu(false);
    });
  }

  /* Hero: crossfade automático */
  var hero = document.querySelector('.hero');
  if (hero) {
    var slides = [].slice.call(hero.querySelectorAll('.v-slide'));
    var dotsBox = hero.querySelector('.heroDots');
    var caption = hero.querySelector('.heroCaption');
    var current = 0;
    var timer = null;
    var dots = slides.map(function (slide, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Imagen ' + (i + 1) + ': ' + slide.dataset.caption);
      b.addEventListener('click', function () { show(i); });
      dotsBox.appendChild(b);
      return b;
    });

    /* El video solo se descarga en escritorio y sin ahorro de datos */
    var video = hero.querySelector('video[data-src]');
    var conn = navigator.connection || {};
    var wantsVideo = video && !reduced && !conn.saveData && window.matchMedia('(min-width: 900px)').matches;
    if (wantsVideo) {
      window.addEventListener('load', function () {
        video.addEventListener('canplay', function () {
          if (current === 0) video.play().catch(function () {});
        }, { once: true });
        video.preload = 'auto';
        video.src = video.dataset.src;
        video.load();
      });
    } else if (video) {
      video.remove();
      video = null;
    }

    function show(i) {
      current = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) { s.classList.toggle('active', n === current); });
      dots.forEach(function (d, n) {
        if (n === current) d.setAttribute('aria-current', 'true');
        else d.removeAttribute('aria-current');
      });
      if (caption) caption.textContent = slides[current].dataset.caption;
      if (video && video.src) {
        if (current === 0) video.play().catch(function () {});
        else video.pause();
      }
      schedule();
    }
    function schedule() {
      clearTimeout(timer);
      if (reduced) return;
      var hold = current === 0 && video && video.src ? 14000 : 6000;
      timer = setTimeout(function () { show(current + 1); }, hold);
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clearTimeout(timer);
      else schedule();
    });
    show(0);
  }

  /* Reconocimientos: en táctil queda a color el último premio tocado */
  document.querySelectorAll('.awardsRow').forEach(function (row) {
    var awards = row.querySelectorAll('.award');
    awards.forEach(function (award) {
      award.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse') return;
        awards.forEach(function (other) { other.classList.toggle('is-active', other === award); });
      }, { passive: true });
    });
  });

  /* Carrusel de obras */
  document.querySelectorAll('.carousel').forEach(function (car) {
    var track = car.querySelector('.track');
    var bar = car.querySelector('.progress i');
    var auto = null;
    function step() {
      var card = track.querySelector('.cardObra');
      return card ? card.getBoundingClientRect().width + 10 : 300;
    }
    function max() { return track.scrollWidth - track.clientWidth; }
    function go(dir) {
      var next = track.scrollLeft + dir * step();
      if (dir > 0 && track.scrollLeft >= max() - 4) next = 0;
      if (dir < 0 && track.scrollLeft <= 4) next = max();
      track.scrollTo({ left: next, behavior: reduced ? 'auto' : 'smooth' });
    }
    function progress() {
      var m = max();
      bar.style.left = (m > 0 ? (track.scrollLeft / m) * 80 : 0) + '%';
    }
    function start() {
      stop();
      if (!reduced) auto = setInterval(function () { go(1); }, 4500);
    }
    function stop() { clearInterval(auto); }
    car.querySelector('.prev').addEventListener('click', function () { go(-1); start(); });
    car.querySelector('.next').addEventListener('click', function () { go(1); start(); });
    track.addEventListener('scroll', progress, { passive: true });
    car.addEventListener('mouseenter', stop);
    car.addEventListener('mouseleave', start);
    car.addEventListener('touchstart', stop, { passive: true });
    car.addEventListener('focusin', stop);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) start();
        else stop();
      }, { threshold: 0.3 }).observe(car);
    }
    progress();
  });

  /* Aparición suave al hacer scroll */
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  /* WhatsApp flotante: se oculta mientras taparía un enlace o botón del contenido
     (CTAs del hero, botones de las tarjetas…) o el footer, que ya trae el WhatsApp grande.
     El observador vigila solo el recuadro del botón (más 8 px de margen) en la esquina. */
  var fab = document.querySelector('.wspFloat');
  if (fab && 'IntersectionObserver' in window) {
    var guards = [].slice.call(document.querySelectorAll('main a, main button, footer')).filter(function (el) { return el !== fab; });
    var hits = [];
    var io = null;
    var resizeTimer = null;
    /* rootMargin negativo que reduce el viewport al recuadro del botón en reposo
       (right/bottom calculados no dependen del transform de .is-hidden). */
    function zone() {
      var cs = getComputedStyle(fab);
      var pad = 8;
      var right = Math.max(0, parseFloat(cs.right) - pad);
      var bottom = Math.max(0, parseFloat(cs.bottom) - pad);
      var top = Math.max(0, window.innerHeight - bottom - fab.offsetHeight - 2 * pad);
      var left = Math.max(0, doc.clientWidth - right - fab.offsetWidth - 2 * pad);
      return -top + 'px ' + -right + 'px ' + -bottom + 'px ' + -left + 'px';
    }
    function watch() {
      if (io) io.disconnect();
      hits = guards.map(function () { return false; });
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { hits[guards.indexOf(e.target)] = e.isIntersecting; });
        fab.classList.toggle('is-hidden', hits.indexOf(true) !== -1);
      }, { rootMargin: zone() });
      guards.forEach(function (el) { io.observe(el); });
    }
    fab.classList.add('is-hidden');
    watch();
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(watch, 150);
    });
  }
})();
