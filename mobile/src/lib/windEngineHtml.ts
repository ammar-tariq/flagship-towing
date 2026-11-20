/**
 * Self-contained Canvas 2D wind engine that runs inside a transparent WebView.
 *
 * Why a WebView: the app has no Skia, and react-native-maps overlays cannot be
 * animated without re-sending native geometry through React on every tick.
 * A canvas in its own WebView process gives a GPU-composited, 60fps particle
 * system with real alpha-fade trails, and it never touches the RN JS thread
 * while animating. RN only sends data (field, projection, hour) when they change.
 *
 * Protocol (RN -> engine via `window.__wind.onMessage`):
 *   init        {tier, stops, colors, washAlpha}
 *   field       {hours, rows, cols, minLat, minLon, dLat, dLon, u:[], v:[]}
 *   projection  {w, h, lon0, lat0, lon1, lat1, zoom}
 *   hour        {pos, ms, ease}
 *   interact    {active}
 *   visibility  {paused}
 * Engine -> RN via `window.ReactNativeWebView.postMessage`:
 *   ready | projected | rendered
 */

const ENGINE_JS = String.raw`
(function () {
  'use strict';

  var RN = window.ReactNativeWebView;
  function post(type, extra) {
    if (!RN) { return; }
    var msg = extra || {};
    msg.type = type;
    RN.postMessage(JSON.stringify(msg));
  }

  var washCanvas = document.getElementById('wash');
  var trailCanvas = document.getElementById('trail');
  var washCtx = washCanvas.getContext('2d');
  var trailCtx = trailCanvas.getContext('2d');
  var gridCanvas = document.createElement('canvas');
  var gridCtx = gridCanvas.getContext('2d');
  var copyCanvas = document.createElement('canvas');
  var copyCtx = copyCanvas.getContext('2d');

  var TIERS = {
    high:   { cell: 6,  dprCap: 2,   area: 200, minCount: 420 },
    medium: { cell: 8,  dprCap: 1.5, area: 300, minCount: 320 },
    low:    { cell: 10, dprCap: 1,   area: 460, minCount: 240 }
  };
  var TRAIL_KEEP = 0.88;      // alpha kept per 60fps frame
  var LIFE_MIN = 2.4;         // seconds
  var LIFE_MAX = 6.2;
  var DROP_PER_MPH = 0.0032;  // extra respawn chance per second per mph
  var BUCKET_MPH = [6, 16];   // slow / medium / fast
  // Cool faint streaks for light air, brighter white for stronger flow.
  var BUCKET_STROKE = [
    'rgba(186,214,236,0.38)',
    'rgba(228,238,248,0.62)',
    'rgba(255,255,255,0.88)'
  ];
  var BUCKET_WIDTH = [0.95, 1.15, 1.35];
  var PI = Math.PI;

  var S = {
    tier: TIERS.high,
    dpr: 1,
    w: 0, h: 0,
    stops: [], rgb: [], lut: null, washAlpha: 0.44,
    field: null,
    proj: null,
    grid: null,
    hourPos: 0, hourFrom: 0, hourTo: 0, hourStart: 0, hourDur: 0, hourEase: 'linear',
    speedK: 3,
    count: 0, px: null, py: null, age: null, life: null, fresh: null,
    paused: false, interacting: false, running: false,
    lastTs: 0, emaDt: 0.0167, frames: 0,
    rendered: false, dirtyGrid: true
  };

  // ---------- projection ----------
  function mercY(lat) { return Math.log(Math.tan(PI / 4 + (lat * PI) / 360)); }
  function invMercLat(m) { return ((2 * Math.atan(Math.exp(m)) - PI / 2) * 180) / PI; }

  function makeProj(p) {
    var m0 = mercY(p.lat0), m1 = mercY(p.lat1);
    return {
      w: p.w, h: p.h, lon0: p.lon0, dLon: p.lon1 - p.lon0, m0: m0, dM: m1 - m0, zoom: p.zoom
    };
  }

  // ---------- colors ----------
  function hexToRgb(hex) {
    var v = parseInt(hex.slice(1), 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }
  function buildLut() {
    var n = 201; // 0..100 mph in 0.5 steps
    var lut = new Uint8ClampedArray(n * 3);
    var stops = S.stops, rgb = S.rgb, last = stops.length - 1;
    for (var i = 0; i < n; i++) {
      var speed = i * 0.5;
      var idx = 0;
      if (speed > stops[0]) {
        while (idx < last - 1 && speed > stops[idx + 1]) { idx++; }
      }
      var span = (stops[idx + 1] - stops[idx]) || 1;
      var t = Math.min(1, Math.max(0, (speed - stops[idx]) / span));
      var a = rgb[idx], b = rgb[Math.min(idx + 1, last)];
      lut[i * 3] = a[0] + (b[0] - a[0]) * t;
      lut[i * 3 + 1] = a[1] + (b[1] - a[1]) * t;
      lut[i * 3 + 2] = a[2] + (b[2] - a[2]) * t;
    }
    S.lut = lut;
  }

  // ---------- field sampling ----------
  var out = { u: 0, v: 0, cover: 0 };
  function sampleField(lat, lon, h0, h1, f) {
    var F = S.field;
    var fr = (lat - F.minLat) / F.dLat;
    var fc = (lon - F.minLon) / F.dLon;
    var rows = F.rows, cols = F.cols;
    if (fr < 0 || fc < 0 || fr > rows - 1 || fc > cols - 1) { out.cover = 0; return; }
    var r0 = Math.min(rows - 2, Math.floor(fr));
    var c0 = Math.min(cols - 2, Math.floor(fc));
    var tr = fr - r0, tc = fc - c0;
    var base0 = h0 * rows * cols, base1 = h1 * rows * cols;
    var i00 = r0 * cols + c0, i01 = i00 + 1, i10 = i00 + cols, i11 = i10 + 1;
    var U = F.u, V = F.v;
    var w00 = (1 - tr) * (1 - tc), w01 = (1 - tr) * tc, w10 = tr * (1 - tc), w11 = tr * tc;
    var ua = U[base0 + i00] * w00 + U[base0 + i01] * w01 + U[base0 + i10] * w10 + U[base0 + i11] * w11;
    var va = V[base0 + i00] * w00 + V[base0 + i01] * w01 + V[base0 + i10] * w10 + V[base0 + i11] * w11;
    if (ua !== ua || va !== va) { out.cover = 0; return; }
    if (f > 0.001 && h1 !== h0) {
      var ub = U[base1 + i00] * w00 + U[base1 + i01] * w01 + U[base1 + i10] * w10 + U[base1 + i11] * w11;
      var vb = V[base1 + i00] * w00 + V[base1 + i01] * w01 + V[base1 + i10] * w10 + V[base1 + i11] * w11;
      if (ub === ub && vb === vb) {
        ua += (ub - ua) * f;
        va += (vb - va) * f;
      }
    }
    var edge = Math.min(fr, fc, rows - 1 - fr, cols - 1 - fc);
    out.u = ua; out.v = va;
    out.cover = edge >= 0.6 ? 1 : edge / 0.6;
  }

  // ---------- screen grid + wash ----------
  function allocGrid() {
    var cell = S.tier.cell;
    var cols = Math.floor(S.w / cell) + 2;
    var rows = Math.floor(S.h / cell) + 2;
    S.grid = {
      cell: cell, cols: cols, rows: rows,
      u: new Float32Array(cols * rows),
      v: new Float32Array(cols * rows),
      c: new Float32Array(cols * rows),
      img: gridCtx.createImageData(cols, rows)
    };
    gridCanvas.width = cols;
    gridCanvas.height = rows;
  }

  function rebuildGrid() {
    var G = S.grid, P = S.proj, F = S.field;
    if (!G || !P || !F) { return; }
    var hours = F.hours;
    var pos = Math.min(Math.max(S.hourPos, 0), hours - 1);
    var h0 = Math.floor(pos);
    var h1 = Math.min(h0 + 1, hours - 1);
    var f = pos - h0;
    var data = G.img.data, lut = S.lut, alpha = S.washAlpha * 255;
    var cell = G.cell, cols = G.cols, rows = G.rows;
    var any = false;
    for (var r = 0; r < rows; r++) {
      var sy = r * cell;
      var lat = invMercLat(P.m0 + (sy / P.h) * P.dM);
      for (var c = 0; c < cols; c++) {
        var i = r * cols + c;
        var lon = P.lon0 + ((c * cell) / P.w) * P.dLon;
        sampleField(lat, lon, h0, h1, f);
        var cover = out.cover;
        G.c[i] = cover;
        var o = i * 4;
        if (cover <= 0) {
          G.u[i] = 0; G.v[i] = 0;
          data[o + 3] = 0;
          continue;
        }
        any = true;
        G.u[i] = out.u; G.v[i] = out.v;
        var speed = Math.sqrt(out.u * out.u + out.v * out.v);
        var li = Math.min(200, Math.round(speed * 2)) * 3;
        data[o] = lut[li]; data[o + 1] = lut[li + 1]; data[o + 2] = lut[li + 2];
        data[o + 3] = alpha * cover;
      }
    }
    gridCtx.putImageData(G.img, 0, 0);
    washCtx.setTransform(1, 0, 0, 1, 0, 0);
    washCtx.clearRect(0, 0, washCanvas.width, washCanvas.height);
    washCtx.imageSmoothingEnabled = true;
    washCtx.imageSmoothingQuality = 'high';
    var half = cell * S.dpr * 0.5;
    washCtx.drawImage(gridCanvas, -half, -half, cols * cell * S.dpr, rows * cell * S.dpr);
    S.dirtyGrid = false;
    if (any && !S.rendered) {
      S.rendered = true;
      washCanvas.style.transition = 'opacity 420ms ease-out';
      washCanvas.style.opacity = overlayVisible ? '1' : '0';
      post('rendered');
    }
  }

  var gs = { u: 0, v: 0, c: 0 };
  function sampleGrid(x, y) {
    var G = S.grid;
    var gx = x / G.cell, gy = y / G.cell;
    var c0 = Math.min(G.cols - 2, Math.max(0, Math.floor(gx)));
    var r0 = Math.min(G.rows - 2, Math.max(0, Math.floor(gy)));
    var tx = Math.min(1, Math.max(0, gx - c0)), ty = Math.min(1, Math.max(0, gy - r0));
    var i00 = r0 * G.cols + c0, i01 = i00 + 1, i10 = i00 + G.cols, i11 = i10 + 1;
    var w00 = (1 - tx) * (1 - ty), w01 = tx * (1 - ty), w10 = (1 - tx) * ty, w11 = tx * ty;
    gs.u = G.u[i00] * w00 + G.u[i01] * w01 + G.u[i10] * w10 + G.u[i11] * w11;
    gs.v = G.v[i00] * w00 + G.v[i01] * w01 + G.v[i10] * w10 + G.v[i11] * w11;
    gs.c = G.c[i00] * w00 + G.c[i01] * w01 + G.c[i10] * w10 + G.c[i11] * w11;
  }

  // ---------- particles ----------
  function allocParticles() {
    var target = Math.round((S.w * S.h) / S.tier.area);
    var count = Math.max(S.tier.minCount, Math.min(2400, target));
    S.count = count;
    S.px = new Float32Array(count);
    S.py = new Float32Array(count);
    S.age = new Float32Array(count);
    S.life = new Float32Array(count);
    S.fresh = new Uint8Array(count);
    for (var i = 0; i < count; i++) {
      spawn(i);
      S.age[i] = Math.random() * S.life[i]; // stagger so nothing resets in sync
    }
  }

  function spawn(i) {
    S.px[i] = Math.random() * S.w;
    S.py[i] = Math.random() * S.h;
    S.age[i] = 0;
    S.life[i] = LIFE_MIN + Math.random() * (LIFE_MAX - LIFE_MIN);
    S.fresh[i] = 1;
  }

  function speedFactorFor(zoom) {
    var k = 3.2 * Math.pow(2, (zoom - 6) * 0.55);
    return Math.min(8, Math.max(1.4, k));
  }

  function stepParticles(dt) {
    var ctx = trailCtx, dpr = S.dpr, w = S.w, h = S.h, k = S.speedK;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = 'rgba(0,0,0,' + Math.pow(TRAIL_KEEP, dt * 60).toFixed(4) + ')';
    ctx.fillRect(0, 0, trailCanvas.width, trailCanvas.height);
    ctx.globalCompositeOperation = 'source-over';

    var paths = [new Path2D(), new Path2D(), new Path2D()];
    var px = S.px, py = S.py, age = S.age, life = S.life, fresh = S.fresh;
    for (var i = 0; i < S.count; i++) {
      var x = px[i], y = py[i];
      sampleGrid(x, y);
      if (gs.c < 0.08) { spawn(i); continue; }
      var u = gs.u, v = gs.v;
      var s = Math.sqrt(u * u + v * v);
      var nx = x + u * k * dt;
      var ny = y - v * k * dt;
      age[i] += dt;
      if (age[i] > life[i] || nx < 0 || nx > w || ny < 0 || ny > h) { spawn(i); continue; }
      if (s > 3 && Math.random() < dt * s * DROP_PER_MPH) { spawn(i); continue; }
      if (fresh[i]) { fresh[i] = 0; px[i] = nx; py[i] = ny; continue; }
      var b = s < BUCKET_MPH[0] ? 0 : s < BUCKET_MPH[1] ? 1 : 2;
      paths[b].moveTo(x * dpr, y * dpr);
      paths[b].lineTo(nx * dpr, ny * dpr);
      px[i] = nx; py[i] = ny;
    }
    ctx.lineCap = 'round';
    var baseW = dpr >= 2 ? 1.05 : 1.2;
    for (var bi = 0; bi < 3; bi++) {
      ctx.lineWidth = baseW * BUCKET_WIDTH[bi] * dpr;
      ctx.strokeStyle = BUCKET_STROKE[bi];
      ctx.stroke(paths[bi]);
    }
  }

  // Keep particles and trails at the same world position when the map settles
  // on a new camera. Both projections are axis-aligned Mercator, so old->new
  // screen space is a pure scale + translate per axis.
  function remap(oldP, newP) {
    var sx = (oldP.dLon / newP.dLon) * (newP.w / oldP.w);
    var ox = ((oldP.lon0 - newP.lon0) / newP.dLon) * newP.w;
    var sy = (oldP.dM / newP.dM) * (newP.h / oldP.h);
    var oy = ((oldP.m0 - newP.m0) / newP.dM) * newP.h;
    var px = S.px, py = S.py;
    for (var i = 0; i < S.count; i++) {
      var nx = px[i] * sx + ox, ny = py[i] * sy + oy;
      if (nx < 0 || nx > S.w || ny < 0 || ny > S.h) { spawn(i); continue; }
      px[i] = nx; py[i] = ny;
    }
    copyCanvas.width = trailCanvas.width;
    copyCanvas.height = trailCanvas.height;
    copyCtx.clearRect(0, 0, copyCanvas.width, copyCanvas.height);
    copyCtx.drawImage(trailCanvas, 0, 0);
    trailCtx.setTransform(1, 0, 0, 1, 0, 0);
    trailCtx.globalCompositeOperation = 'source-over';
    trailCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
    trailCtx.setTransform(sx, 0, 0, sy, ox * S.dpr, oy * S.dpr);
    trailCtx.drawImage(copyCanvas, 0, 0);
    trailCtx.setTransform(1, 0, 0, 1, 0, 0);
  }

  // ---------- sizing ----------
  function resize(w, h) {
    if (w === S.w && h === S.h && S.px) { return; }
    S.w = w; S.h = h;
    var dpr = Math.min(window.devicePixelRatio || 1, S.tier.dprCap);
    S.dpr = dpr;
    [washCanvas, trailCanvas].forEach(function (cv) {
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cv.style.width = w + 'px';
      cv.style.height = h + 'px';
    });
    allocGrid();
    allocParticles();
    S.dirtyGrid = true;
  }

  // ---------- hour tween ----------
  function easeOut(t) { return 1 - (1 - t) * (1 - t); }
  function advanceHour(now) {
    if (S.hourDur <= 0) { return; }
    var t = Math.min(1, (now - S.hourStart) / S.hourDur);
    var e = S.hourEase === 'out' ? easeOut(t) : t;
    S.hourPos = S.hourFrom + (S.hourTo - S.hourFrom) * e;
    S.dirtyGrid = true;
    if (t >= 1) { S.hourDur = 0; S.hourPos = S.hourTo; }
  }

  // ---------- loop ----------
  function frame(ts) {
    if (!S.running) { return; }
    requestAnimationFrame(frame);
    var dt = S.lastTs ? (ts - S.lastTs) / 1000 : 0.0167;
    S.lastTs = ts;
    if (dt > 0.05) { dt = 0.05; }
    if (!S.field || !S.proj) { return; }

    advanceHour(ts);
    if (S.dirtyGrid) { rebuildGrid(); }
    if (S.interacting) { return; }

    stepParticles(dt);

    // Self-adapt: if we cannot hold ~40fps, shed particles (never re-add).
    S.emaDt += (dt - S.emaDt) * 0.05;
    if (++S.frames % 120 === 0 && S.emaDt > 0.024 && S.count > S.tier.minCount) {
      S.count = Math.max(S.tier.minCount, Math.floor(S.count * 0.75));
    }
  }

  function setRunning(on) {
    if (on === S.running) { return; }
    S.running = on;
    if (on) { S.lastTs = 0; requestAnimationFrame(frame); }
  }

  var overlayVisible = true;
  function setOverlayVisible(visible) {
    if (visible === overlayVisible) { return; }
    overlayVisible = visible;
    // CSS transitions stay on the WebView compositor. RN must not animate
    // this layer — that races react-native-screens on pop and crashes.
    var show = visible ? '1' : '0';
    var ms = visible ? '380ms' : '140ms';
    washCanvas.style.transition = 'opacity ' + ms + ' ease-out';
    trailCanvas.style.transition = 'opacity ' + ms + ' ease-out';
    if (S.rendered) { washCanvas.style.opacity = show; }
    trailCanvas.style.opacity = show;
  }

  // ---------- messages ----------
  var handlers = {
    init: function (m) {
      S.tier = TIERS[m.tier] || TIERS.high;
      S.stops = m.stops;
      S.rgb = m.colors.map(hexToRgb);
      S.washAlpha = m.washAlpha != null ? m.washAlpha : 0.44;
      buildLut();
    },
    field: function (m) {
      var n = m.u.length;
      var u = new Float32Array(n), v = new Float32Array(n);
      for (var i = 0; i < n; i++) {
        u[i] = m.u[i] == null ? NaN : m.u[i];
        v[i] = m.v[i] == null ? NaN : m.v[i];
      }
      S.field = { hours: m.hours, rows: m.rows, cols: m.cols, minLat: m.minLat, minLon: m.minLon, dLat: m.dLat, dLon: m.dLon, u: u, v: v };
      S.dirtyGrid = true;
    },
    projection: function (m) {
      resize(m.w, m.h);
      var next = makeProj(m);
      if (S.proj && S.px) { remap(S.proj, next); }
      S.proj = next;
      S.speedK = speedFactorFor(m.zoom);
      S.dirtyGrid = true;
      if (S.field) { rebuildGrid(); }
      if (!S.interacting) { setOverlayVisible(true); }
      post('projected');
    },
    hour: function (m) {
      var target = m.pos;
      if (!S.field) { S.hourPos = target; S.hourDur = 0; return; }
      var ms = m.ms || 0;
      if (ms <= 0 || Math.abs(target - S.hourPos) > 1.5) {
        S.hourPos = target; S.hourDur = 0; S.dirtyGrid = true; return;
      }
      S.hourFrom = S.hourPos; S.hourTo = target;
      S.hourStart = performance.now(); S.hourDur = ms;
      S.hourEase = m.ease === 'out' ? 'out' : 'linear';
    },
    interact: function (m) {
      S.interacting = !!m.active;
      if (!S.interacting) { S.lastTs = 0; }
      // Overlay cannot follow the map mid-gesture without lagging it, so
      // wash + trails fade in the WebView and return after remap.
      setOverlayVisible(!S.interacting);
    },
    visibility: function (m) {
      S.paused = !!m.paused;
      setRunning(!S.paused);
    }
  };

  window.__wind = {
    onMessage: function (m) {
      try {
        var fn = handlers[m && m.type];
        if (fn) { fn(m); }
      } catch (e) {
        post('error', { message: String(e && e.message || e) });
      }
    }
  };

  document.addEventListener('visibilitychange', function () {
    setRunning(!S.paused && document.visibilityState === 'visible');
  });

  setRunning(true);
  post('ready');
})();
`;

export const buildWindEngineHtml = () => `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>
  html, body { margin: 0; padding: 0; background: transparent; overflow: hidden; width: 100%; height: 100%; }
  canvas { position: absolute; left: 0; top: 0; display: block; pointer-events: none; touch-action: none; }
  #wash { opacity: 0; }
</style>
</head>
<body>
<canvas id="wash"></canvas>
<canvas id="trail"></canvas>
<script>${ENGINE_JS}</script>
</body>
</html>`;
