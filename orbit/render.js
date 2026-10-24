/* Orbit: drawing.
   Everything that touches the canvas lives here. It reads a frame description
   (bodies, camera, options, aim preview) and paints it, nothing else. */

(function (global) {
  'use strict';

  const STAGE = '#082A1A';
  const CREAM = '#FAF6EA';
  const PALE = '#E4F1AF';
  const TEAL = '#5DB996';

  function rgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  /* One soft round glow per color, drawn once and then stretched to size. */
  const sprites = new Map();
  function glowSprite(color) {
    let c = sprites.get(color);
    if (c) return c;
    c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const [r, gr, b] = rgb(color);
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, `rgba(${r},${gr},${b},0.95)`);
    grad.addColorStop(0.22, `rgba(${r},${gr},${b},0.38)`);
    grad.addColorStop(0.55, `rgba(${r},${gr},${b},0.1)`);
    grad.addColorStop(1, `rgba(${r},${gr},${b},0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    sprites.set(color, c);
    return c;
  }

  /* A fixed scatter of faint stars. They shift a little with the camera so
     the stage feels deeper than a flat color. */
  const stars = [];
  for (let i = 0; i < 90; i++) {
    stars.push({
      u: Math.random(),
      v: Math.random(),
      s: 0.5 + Math.random() * 1.1,
      p: Math.random() * 6.28,
      depth: 0.02 + Math.random() * 0.06
    });
  }

  function create(canvas) {
    const ctx = canvas.getContext('2d');
    let w = 0;
    let h = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(f) {
      const cam = f.cam;
      const z = cam.zoom;
      const sx = x => (x - cam.x) * z + w / 2;
      const sy = y => (y - cam.y) * z + h / 2;

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.fillStyle = STAGE;
      ctx.fillRect(0, 0, w, h);

      drawStars(f.time);
      if (f.opts.grid) drawGrid();

      ctx.globalCompositeOperation = 'lighter';
      if (f.opts.trails) drawTrails();
      if (f.aim && f.aim.path) drawPath();
      drawBodies();
      drawEffects();

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      if (f.opts.vectors) drawVectors();
      if (f.aim) drawAim();

      /* ---- pieces ---- */

      function drawStars(t) {
        ctx.fillStyle = PALE;
        for (const s of stars) {
          const px = (((s.u * w - cam.x * s.depth) % w) + w) % w;
          const py = (((s.v * h - cam.y * s.depth) % h) + h) % h;
          ctx.globalAlpha = 0.18 + 0.22 * (0.5 + 0.5 * Math.sin(t * 0.8 + s.p));
          ctx.fillRect(px, py, s.s, s.s);
        }
        ctx.globalAlpha = 1;
      }

      function drawGrid() {
        let step = 50;
        while (step * z < 38) step *= 2;
        while (step * z > 120) step /= 2;
        const left = cam.x - w / 2 / z;
        const right = cam.x + w / 2 / z;
        const top = cam.y - h / 2 / z;
        const bottom = cam.y + h / 2 / z;
        ctx.strokeStyle = TEAL;
        ctx.globalAlpha = 0.09;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = Math.floor(left / step) * step; x <= right; x += step) {
          const px = Math.round(sx(x)) + 0.5;
          ctx.moveTo(px, 0);
          ctx.lineTo(px, h);
        }
        for (let y = Math.floor(top / step) * step; y <= bottom; y += step) {
          const py = Math.round(sy(y)) + 0.5;
          ctx.moveTo(0, py);
          ctx.lineTo(w, py);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      function drawTrails() {
        const BANDS = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (const b of f.world.bodies) {
          const t = b.trail;
          const n = t.length / 2;
          if (n < 3) continue;
          ctx.strokeStyle = b.color;
          const base = Math.max(1, Math.min(b.r * z * 0.4, 6));
          for (let k = 0; k < BANDS; k++) {
            const from = Math.floor((n * k) / BANDS);
            const to = Math.min(n - 1, Math.floor((n * (k + 1)) / BANDS) + 1);
            if (to - from < 1) continue;
            const grow = (k + 1) / BANDS;
            ctx.beginPath();
            ctx.moveTo(sx(t[from * 2]), sy(t[from * 2 + 1]));
            for (let i = from + 1; i <= to; i++) ctx.lineTo(sx(t[i * 2]), sy(t[i * 2 + 1]));
            // wide faint pass for the glow, narrow bright pass for the line
            ctx.globalAlpha = 0.12 * grow;
            ctx.lineWidth = base * (1.6 + 2.4 * grow);
            ctx.stroke();
            ctx.globalAlpha = 0.85 * grow * grow;
            ctx.lineWidth = Math.max(0.8, base * (0.35 + 0.65 * grow));
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
      }

      function drawPath() {
        const p = f.aim.path;
        const n = p.length / 2;
        if (n < 2) return;
        const CHUNK = 5;
        ctx.strokeStyle = PALE;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.setLineDash([1, 7]);
        for (let i = 0; i < n - 1; i += CHUNK) {
          const end = Math.min(n - 1, i + CHUNK);
          ctx.globalAlpha = 0.9 * (1 - i / n);
          ctx.beginPath();
          ctx.moveTo(sx(p[i * 2]), sy(p[i * 2 + 1]));
          for (let j = i + 1; j <= end; j++) ctx.lineTo(sx(p[j * 2]), sy(p[j * 2 + 1]));
          ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }

      function drawBodies() {
        const t = f.time;
        for (const b of f.world.bodies) {
          const x = sx(b.x);
          const y = sy(b.y);
          const rs = Math.max(1.6, b.r * z);
          if (x < -80 || y < -80 || x > w + 80 || y > h + 80) continue;

          const glow = rs * 5 + 14;
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 0.75;
          ctx.drawImage(glowSprite(b.color), x - glow / 2, y - glow / 2, glow, glow);

          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1;
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.arc(x, y, rs, 0, 6.2832);
          ctx.fill();

          // a small bright spot so every body reads as round
          ctx.globalAlpha = 0.5;
          ctx.fillStyle = CREAM;
          ctx.beginPath();
          ctx.arc(x - rs * 0.25, y - rs * 0.25, rs * 0.42, 0, 6.2832);
          ctx.fill();

          // heavy bodies get a slow breathing ring
          if (b.m >= 500) {
            ctx.globalAlpha = 0.28 + 0.12 * Math.sin(t * 2 + b.id);
            ctx.strokeStyle = b.color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(x, y, rs * 1.55 + Math.sin(t * 2 + b.id) * 1.5, 0, 6.2832);
            ctx.stroke();
          }
        }
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 1;
      }

      function drawEffects() {
        ctx.lineWidth = 2;
        for (const e of f.effects) {
          const life = e.age / e.span;
          ctx.globalAlpha = Math.max(0, 1 - life);
          ctx.strokeStyle = e.color;
          ctx.beginPath();
          ctx.arc(sx(e.x), sy(e.y), 8 + life * e.reach, 0, 6.2832);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      function drawVectors() {
        ctx.strokeStyle = CREAM;
        ctx.fillStyle = CREAM;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.8;
        for (const b of f.world.bodies) {
          const sp = Math.hypot(b.vx, b.vy);
          if (sp < 0.02) continue;
          const x = sx(b.x);
          const y = sy(b.y);
          if (x < -40 || y < -40 || x > w + 40 || y > h + 40) continue;
          const ux = b.vx / sp;
          const uy = b.vy / sp;
          const start = Math.max(1.6, b.r * z) + 3;
          const len = Math.min(sp * 11, 120) + start;
          arrow(x + ux * start, y + uy * start, x + ux * len, y + uy * len);
        }
        ctx.globalAlpha = 1;
      }

      function arrow(x0, y0, x1, y1) {
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        head(x1, y1, Math.atan2(y1 - y0, x1 - x0));
      }

      function head(x, y, a) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - Math.cos(a - 0.45) * 7, y - Math.sin(a - 0.45) * 7);
        ctx.lineTo(x - Math.cos(a + 0.45) * 7, y - Math.sin(a + 0.45) * 7);
        ctx.closePath();
        ctx.fill();
      }

      function drawAim() {
        const a = f.aim;
        const x0 = sx(a.x0);
        const y0 = sy(a.y0);
        const x1 = sx(a.x1);
        const y1 = sy(a.y1);
        const rs = Math.max(2, a.r * z);

        // the body as it will be placed
        ctx.globalCompositeOperation = 'lighter';
        const glow = rs * 5 + 14;
        ctx.globalAlpha = 0.8;
        ctx.drawImage(glowSprite(a.color), x0 - glow / 2, y0 - glow / 2, glow, glow);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = a.color;
        ctx.beginPath();
        ctx.arc(x0, y0, rs, 0, 6.2832);
        ctx.fill();

        // the drag line, which is also the launch direction
        if (Math.hypot(x1 - x0, y1 - y0) > 6) {
          ctx.strokeStyle = CREAM;
          ctx.fillStyle = CREAM;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.85;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
          ctx.setLineDash([]);
          head(x1, y1, Math.atan2(y1 - y0, x1 - x0));
        }
        ctx.globalAlpha = 1;
      }
    }

    resize();
    return { resize, draw, size: () => ({ w, h }) };
  }

  global.OrbitRender = { create };
})(window);
