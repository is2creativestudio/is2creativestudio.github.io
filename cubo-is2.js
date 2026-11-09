/* Is² — cubo de cristal con químico rojo burbujeante.
   Animación a 12 fps estilo cartoon de los años 20, loop de 10 s.
   Canvas 2D con proyección 3D propia (sin librerías). */
(function () {
  const media = document.querySelector('.hero-media');
  if (!media) return;
  const logoImg = media.querySelector('.hero-logo');
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cv = document.createElement('canvas');
  cv.className = 'hero-cubo';
  cv.setAttribute('aria-hidden', 'true');
  media.appendChild(cv);
  const ctx = cv.getContext('2d');

  const logo = new Image();
  logo.src = (logoImg && logoImg.getAttribute('src')) || 'logo-is2.png';

  const FPS = 12, LOOP = 10;
  const ROJO = '#EC1E24', ROJO_OSC = '#A3121A', ROJO_CLARO = '#FF5A5F', BORDE = '#4A070B';
  const D = 6;                         // distancia de cámara
  let W = 0, H = 0, DPR = 1, L = 200, K = 1;

  function resize() {
    const r = media.getBoundingClientRect();
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    L = Math.min(W * 0.32, 250);
    K = (L / 2) * (D - 1) / D;         // cara frontal = tamaño del logo
  }
  window.addEventListener('resize', resize);
  resize();

  /* ---------- utilidades ---------- */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const prog = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  let yaw = 0, pitch = 0, jx = 0, jy = 0;

  function rot([x, y, z]) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    let X = x * cy + z * sy, Z = -x * sy + z * cy, Y = y;
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    return [X, Y * cp - Z * sp, Y * sp + Z * cp];
  }
  function proj([x, y, z]) {
    const s = K * D / (D - z);
    return [W / 2 + jx + x * s, H / 2 + jy - y * s, s];
  }
  const P = v => proj(rot(v));

  function face(pts3) {               // devuelve puntos 2D y si mira a cámara
    const r = pts3.map(rot);
    const c = r.reduce((a, p) => [a[0] + p[0] / r.length, a[1] + p[1] / r.length, a[2] + p[2] / r.length], [0, 0, 0]);
    const u = [r[1][0] - r[0][0], r[1][1] - r[0][1], r[1][2] - r[0][2]];
    const v = [r[2][0] - r[0][0], r[2][1] - r[0][1], r[2][2] - r[0][2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const toCam = [-c[0], -c[1], D - c[2]];
    const front = n[0] * toCam[0] + n[1] * toCam[1] + n[2] * toCam[2] > 0;
    return { p: r.map(proj), front, n };
  }
  function poly(p) { ctx.beginPath(); p.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); }

  // caras de una caja (orden antihorario visto desde fuera)
  function boxFaces(x0, x1, y0, y1, z0, z1, topY) {
    const t = topY || [y1, y1, y1, y1];   // alturas de la superficie en 4 esquinas
    return {
      front: [[x0, y0, z1], [x1, y0, z1], [x1, t[2], z1], [x0, t[3], z1]],
      back: [[x1, y0, z0], [x0, y0, z0], [x0, t[0], z0], [x1, t[1], z0]],
      left: [[x0, y0, z0], [x0, y0, z1], [x0, t[3], z1], [x0, t[0], z0]],
      right: [[x1, y0, z1], [x1, y0, z0], [x1, t[1], z0], [x1, t[2], z1]],
      top: [[x0, t[3], z1], [x1, t[2], z1], [x1, t[1], z0], [x0, t[0], z0]],
      bottom: [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]]
    };
  }

  /* ---------- íconos vectoriales (outline blanco) ---------- */
  function rr(x, y, w, h, r) { ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  const ICONOS = [
    function camaraVideo() {          // cámara de cine con dos rollos
      ctx.beginPath(); rr(-0.85, -0.25, 1.2, 0.8, 0.12);
      ctx.moveTo(0.35, -0.05); ctx.lineTo(0.85, -0.3); ctx.lineTo(0.85, 0.6); ctx.lineTo(0.35, 0.35);
      ctx.moveTo(-0.32, -0.55); ctx.arc(-0.55, -0.55, 0.23, 0, Math.PI * 2);
      ctx.moveTo(0.21, -0.55); ctx.arc(-0.02, -0.55, 0.23, 0, Math.PI * 2);
      ctx.moveTo(-0.5, 0.15); ctx.lineTo(-0.1, 0.15);
    },
    function camaraFoto() {
      ctx.beginPath(); rr(-0.85, -0.4, 1.7, 1.1, 0.16);
      ctx.moveTo(-0.35, -0.4); ctx.lineTo(-0.22, -0.62); ctx.lineTo(0.22, -0.62); ctx.lineTo(0.35, -0.4);
      ctx.moveTo(0.38, 0.15); ctx.arc(0, 0.15, 0.38, 0, Math.PI * 2);
      ctx.moveTo(0.17, 0.15); ctx.arc(0, 0.15, 0.17, 0, Math.PI * 2);
      ctx.moveTo(0.52, -0.22); ctx.lineTo(0.68, -0.22);
    },
    function celular() {
      ctx.beginPath(); rr(-0.48, -0.9, 0.96, 1.8, 0.16);
      ctx.moveTo(-0.14, -0.74); ctx.lineTo(0.14, -0.74);
      ctx.moveTo(0.08, 0.72); ctx.arc(0, 0.72, 0.08, 0, Math.PI * 2);
      ctx.moveTo(-0.32, -0.58); ctx.lineTo(0.32, -0.58); ctx.lineTo(0.32, 0.56); ctx.lineTo(-0.32, 0.56); ctx.closePath();
    },
    function luzVideo() {              // panel LED con horquilla y tubo
      ctx.beginPath(); rr(-0.7, -0.85, 1.4, 1.0, 0.1);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
        const cx = -0.4 + i * 0.4, cy = -0.6 + j * 0.5;
        ctx.moveTo(cx + 0.12, cy); ctx.arc(cx, cy, 0.12, 0, Math.PI * 2);
      }
      ctx.moveTo(-0.82, -0.35); ctx.lineTo(-0.82, 0.3); ctx.lineTo(0.82, 0.3); ctx.lineTo(0.82, -0.35);
      ctx.moveTo(0, 0.3); ctx.lineTo(0, 0.95);
      ctx.moveTo(-0.35, 0.95); ctx.lineTo(0.35, 0.95);
    }
  ];
  function dibujaIcono(i, x, y, s, ang, alpha) {
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ICONOS[i]();
    ctx.strokeStyle = BORDE; ctx.lineWidth = 0.2; ctx.stroke();      // contorno oscuro
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.1; ctx.stroke();      // línea blanca
    ctx.restore();
  }

  /* ---------- burbujas ---------- */
  let burbujas = [];
  function nuevaBurbuja(x, y, z, big) {
    burbujas.push({ x, y, z, r: big ? 0.05 + Math.random() * 0.07 : 0.025 + Math.random() * 0.04, v: 0.4 + Math.random() * 0.6, ph: Math.random() * 6 });
  }

  /* ---------- grano de película ---------- */
  const grano = document.createElement('canvas'); grano.width = grano.height = 160;
  (function () { const g = grano.getContext('2d'), d = g.createImageData(160, 160);
    for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    g.putImageData(d, 0, 0); })();

  /* ---------- línea de tiempo ---------- */
  const TURNOS = [0, 1, 2, 3].map(i => 0.9 + i * 1.6);   // inicio de cada giro de 90°
  function estado(t) {
    let giro = 0;
    TURNOS.forEach((s, i) => { giro = Math.max(giro, i + ease(prog(t, s, s + 0.9))); });
    const tilt = ease(prog(t, 0.45, 1.0)) * (1 - ease(prog(t, 7.0, 7.75)));
    const nivel = 1 - 0.3 * ease(prog(t, 0.3, 1.0)) + 0.3 * ease(prog(t, 7.25, 8.0));
    const logoA = (t < 0.3 ? 1 : 1 - prog(t, 0.3, 0.65)) + prog(t, 8.05, 8.5);
    return { yaw: giro * Math.PI / 2, pitch: tilt * 0.36, nivel, logoA: clamp(logoA, 0, 1), tilt };
  }

  let ultimoFrame = -1, ultimoT = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const f = Math.floor(now / 1000 * FPS);
    if (f === ultimoFrame) return;                // 12 fps escalonado
    ultimoFrame = f;
    const t = (f / FPS) % LOOP, dt = t >= ultimoT ? t - ultimoT : 1 / FPS; ultimoT = t;
    dibujar(t, dt);
  }

  function dibujar(t, dt) {
    const e = estado(t);
    yaw = e.yaw; pitch = e.pitch;
    // temblor de cámara estilo película vieja (solo mientras gira)
    const temb = e.tilt;
    jx = (Math.random() - .5) * 2.4 * temb; jy = (Math.random() - .5) * 2.4 * temb;

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const m = 0.93, lvl = -m + 2 * m * e.nivel;
    // oleaje de la superficie (más fuerte justo después de cada chapuzón)
    let ola = 0.03;
    TURNOS.forEach(s => { const k = prog(t, s + 0.85, s + 1.6); if (k > 0 && k < 1) ola += 0.12 * (1 - k); });
    ola *= (1 - prog(t, 7.4, 8.0));
    const w = [0, 1, 2, 3].map(i => lvl + ola * Math.sin(t * 9 + i * 1.7) - (e.nivel > 0.99 ? 0 : 0));
    const topY = w.map(v => Math.min(v, m));

    const cubo = boxFaces(-1, 1, -1, 1, -1, 1);
    const liq = boxFaces(-m, m, -m, m, -m, m, topY);

    const vidrio = 1 - e.logoA;
    // 1) caras traseras del cristal
    for (const k in cubo) { const fc = face(cubo[k]); if (!fc.front) { poly(fc.p); ctx.fillStyle = 'rgba(255,255,255,' + (0.04 * vidrio) + ')'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,' + (0.28 * vidrio) + ')'; ctx.lineWidth = 1.5; ctx.stroke(); } }

    // 2) líquido (sombreado tipo cel)
    const tonos = { front: ROJO, back: ROJO, left: ROJO_OSC, right: '#C9161D', top: ROJO_CLARO, bottom: ROJO_OSC };
    for (const k in liq) {
      const fc = face(liq[k]); if (!fc.front) continue;
      poly(fc.p); ctx.fillStyle = tonos[k];
      if (k !== 'top') { const lightness = Math.abs(fc.n[0]) > Math.abs(fc.n[2]) ? (fc.n[0] > 0 ? '#C9161D' : ROJO_OSC) : ROJO; ctx.fillStyle = lightness; }
      ctx.fill();
    }
    // brillo de la superficie
    if (e.nivel < 0.99) { const fc = face(liq.top); if (fc.front) { poly(fc.p); ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2; ctx.stroke(); } }

    // 3) burbujas
    if (Math.random() < 0.9) nuevaBurbuja((Math.random() * 2 - 1) * 0.8, -m + 0.05, (Math.random() * 2 - 1) * 0.8);
    if (Math.random() < 0.5) nuevaBurbuja((Math.random() * 2 - 1) * 0.8, -m + 0.05, (Math.random() * 2 - 1) * 0.8);
    burbujas.forEach(b => { b.y += b.v * dt; b.x += Math.sin(t * 6 + b.ph) * 0.01; });
    burbujas = burbujas.filter(b => b.y < lvl - 0.02 && burbujas.length < 260);
    burbujas.map(b => ({ b, p: P([b.x, b.y, b.z]) })).sort((a, c) => a.p[2] - c.p[2]).forEach(({ b, p }) => {
      ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(1.2, b.r * p[2]), 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.4; ctx.stroke();
    });

    // 4) objeto que cae en cada giro
    TURNOS.forEach((s, i) => {
      const a = s + 0.25, b = a + 0.75, c = b + 0.8;
      if (t < a || t > c) return;
      let y, alpha = 1, ang = Math.sin(t * 7 + i) * 0.18;
      if (t <= b) { const k = prog(t, a, b); y = 2.6 - (2.6 - lvl) * k * k; }
      else {
        const k = prog(t, b, c); y = lvl - 1.1 * k; alpha = 1 - k;
        if (Math.random() < 0.9) for (let j = 0; j < 3; j++) nuevaBurbuja((Math.random() - .5) * 0.6, y, (Math.random() - .5) * 0.6, true);
      }
      const p = P([0, y, 0]);
      dibujaIcono(i, p[0], p[1], 0.3 * L * p[2] / (K * D / (D - 0)) , ang, alpha);
    });

    // 5) caras frontales del cristal + reflejos
    for (const k in cubo) {
      const fc = face(cubo[k]); if (!fc.front) continue;
      poly(fc.p); ctx.fillStyle = 'rgba(255,255,255,' + (0.06 * vidrio) + ')'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.9 * vidrio) + ')'; ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.stroke();
      // reflejo diagonal
      const [p0, p1, p2, p3] = fc.p;
      const L0 = (u, v) => [p0[0] + (p1[0] - p0[0]) * u + (p3[0] - p0[0]) * v, p0[1] + (p1[1] - p0[1]) * u + (p3[1] - p0[1]) * v];
      const r1 = L0(0.12, 0.62), r2 = L0(0.42, 0.92);
      ctx.beginPath(); ctx.moveTo(r1[0], r1[1]); ctx.lineTo(r2[0], r2[1]);
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.35 * vidrio) + ')'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke();
    }

    // 6) revelar el logo Is²
    if (e.logoA > 0 && logo.complete) {
      const s = L, x = W / 2 - s / 2 + jx, y = H / 2 - s / 2 + jy, r = s * 0.1;
      ctx.save(); ctx.globalAlpha = e.logoA;
      ctx.beginPath(); rr(x, y, s, s, r); ctx.clip();
      ctx.drawImage(logo, x, y, s, s); ctx.restore();
    }

    // 7) parpadeo y grano de película vieja (sutil)
    ctx.globalAlpha = 0.05 + Math.random() * 0.03;
    ctx.globalCompositeOperation = 'overlay';
    const ox = Math.random() * 160, oy = Math.random() * 160;
    ctx.fillStyle = ctx.createPattern(grano, 'repeat');
    ctx.save(); ctx.translate(-ox, -oy); ctx.fillRect(ox, oy, W, H); ctx.restore();
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }

  if (logoImg) logoImg.style.visibility = 'hidden';
  requestAnimationFrame(frame);
  window.__cuboIs2 = { dibujar: (t) => dibujar(t, 1 / FPS), resize };   // para pruebas
})();
