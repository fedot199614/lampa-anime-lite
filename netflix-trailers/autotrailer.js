(function () {
  'use strict';
  if (window.__lampaNetflixTrailers) return;
  window.__lampaNetflixTrailers = true;

  var PREFIX = 'nt_autotrailer_';
  var timer = null, requestToken = 0, currentCard = null, currentId = '', activeFrame = null;
  var cached = {};
  var observer = null, poll = null;
  var settings = { enabled: true, delay: 2500, muted: true };

  function readSetting(name, fallback) {
    try {
      var value = Lampa.Storage.get(PREFIX + name, fallback);
      return value === undefined || value === null ? fallback : value;
    } catch (e) { return fallback; }
  }
  function loadSettings() {
    settings.enabled = readSetting('enabled', true) !== false;
    settings.delay = Number(readSetting('delay', '2500')) || 2500;
    settings.muted = readSetting('muted', true) !== false;
  }
  function isHome() {
    try {
      var a = Lampa.Activity.active();
      if (!a) return false;
      return ['main', 'home', 'category', 'catalog'].indexOf(a.component || a.activity || '') !== -1 ||
        (document.querySelector('.main') && !document.querySelector('.full-start'));
    } catch (e) { return false; }
  }
  function getFocusedCard() {
    var el = document.querySelector('.card.selector.focus, .card.focus, .items-card.selector.focus, .items-card.focus');
    if (!el) return null;
    // Never play while settings, dialogs, search or other overlays are in front.
    if (document.querySelector('.modal.focus, .settings.focus, .player--active')) return null;
    return el;
  }
  function getMovie(el) {
    var $el = window.$ ? window.$(el) : null;
    var raw = $el && ($el.data('card') || $el.data('movie') || $el.data('item') || $el.data('data'));
    if (!raw && $el && $el.data('object')) raw = $el.data('object');
    if (!raw && el.card) raw = el.card;
    if (!raw || typeof raw !== 'object') return null;
    var id = raw.tmdb_id || (raw.source === 'tmdb' ? raw.id : null) || raw.id;
    if (!id || !/^\d+$/.test(String(id))) return null;
    var type = raw.media_type || raw.type || raw.method || (raw.first_air_date ? 'tv' : 'movie');
    type = /tv|serial|series/i.test(String(type)) ? 'tv' : 'movie';
    return { id: String(id), type: type };
  }
  function ensureLayer() {
    var layer = document.getElementById('nt-trailer-layer');
    if (layer) return layer;
    layer = document.createElement('div');
    layer.id = 'nt-trailer-layer';
    layer.setAttribute('aria-hidden', 'true');
    layer.style.cssText = 'display:none;position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:0;background:transparent;';
    // Place below the content, not inside the focus navigation tree.
    document.body.insertBefore(layer, document.body.firstChild);
    return layer;
  }
  function stopVideo() {
    var layer = document.getElementById('nt-trailer-layer');
    if (layer) { layer.style.display = 'none'; layer.innerHTML = ''; }
    activeFrame = null;
    document.documentElement.classList.remove('nt-trailer-active');
  }
  function cancel() {
    if (timer) clearTimeout(timer);
    timer = null;
    requestToken++;
    stopVideo();
  }
  function pickTrailer(data) {
    var list = data && data.results || data && data.videos && data.videos.results || [];
    return list.filter(function (v) { return v && v.site === 'YouTube' && v.key && /Trailer|Teaser/i.test(v.type || ''); })
      .sort(function (a, b) {
        return (Number(!!b.official) - Number(!!a.official)) ||
          (Number(b.iso_639_1 === 'ru') - Number(a.iso_639_1 === 'ru')) ||
          (Number(b.iso_639_1 === 'en') - Number(a.iso_639_1 === 'en'));
      })[0] || null;
  }
  function fetchTrailer(movie, callback) {
    var key = movie.type + ':' + movie.id;
    if (Object.prototype.hasOwnProperty.call(cached, key)) return callback(cached[key]);
    try {
      var tmdb = Lampa.Api && Lampa.Api.sources && Lampa.Api.sources.tmdb;
      if (!tmdb || typeof tmdb.get !== 'function') return callback(null);
      tmdb.get(movie.type + '/' + movie.id + '/videos', {}, function (json) {
        var trailer = pickTrailer(json);
        cached[key] = trailer ? trailer.key : null;
        callback(cached[key]);
      }, function () { callback(null); });
    } catch (e) { callback(null); }
  }
  function play(key, token) {
    if (token !== requestToken || !settings.enabled || !isHome() || !getFocusedCard()) return;
    if (!/^[a-zA-Z0-9_-]{6,20}$/.test(key)) return;
    var layer = ensureLayer();
    layer.innerHTML = '';
    var iframe = document.createElement('iframe');
    iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
    iframe.setAttribute('tabindex', '-1');
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    iframe.style.cssText = 'width:100%;height:100%;border:0;pointer-events:none;';
    // YouTube embedded playback may be restricted by TV WebView, autoplay policy or region.
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(key) +
      '?autoplay=1&controls=0&playsinline=1&rel=0&modestbranding=1&mute=' + (settings.muted ? '1' : '0');
    layer.appendChild(iframe);
    layer.style.display = 'block';
    activeFrame = iframe;
    document.documentElement.classList.add('nt-trailer-active');
  }
  function scan() {
    if (!settings.enabled || !isHome()) {
      if (currentCard) { currentCard = null; currentId = ''; cancel(); }
      return;
    }
    var el = getFocusedCard();
    if (el === currentCard) return;
    currentCard = el;
    currentId = '';
    cancel();
    if (!el) return;
    var movie = getMovie(el);
    if (!movie) return;
    currentId = movie.type + ':' + movie.id;
    var token = requestToken;
    timer = setTimeout(function () {
      timer = null;
      if (token !== requestToken || currentCard !== getFocusedCard()) return;
      fetchTrailer(movie, function (key) {
        if (key && token === requestToken && currentCard === getFocusedCard()) play(key, token);
      });
    }, settings.delay);
  }
  function addSettings() {
    if (!Lampa.SettingsApi) return;
    try {
      Lampa.SettingsApi.addComponent({
        component: 'netflix_trailers',
        name: 'Автотрейлеры',
        icon: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="m10 8 6 4-6 4z"/></svg>'
      });
      [
        { name: 'enabled', type: 'trigger', default: true, title: 'Включить автотрейлеры', desc: 'Запуск на главной при остановке на постере' },
        { name: 'delay', type: 'select', default: '2500', values: { '1500': '1.5 сек', '2500': '2.5 сек', '4000': '4 сек', '6000': '6 сек' }, title: 'Задержка', desc: 'До запуска трейлера' },
        { name: 'muted', type: 'trigger', default: true, title: 'Без звука', desc: 'Для совместимости с автозапуском YouTube' }
      ].forEach(function (opt) {
        var param = { name: PREFIX + opt.name, type: opt.type, default: opt.default };
        if (opt.values) param.values = opt.values;
        Lampa.SettingsApi.addParam({
          component: 'netflix_trailers',
          param: param,
          field: { name: opt.title, description: opt.desc },
          onChange: function () { loadSettings(); currentCard = null; cancel(); scan(); }
        });
      });
    } catch (e) { console.warn('[Netflix Trailers] Settings:', e); }
  }
  function init() {
    if (init.done || !window.Lampa || !Lampa.Activity || !Lampa.Storage) return;
    init.done = true;
    loadSettings();
    addSettings();
    ensureLayer();
    // Focus can change without hover events when navigating with a TV remote.
    observer = new MutationObserver(function () { scan(); });
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'], childList: true });
    poll = setInterval(scan, 550);
    document.addEventListener('visibilitychange', function () { if (document.hidden) { currentCard = null; cancel(); } });
    scan();
    console.info('[Netflix Trailers] initialized v0.1.0');
  }
  if (window.Lampa && Lampa.Listener) {
    Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') init(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else setTimeout(init, 0);
  // Fallback for builds where the app event has already fired.
  var tries = 0, bootstrap = setInterval(function () {
    init(); if (init.done || ++tries > 30) clearInterval(bootstrap);
  }, 1000);
})();
