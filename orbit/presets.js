/* Orbit: starter systems.
   Each preset builds its bodies from the current gravity setting, so the
   orbits stay circular even if the gravity slider has been moved. */

(function (global) {
  'use strict';

  const CREAM = '#FAF6EA';
  const PALE = '#E4F1AF';
  const TEAL = '#5DB996';
  const DEEP = '#108B4F';

  const speed = (G, M, r) => global.Physics.circularSpeed(G, M, r);

  /* A body on a circular orbit around a centre that may itself be moving.
     dir is 1 for counter-clockwise on screen, -1 for the other way. */
  function onOrbit(G, center, M, r, angle, m, color, dir) {
    const v = speed(G, M, r);
    const sign = dir || 1;
    const cx = center.x || 0;
    const cy = center.y || 0;
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      vx: (center.vx || 0) - Math.sin(angle) * v * sign,
      vy: (center.vy || 0) + Math.cos(angle) * v * sign,
      m: m,
      color: color
    };
  }

  const TAU = Math.PI * 2;

  const presets = [

    {
      id: 'solar',
      name: 'Solar',
      note: 'One star, five planets, one moon',
      build(G) {
        const M = 4000;
        const out = [{ x: 0, y: 0, vx: 0, vy: 0, m: M, color: CREAM }];
        out.push(onOrbit(G, {}, M, 70, 0.4, 6, PALE));
        out.push(onOrbit(G, {}, M, 125, 2.6, 9, TEAL));

        // a planet with a moon of its own
        const home = onOrbit(G, {}, M, 195, 4.4, 24, DEEP);
        out.push(home);
        out.push(onOrbit(G, home, home.m, 10, 1.1, 0.5, CREAM));

        out.push(onOrbit(G, {}, M, 310, 1.2, 6, PALE));
        out.push(onOrbit(G, {}, M, 430, 5.5, 4, TEAL));
        return out;
      }
    },

    {
      id: 'binary',
      name: 'Binary',
      note: 'Two stars circling each other',
      build(G) {
        const m = 1500;
        const d = 150;                           // separation between the stars
        const vRel = Math.sqrt((G * 2 * m) / d); // relative speed for a circular pair
        const v = vRel / 2;
        const out = [
          { x: -d / 2, y: 0, vx: 0, vy: -v, m: m, color: PALE },
          { x:  d / 2, y: 0, vx: 0, vy:  v, m: m, color: TEAL }
        ];
        out.push(onOrbit(G, {}, 2 * m, 450, 0.8, 24, CREAM));
        out.push(onOrbit(G, {}, 2 * m, 600, 3.9, 30, DEEP));
        return out;
      }
    },

    {
      id: 'eight',
      name: 'Figure eight',
      note: 'Three equal bodies on one looping track',
      build(G) {
        // Chenciner and Montgomery, 2000. Unit solution, then scaled to our size.
        const m = 500;
        const L = 150;
        const k = Math.sqrt((G * m) / L);
        const px = 0.97000436;
        const py = -0.24308753;
        const vx = 0.4662036850;
        const vy = 0.4323657300;
        return [
          { x: -px * L, y: -py * L, vx: vx * k, vy: vy * k, m: m, color: PALE },
          { x: 0, y: 0, vx: -2 * vx * k, vy: -2 * vy * k, m: m, color: TEAL },
          { x: px * L, y: py * L, vx: vx * k, vy: vy * k, m: m, color: CREAM }
        ];
      }
    },

    {
      id: 'comet',
      name: 'Comet',
      note: 'A stretched orbit with a calm planet',
      build(G) {
        const M = 4000;
        const out = [{ x: 0, y: 0, vx: 0, vy: 0, m: M, color: PALE }];
        out.push(onOrbit(G, {}, M, 150, 0.2, 60, TEAL));

        // start at the far end and move slowly, so the path swings in close
        const r = 430;
        const v = speed(G, M, r) * 0.42;
        out.push({ x: -r, y: 0, vx: 0, vy: -v, m: 3, color: CREAM });
        return out;
      }
    },

    {
      id: 'rings',
      name: 'Rings',
      note: 'A thin ring and a planet stirring it',
      build(G) {
        const M = 4000;
        const out = [{ x: 0, y: 0, vx: 0, vy: 0, m: M, color: CREAM }];
        const count = 26;
        for (let i = 0; i < count; i++) {
          const a = (i / count) * TAU;
          const r = 150 + (i % 3) * 6;
          out.push(onOrbit(G, {}, M, r, a, 1, i % 2 ? TEAL : PALE));
        }
        out.push(onOrbit(G, {}, M, 290, 1.0, 50, DEEP));
        return out;
      }
    },

    {
      id: 'cluster',
      name: 'Swarm',
      note: 'Small bodies that slowly gather into planets',
      build(G) {
        const colors = [PALE, TEAL, DEEP, CREAM];
        const M = 2200;
        const count = 18;
        const out = [{ x: 0, y: 0, vx: 0, vy: 0, m: M, color: CREAM }];
        for (let i = 0; i < count; i++) {
          // spread the radii in even slices so no two start on top of each other
          const r = 110 + ((i + Math.random()) / count) * 240;
          const a = Math.random() * TAU;
          const v = speed(G, M, r) * (0.92 + Math.random() * 0.14);
          out.push({
            x: Math.cos(a) * r,
            y: Math.sin(a) * r,
            vx: -Math.sin(a) * v,
            vy: Math.cos(a) * v,
            m: 1 + Math.random() * 8,
            color: colors[i % colors.length]
          });
        }
        return out;
      }
    }
  ];

  global.OrbitPresets = presets;
})(window);
