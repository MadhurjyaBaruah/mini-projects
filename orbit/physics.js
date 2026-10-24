/* Orbit: the physics.
   A small n-body engine. No DOM in here, so it can be tested on its own.

   Integrator: drift-kick-drift leapfrog. It is symplectic, which means energy
   wobbles a little but does not creep away, so orbits stay orbits for a long time.
   Gravity is softened slightly so two bodies passing very close do not get
   flung out at absurd speeds. */

(function (global) {
  'use strict';

  const SOFTENING = 4;
  const SOFT2 = SOFTENING * SOFTENING;
  const MAX_SUBSTEP = 0.125;     // largest time step handed to the integrator
  const CULL_DISTANCE = 40000;   // anything this far from the origin is gone for good

  /* Body size grows with the cube root of mass, so a body that is
     a hundred times heavier looks about five times wider. */
  function radiusFor(m) {
    return 2 + Math.cbrt(m) * 1.4;
  }

  /* The mass slider runs 1 to 100. Squaring it gives a useful spread, from
     tiny debris at the bottom to a proper star at the top. */
  function massFromSlider(s) {
    return Math.round(0.4 * s * s * 10) / 10;
  }

  /* Speed for a circular orbit at distance r around a mass M, including the
     small correction that comes from softening. */
  function circularSpeed(G, M, r) {
    const r2 = r * r;
    return Math.sqrt((G * M * r2) / Math.pow(r2 + SOFT2, 1.5));
  }

  function accelerations(bodies, G) {
    const n = bodies.length;
    for (let i = 0; i < n; i++) {
      bodies[i].ax = 0;
      bodies[i].ay = 0;
    }
    for (let i = 0; i < n; i++) {
      const a = bodies[i];
      for (let j = i + 1; j < n; j++) {
        const b = bodies[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d2 = dx * dx + dy * dy + SOFT2;
        const k = G / (d2 * Math.sqrt(d2));
        const pullOnA = b.m * k;
        const pullOnB = a.m * k;
        a.ax += dx * pullOnA;
        a.ay += dy * pullOnA;
        b.ax -= dx * pullOnB;
        b.ay -= dy * pullOnB;
      }
    }
  }

  function stepBodies(bodies, h, G) {
    const half = h * 0.5;
    const n = bodies.length;
    for (let i = 0; i < n; i++) {
      const b = bodies[i];
      b.x += b.vx * half;
      b.y += b.vy * half;
    }
    accelerations(bodies, G);
    for (let i = 0; i < n; i++) {
      const b = bodies[i];
      b.vx += b.ax * h;
      b.vy += b.ay * h;
      b.x += b.vx * half;
      b.y += b.vy * half;
    }
  }

  class World {
    constructor() {
      this.bodies = [];
      this.G = 1;
      this.merge = true;
      this.merges = 0;
      this.time = 0;
      this.nextId = 1;
    }

    add(spec) {
      const body = {
        id: this.nextId++,
        x: spec.x,
        y: spec.y,
        vx: spec.vx || 0,
        vy: spec.vy || 0,
        m: spec.m,
        r: radiusFor(spec.m),
        color: spec.color || '#5DB996',
        ax: 0,
        ay: 0,
        trail: []
      };
      this.bodies.push(body);
      return body;
    }

    clear() {
      this.bodies.length = 0;
      this.merges = 0;
      this.time = 0;
    }

    /* Move the whole system forward by dtTotal time units.
       Returns a list of merge events so the screen can react to them. */
    advance(dtTotal) {
      const steps = Math.max(1, Math.ceil(dtTotal / MAX_SUBSTEP));
      const h = dtTotal / steps;
      const events = [];
      for (let s = 0; s < steps; s++) {
        stepBodies(this.bodies, h, this.G);
        if (this.merge) this._collide(events);
      }
      this.time += dtTotal;
      this._cull();
      return events;
    }

    _collide(events) {
      const list = this.bodies;
      let again = true;
      while (again) {
        again = false;
        for (let i = 0; i < list.length && !again; i++) {
          for (let j = i + 1; j < list.length; j++) {
            const a = list[i];
            const b = list[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const reach = (a.r + b.r) * 0.75;
            if (dx * dx + dy * dy > reach * reach) continue;

            // keep the heavier one, fold the lighter one into it
            const big = a.m >= b.m ? a : b;
            const small = big === a ? b : a;
            const M = big.m + small.m;
            big.x = (big.x * big.m + small.x * small.m) / M;
            big.y = (big.y * big.m + small.y * small.m) / M;
            big.vx = (big.vx * big.m + small.vx * small.m) / M;
            big.vy = (big.vy * big.m + small.vy * small.m) / M;
            big.m = M;
            big.r = radiusFor(M);
            list.splice(list.indexOf(small), 1);
            this.merges++;
            events.push({ x: big.x, y: big.y, color: big.color });
            again = true;
            break;
          }
        }
      }
    }

    _cull() {
      const limit = CULL_DISTANCE * CULL_DISTANCE;
      for (let i = this.bodies.length - 1; i >= 0; i--) {
        const b = this.bodies[i];
        if (b.x * b.x + b.y * b.y > limit) this.bodies.splice(i, 1);
      }
    }

    /* Shift the system so its centre of mass sits at the origin and does not
       drift. Presets are built planet by planet, so without this the star
       slowly walks off the screen. */
    zeroMomentum() {
      let M = 0, px = 0, py = 0, cx = 0, cy = 0;
      for (const b of this.bodies) {
        M += b.m;
        px += b.m * b.vx;
        py += b.m * b.vy;
        cx += b.m * b.x;
        cy += b.m * b.y;
      }
      if (!M) return;
      for (const b of this.bodies) {
        b.vx -= px / M;
        b.vy -= py / M;
        b.x -= cx / M;
        b.y -= cy / M;
      }
    }

    heaviest() {
      let top = null;
      for (const b of this.bodies) if (!top || b.m > top.m) top = b;
      return top;
    }

    snapshot() {
      return {
        merges: this.merges,
        nextId: this.nextId,
        bodies: this.bodies.map(b => Object.assign({}, b, { trail: b.trail.slice() }))
      };
    }

    restore(snap) {
      this.merges = snap.merges;
      this.nextId = snap.nextId;
      this.bodies = snap.bodies.map(b => Object.assign({}, b, { trail: b.trail.slice() }));
    }
  }

  /* Run a copy of the system forward with one extra body and report where that
     body goes. Used for the dotted preview while aiming a launch.
     Returns a flat array [x0, y0, x1, y1, ...]. */
  function predict(world, spec, frames, dtPerFrame) {
    const sim = world.bodies.map(b => ({
      x: b.x, y: b.y, vx: b.vx, vy: b.vy, m: b.m, r: b.r, ax: 0, ay: 0
    }));
    const probe = {
      x: spec.x, y: spec.y, vx: spec.vx, vy: spec.vy,
      m: spec.m, r: radiusFor(spec.m), ax: 0, ay: 0
    };
    sim.push(probe);

    const subs = Math.max(1, Math.ceil(dtPerFrame / MAX_SUBSTEP));
    const h = dtPerFrame / subs;
    const path = [probe.x, probe.y];

    for (let f = 0; f < frames; f++) {
      for (let s = 0; s < subs; s++) stepBodies(sim, h, world.G);
      path.push(probe.x, probe.y);

      // the preview ends where the new body would hit something
      let hit = false;
      for (let i = 0; i < sim.length - 1; i++) {
        const o = sim[i];
        const dx = o.x - probe.x;
        const dy = o.y - probe.y;
        const reach = (o.r + probe.r) * 0.75;
        if (dx * dx + dy * dy < reach * reach) { hit = true; break; }
      }
      if (hit) break;
    }
    return path;
  }

  global.Physics = {
    World,
    predict,
    radiusFor,
    massFromSlider,
    circularSpeed,
    SOFTENING
  };
})(window);
