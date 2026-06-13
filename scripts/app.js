(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tau = Math.PI * 2;

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function setupCanvas(canvas) {
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { width: rect.width, height: rect.height };
    }

    return { canvas, ctx, resize };
  }

  function initHeroParticles() {
    const canvas = document.getElementById("particle-bg");
    if (!canvas) return;

    const stage = setupCanvas(canvas);
    const pointer = { x: 0, y: 0, active: false };
    let bounds = stage.resize();
    let particles = [];
    let meteors = [];

    function seed() {
      bounds = stage.resize();
      const count = reduceMotion ? 44 : Math.min(180, Math.floor(bounds.width / 7));
      particles = Array.from({ length: count }, () => ({
        x: random(0, bounds.width),
        y: random(0, bounds.height),
        r: random(0.6, 2.8),
        vx: random(-0.22, 0.22),
        vy: random(-0.16, 0.28),
        hue: random(252, 292),
        life: random(0, tau),
        twinkle: random(0, tau),
        twinkleSpeed: random(0.02, 0.06),
        kind: Math.random() < 0.15 ? "glow" : "star",
      }));
    }

    function spawnMeteor() {
      if (reduceMotion || meteors.length > 2) return;
      const fromLeft = Math.random() < 0.5;
      meteors.push({
        x: fromLeft ? -40 : bounds.width + 40,
        y: random(0, bounds.height * 0.45),
        vx: fromLeft ? random(6, 10) : random(-10, -6),
        vy: random(2, 5),
        len: random(60, 120),
        life: 1,
      });
    }

    function movePointer(event) {
      const rect = canvas.getBoundingClientRect();
      const point = event.touches ? event.touches[0] : event;
      pointer.x = point.clientX - rect.left;
      pointer.y = point.clientY - rect.top;
      pointer.active = true;
    }

    function clearPointer() {
      pointer.active = false;
    }

    function draw() {
      const { ctx } = stage;
      ctx.clearRect(0, 0, bounds.width, bounds.height);

      for (const p of particles) {
        p.life += 0.018;
        p.twinkle += p.twinkleSpeed;
        p.x += p.vx + Math.cos(p.life) * 0.08;
        p.y += p.vy + Math.sin(p.life * 0.7) * 0.08;

        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0 && dist < 160) {
            const force = (160 - dist) / 160;
            p.x += (dx / dist) * force * 1.6;
            p.y += (dy / dist) * force * 1.6;
          }
        }

        if (p.x < -20) p.x = bounds.width + 20;
        if (p.x > bounds.width + 20) p.x = -20;
        if (p.y < -20) p.y = bounds.height + 20;
        if (p.y > bounds.height + 20) p.y = -20;

        const twinkle = 0.5 + Math.sin(p.twinkle) * 0.5;
        const alpha = p.kind === "glow"
          ? 0.18 + twinkle * 0.22
          : 0.22 + twinkle * 0.14;

        if (p.kind === "glow") {
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
          gradient.addColorStop(0, `hsla(${p.hue}, 70%, 88%, ${alpha})`);
          gradient.addColorStop(1, "hsla(260, 60%, 80%, 0)");
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 6, 0, tau);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, tau);
          ctx.fillStyle = `hsla(${p.hue}, 58%, 88%, ${alpha})`;
          ctx.fill();
        }
      }

      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const a = particles[i];
          const b = particles[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 96) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(210, 199, 238, ${(1 - dist / 96) * 0.1})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      for (let i = meteors.length - 1; i >= 0; i -= 1) {
        const m = meteors[i];
        m.x += m.vx;
        m.y += m.vy;
        m.life -= 0.018;

        const tailX = m.x - m.vx * (m.len / 10);
        const tailY = m.y - m.vy * (m.len / 10);
        const gradient = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
        gradient.addColorStop(0, "rgba(200, 183, 244, 0)");
        gradient.addColorStop(0.6, "rgba(200, 183, 244, 0.45)");
        gradient.addColorStop(1, "rgba(255, 250, 255, 0.95)");
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(m.x, m.y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(m.x, m.y, 2.2, 0, tau);
        ctx.fillStyle = "rgba(255, 252, 255, 0.9)";
        ctx.fill();

        if (m.life <= 0 || m.x < -200 || m.x > bounds.width + 200 || m.y > bounds.height + 100) {
          meteors.splice(i, 1);
        }
      }

      if (!reduceMotion) requestAnimationFrame(draw);
    }

    window.addEventListener("resize", seed);
    canvas.addEventListener("mousemove", movePointer);
    canvas.addEventListener("touchmove", movePointer, { passive: true });
    canvas.addEventListener("mouseleave", clearPointer);
    canvas.addEventListener("touchend", clearPointer);

    if (!reduceMotion) {
      setInterval(() => {
        if (Math.random() < 0.35) spawnMeteor();
      }, 2800);
    }

    seed();
    draw();
  }

  function initHeroParallax() {
    const hero = document.querySelector(".hero-content");
    const section = document.querySelector(".hero");
    if (!hero || !section || reduceMotion) return;

    section.addEventListener("mousemove", (event) => {
      const rect = section.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      hero.style.transform = `translate(${x * 14}px, ${y * 10}px)`;
    });

    section.addEventListener("mouseleave", () => {
      hero.style.transform = "translate(0, 0)";
    });
  }

  function createEffect(canvas) {
    const stage = setupCanvas(canvas);
    const mode = canvas.dataset.effect;
    let bounds = stage.resize();
    let points = [];
    const pointer = { x: 0, y: 0, active: false };

    function seed() {
      bounds = stage.resize();
      const base = mode === "spark" ? 44 : 130;
      points = Array.from({ length: reduceMotion ? Math.floor(base / 2) : base }, (_, index) => ({
        x: random(0, bounds.width),
        y: random(0, bounds.height),
        vx: random(-0.55, 0.55),
        vy: random(-0.55, 0.55),
        r: random(0.9, 2.6),
        spin: random(0, tau),
        index,
      }));
    }

    function trackPointer(event) {
      const rect = canvas.getBoundingClientRect();
      const point = event.touches ? event.touches[0] : event;
      pointer.x = point.clientX - rect.left;
      pointer.y = point.clientY - rect.top;
      pointer.active = true;
    }

    function drawFlow(t) {
      const { ctx } = stage;
      ctx.fillStyle = "rgba(24, 19, 36, 0.14)";
      ctx.fillRect(0, 0, bounds.width, bounds.height);
      for (const p of points) {
        const angle = Math.sin((p.x + t * 0.025) * 0.022) + Math.cos((p.y - t * 0.018) * 0.024);
        p.x += Math.cos(angle) * 0.78;
        p.y += Math.sin(angle) * 0.78;
        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0 && dist < 90) {
            p.x += (dx / dist) * 0.6;
            p.y += (dy / dist) * 0.6;
          }
        }
        if (p.x < 0) p.x = bounds.width;
        if (p.x > bounds.width) p.x = 0;
        if (p.y < 0) p.y = bounds.height;
        if (p.y > bounds.height) p.y = 0;
        ctx.fillStyle = "rgba(184, 164, 232, 0.58)";
        ctx.fillRect(p.x, p.y, 1.5, 1.5);
      }
    }

    function drawOrbit(t) {
      const { ctx } = stage;
      const cx = bounds.width / 2;
      const cy = bounds.height / 2;
      ctx.fillStyle = "rgba(24, 19, 36, 0.20)";
      ctx.fillRect(0, 0, bounds.width, bounds.height);

      const orbitCx = pointer.active ? pointer.x : cx;
      const orbitCy = pointer.active ? pointer.y : cy;

      for (const p of points) {
        const radius = 32 + (p.index % 8) * 18;
        const speed = 0.00035 + (p.index % 6) * 0.00008;
        const angle = p.spin + t * speed;
        const x = orbitCx + Math.cos(angle) * radius * (1.2 + Math.sin(p.index) * 0.2);
        const y = orbitCy + Math.sin(angle) * radius * 0.62;
        ctx.beginPath();
        ctx.arc(x, y, p.r, 0, tau);
        ctx.fillStyle = `hsla(${254 + (p.index % 34)}, 54%, 82%, 0.58)`;
        ctx.fill();
      }
    }

    function drawSpark(t) {
      const { ctx } = stage;
      ctx.fillStyle = "rgba(24, 19, 36, 0.22)";
      ctx.fillRect(0, 0, bounds.width, bounds.height);
      for (const p of points) {
        p.spin += 0.04;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > bounds.width) p.vx *= -1;
        if (p.y < 0 || p.y > bounds.height) p.vy *= -1;
        const glow = 0.36 + (Math.sin(p.spin + t * 0.004) + 1) * 0.26;
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 18);
        gradient.addColorStop(0, `rgba(230, 207, 152, ${glow * 0.82})`);
        gradient.addColorStop(0.38, `rgba(226, 190, 215, ${glow * 0.34})`);
        gradient.addColorStop(1, "rgba(226, 190, 215, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 18, 0, tau);
        ctx.fill();
      }
    }

    function draw(t) {
      if (mode === "flow") drawFlow(t);
      if (mode === "orbit") drawOrbit(t);
      if (mode === "spark") drawSpark(t);
      if (!reduceMotion) requestAnimationFrame(draw);
    }

    window.addEventListener("resize", seed);
    canvas.addEventListener("mousemove", trackPointer);
    canvas.addEventListener("touchmove", trackPointer, { passive: true });
    canvas.addEventListener("mouseleave", () => { pointer.active = false; });
    seed();
    draw(0);
  }

  function initEffects() {
    document.querySelectorAll(".effect-canvas").forEach(createEffect);
  }

  function initGalaxyPortal() {
    const canvas = document.getElementById("galaxy-canvas");
    if (!canvas) return;

    const stage = setupCanvas(canvas);
    let bounds = stage.resize();
    let stars = [];
    let pulses = [];
    let pulseCount = 0;
    const gravity = { x: 0, y: 0, active: false };
    const counters = {
      stars: document.querySelector("[data-cosmic-counter='stars']"),
      distance: document.querySelector("[data-cosmic-counter='distance']"),
      pulse: document.querySelector("[data-cosmic-counter='pulse']"),
    };

    function seed() {
      bounds = stage.resize();
      gravity.x = bounds.width / 2;
      gravity.y = bounds.height / 2;
      const count = reduceMotion ? 280 : Math.min(1400, Math.floor(bounds.width * bounds.height / 180));
      stars = Array.from({ length: count }, (_, i) => {
        const arm = i % 4;
        const t = random(0, 1);
        const radius = t * Math.min(bounds.width, bounds.height) * 0.42;
        const angle = arm * (tau / 4) + t * 3.8 + radius * 0.012;
        return {
          angle,
          radius,
          speed: 0.0004 + (1 - t) * 0.0012,
          size: random(0.6, 2.2),
          hue: random(240, 290),
          drift: random(-0.3, 0.3),
        };
      });
      if (counters.stars) counters.stars.textContent = String(count);
      if (counters.distance) counters.distance.textContent = String(Math.floor(count * 2.4));
    }

    function moveGravity(event) {
      const rect = canvas.getBoundingClientRect();
      const point = event.touches ? event.touches[0] : event;
      gravity.x = point.clientX - rect.left;
      gravity.y = point.clientY - rect.top;
      gravity.active = true;
    }

    function releasePulse(event) {
      const rect = canvas.getBoundingClientRect();
      const point = event.changedTouches ? event.changedTouches[0] : event;
      const x = point.clientX - rect.left;
      const y = point.clientY - rect.top;
      pulses.push({ x, y, r: 8, life: 1 });
      pulseCount += 1;
      if (counters.pulse) counters.pulse.textContent = String(pulseCount);
    }

    function draw() {
      const { ctx } = stage;
      const cx = bounds.width / 2;
      const cy = bounds.height / 2;

      ctx.fillStyle = "#0d0a16";
      ctx.fillRect(0, 0, bounds.width, bounds.height);

      const coreGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
      coreGradient.addColorStop(0, "rgba(200, 183, 244, 0.35)");
      coreGradient.addColorStop(0.4, "rgba(143, 124, 200, 0.12)");
      coreGradient.addColorStop(1, "rgba(13, 10, 22, 0)");
      ctx.fillStyle = coreGradient;
      ctx.fillRect(0, 0, bounds.width, bounds.height);

      const gx = gravity.active ? gravity.x : cx;
      const gy = gravity.active ? gravity.y : cy;

      for (const s of stars) {
        s.angle += s.speed;

        let x = cx + Math.cos(s.angle) * s.radius;
        let y = cy + Math.sin(s.angle) * s.radius * 0.55 + s.drift;

        if (gravity.active) {
          const dx = gx - x;
          const dy = gy - y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0 && dist < 200) {
            const pull = (200 - dist) / 200 * 0.35;
            x += (dx / dist) * pull * 8;
            y += (dy / dist) * pull * 8;
          }
        }

        for (const pulse of pulses) {
          const pdx = x - pulse.x;
          const pdy = y - pulse.y;
          const pdist = Math.hypot(pdx, pdy);
          if (pdist > pulse.r - 12 && pdist < pulse.r + 12) {
            x += (pdx / pdist) * 3;
            y += (pdy / pdist) * 3;
          }
        }

        const alpha = 0.35 + (s.size / 2.2) * 0.45;
        ctx.beginPath();
        ctx.arc(x, y, s.size, 0, tau);
        ctx.fillStyle = `hsla(${s.hue}, 62%, 84%, ${alpha})`;
        ctx.fill();
      }

      for (let i = pulses.length - 1; i >= 0; i -= 1) {
        const pulse = pulses[i];
        pulse.r += 4.5;
        pulse.life -= 0.012;
        ctx.beginPath();
        ctx.arc(pulse.x, pulse.y, pulse.r, 0, tau);
        ctx.strokeStyle = `rgba(200, 183, 244, ${pulse.life * 0.5})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        if (pulse.life <= 0) pulses.splice(i, 1);
      }

      if (!reduceMotion) requestAnimationFrame(draw);
    }

    window.addEventListener("resize", seed);
    canvas.addEventListener("mousemove", moveGravity);
    canvas.addEventListener("touchmove", moveGravity, { passive: true });
    canvas.addEventListener("mouseleave", () => { gravity.active = false; });
    canvas.addEventListener("click", releasePulse);
    canvas.addEventListener("touchend", releasePulse);

    seed();
    draw();
  }

  function initCosmicCursor() {
    const canvas = document.getElementById("cosmic-cursor");
    if (!canvas || reduceMotion) return;

    const stage = setupCanvas(canvas);
    let bounds = stage.resize();
    const trail = [];
    const bursts = [];

    function resize() {
      bounds = stage.resize();
    }

    window.addEventListener("resize", resize);
    document.addEventListener("mousemove", (event) => {
      if (trail.length < 40) {
        trail.push({
          x: event.clientX + random(-4, 4),
          y: event.clientY + random(-4, 4),
          r: random(0.8, 2.2),
          life: 1,
          hue: random(250, 290),
        });
      }
    }, { passive: true });

    document.addEventListener("click", (event) => {
      const target = event.target;
      if (target.closest("a, button, .galaxy-canvas")) return;

      const ring = document.createElement("div");
      ring.className = "supernova-ring";
      ring.style.left = `${event.clientX}px`;
      ring.style.top = `${event.clientY}px`;
      document.body.appendChild(ring);
      ring.addEventListener("animationend", () => ring.remove());

      for (let i = 0; i < 14; i += 1) {
        const angle = (i / 14) * tau + random(-0.2, 0.2);
        const speed = random(2.5, 5.5);
        bursts.push({
          x: event.clientX,
          y: event.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          hue: random(240, 300),
        });
      }
    });

    function draw() {
      const { ctx } = stage;
      ctx.clearRect(0, 0, bounds.width, bounds.height);

      for (let i = trail.length - 1; i >= 0; i -= 1) {
        const p = trail[i];
        p.life -= 0.035;
        if (p.life <= 0) {
          trail.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * p.life, 0, tau);
        ctx.fillStyle = `hsla(${p.hue}, 70%, 88%, ${p.life * 0.55})`;
        ctx.fill();
      }

      for (let i = bursts.length - 1; i >= 0; i -= 1) {
        const p = bursts[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.life -= 0.028;
        if (p.life <= 0) {
          bursts.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5 * p.life, 0, tau);
        ctx.fillStyle = `hsla(${p.hue}, 75%, 92%, ${p.life})`;
        ctx.fill();
      }

      requestAnimationFrame(draw);
    }

    resize();
    draw();
  }

  function initConstellation() {
    const wrap = document.querySelector(".constellation-wrap");
    const canvas = document.getElementById("constellation-canvas");
    const stars = [...document.querySelectorAll(".constellation-stars [data-star]")];
    if (!wrap || !canvas || !stars.length) return;

    const stage = setupCanvas(canvas);
    let bounds = stage.resize();
    const litStars = new Set();
    let pulse = 0;

    function getPositions() {
      const wrapRect = wrap.getBoundingClientRect();
      return stars.map((star) => {
        const rect = star.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2 - wrapRect.left,
          y: rect.top + rect.height / 2 - wrapRect.top,
        };
      });
    }

    function draw() {
      bounds = stage.resize();
      const { ctx } = stage;
      const positions = getPositions();
      const glow = 0.45 + Math.sin(pulse) * 0.25;

      ctx.clearRect(0, 0, bounds.width, bounds.height);

      for (let i = 0; i < positions.length; i += 1) {
        for (let j = i + 1; j < positions.length; j += 1) {
          const a = positions[i];
          const b = positions[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          const bothLit = litStars.has(i) && litStars.has(j);
          const oneLit = litStars.has(i) || litStars.has(j);

          if (dist < 280) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            if (bothLit) {
              ctx.strokeStyle = `rgba(200, 183, 244, ${glow * 0.75})`;
              ctx.lineWidth = 1.5;
              ctx.shadowColor = "rgba(200, 183, 244, 0.75)";
              ctx.shadowBlur = 8;
            } else if (oneLit) {
              ctx.strokeStyle = `rgba(228, 179, 212, ${0.2 + glow * 0.14})`;
              ctx.lineWidth = 1;
              ctx.shadowBlur = 0;
            } else {
              ctx.strokeStyle = `rgba(184, 164, 232, ${(1 - dist / 280) * 0.08})`;
              ctx.lineWidth = 1;
              ctx.shadowBlur = 0;
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        }
      }

      for (let i = 0; i < positions.length; i += 1) {
        const p = positions[i];
        if (litStars.has(i)) {
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 32);
          gradient.addColorStop(0, `rgba(228, 179, 212, ${glow * 0.38})`);
          gradient.addColorStop(0.5, `rgba(200, 183, 244, ${glow * 0.18})`);
          gradient.addColorStop(1, "rgba(200, 183, 244, 0)");
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 32, 0, tau);
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, litStars.has(i) ? 3 : 1.5, 0, tau);
        ctx.fillStyle = litStars.has(i)
          ? `rgba(200, 183, 244, ${0.55 + glow * 0.4})`
          : "rgba(184, 164, 232, 0.28)";
        ctx.fill();
      }
    }

    function animate() {
      pulse += 0.04;
      draw();
      if (!reduceMotion) requestAnimationFrame(animate);
    }

    stars.forEach((star, index) => {
      star.addEventListener("mouseenter", () => {
        litStars.add(index);
        star.classList.add("is-lit");
      });
      star.addEventListener("mouseleave", () => {
        litStars.delete(index);
        star.classList.remove("is-lit");
      });
      star.addEventListener("click", () => {
        litStars.add(index);
        star.classList.add("is-lit");
      });
    });

    window.addEventListener("resize", draw);
    animate();
  }

  function initCyberSky() {
    const canvas = document.getElementById("cyber-sky-bg");
    const section = document.getElementById("focus");
    if (!canvas || !section) return;

    const stage = setupCanvas(canvas);
    let bounds = stage.resize();
    let stars = [];
    let dataLines = [];
    let gridOffset = 0;

    function seed() {
      bounds = stage.resize();
      const count = reduceMotion ? 90 : Math.min(380, Math.floor(bounds.width * bounds.height / 480));
      stars = Array.from({ length: count }, () => {
        const roll = Math.random();
        return {
          x: random(0, bounds.width),
          y: random(0, bounds.height),
          r: random(0.3, 1.8),
          twinkle: random(0, tau),
          speed: random(0.02, 0.06),
          kind: roll < 0.14 ? "rose" : roll < 0.32 ? "violet" : "white",
        };
      });
      dataLines = Array.from({ length: 8 }, () => ({
        y: random(0, bounds.height),
        speed: random(0.25, 0.7),
        alpha: random(0.04, 0.12),
      }));
    }

    function drawGrid(ctx) {
      const horizon = bounds.height * 0.68;
      const rows = 14;
      gridOffset = (gridOffset + 0.35) % 36;
      const centerX = bounds.width / 2;

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, horizon - 16, bounds.width, bounds.height - horizon + 16);
      ctx.clip();

      for (let r = 0; r <= rows; r += 1) {
        const t = r / rows;
        const y = horizon + (bounds.height - horizon) * t * t + gridOffset * t;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(bounds.width, y);
        ctx.strokeStyle = `rgba(200, 183, 244, ${0.06 + t * 0.14})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      for (let c = -12; c <= 12; c += 1) {
        const spread = c * 42;
        ctx.beginPath();
        ctx.moveTo(centerX + c * 6, horizon);
        ctx.lineTo(centerX + spread, bounds.height + 30);
        ctx.strokeStyle = `rgba(200, 140, 190, ${0.04 + Math.abs(c) / 12 * 0.08})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();
    }

    function draw() {
      const { ctx } = stage;
      ctx.fillStyle = "#120a18";
      ctx.fillRect(0, 0, bounds.width, bounds.height);

      const nebula = ctx.createRadialGradient(
        bounds.width * 0.75,
        bounds.height * 0.25,
        0,
        bounds.width * 0.75,
        bounds.height * 0.25,
        bounds.width * 0.55
      );
      nebula.addColorStop(0, "rgba(200, 140, 190, 0.08)");
      nebula.addColorStop(0.45, "rgba(143, 124, 200, 0.06)");
      nebula.addColorStop(1, "transparent");
      ctx.fillStyle = nebula;
      ctx.fillRect(0, 0, bounds.width, bounds.height);

      drawGrid(ctx);

      for (const line of dataLines) {
        line.y += line.speed;
        if (line.y > bounds.height) line.y = -4;
        ctx.fillStyle = `rgba(200, 183, 244, ${line.alpha})`;
        ctx.fillRect(0, line.y, bounds.width, 1);
      }

      for (const s of stars) {
        s.twinkle += s.speed;
        const flicker = 0.28 + Math.sin(s.twinkle) * 0.38;
        let color = `rgba(230, 220, 245, ${flicker * 0.75})`;
        if (s.kind === "rose") color = `rgba(228, 179, 212, ${flicker})`;
        if (s.kind === "violet") color = `rgba(200, 183, 244, ${flicker * 0.9})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, tau);
        ctx.fillStyle = color;
        ctx.fill();
      }
    }

    window.addEventListener("resize", seed);
    seed();

    function loop() {
      draw();
      if (!reduceMotion) requestAnimationFrame(loop);
    }
    loop();
  }

  function initRoseNebula() {
    const canvas = document.getElementById("nebula-bg");
    const section = document.getElementById("about");
    if (!canvas || !section) return;

    const stage = setupCanvas(canvas);
    let bounds = stage.resize();
    const pointer = { x: 0.5, y: 0.5 };
    let clouds = [];
    let stars = [];

    const cloudDefs = [
      { nx: 0.62, ny: 0.38, rx: 0.42, ry: 0.34, hue: 330, sat: 72, light: 58, alpha: 0.22, drift: 0.00018 },
      { nx: 0.48, ny: 0.52, rx: 0.38, ry: 0.30, hue: 345, sat: 78, light: 52, alpha: 0.28, drift: 0.00014 },
      { nx: 0.35, ny: 0.45, rx: 0.30, ry: 0.38, hue: 315, sat: 65, light: 48, alpha: 0.16, drift: 0.00011 },
      { nx: 0.70, ny: 0.55, rx: 0.28, ry: 0.22, hue: 355, sat: 80, light: 65, alpha: 0.14, drift: 0.00016 },
      { nx: 0.55, ny: 0.42, rx: 0.18, ry: 0.16, hue: 340, sat: 85, light: 72, alpha: 0.35, drift: 0.00022 },
      { nx: 0.22, ny: 0.68, rx: 0.32, ry: 0.26, hue: 300, sat: 55, light: 42, alpha: 0.10, drift: 0.00009 },
      { nx: 0.80, ny: 0.25, rx: 0.24, ry: 0.20, hue: 325, sat: 70, light: 55, alpha: 0.12, drift: 0.00013 },
    ];

    function seed() {
      bounds = stage.resize();
      clouds = cloudDefs.map((def, i) => ({
        ...def,
        phase: random(0, tau),
        angle: random(0, tau),
        index: i,
      }));
      const starCount = reduceMotion ? 60 : Math.min(220, Math.floor(bounds.width * bounds.height / 900));
      stars = Array.from({ length: starCount }, () => ({
        x: random(0, bounds.width),
        y: random(0, bounds.height),
        r: random(0.4, 1.6),
        twinkle: random(0, tau),
        speed: random(0.015, 0.05),
        hue: random(300, 360),
      }));
    }

    function movePointer(event) {
      const rect = section.getBoundingClientRect();
      const point = event.touches ? event.touches[0] : event;
      pointer.x = (point.clientX - rect.left) / rect.width;
      pointer.y = (point.clientY - rect.top) / rect.height;
    }

    function drawCloud(ctx, cloud, t) {
      const parallaxX = (pointer.x - 0.5) * 28;
      const parallaxY = (pointer.y - 0.5) * 18;
      const wobble = Math.sin(t * cloud.drift * 1000 + cloud.phase) * 0.04;
      const cx = (cloud.nx + wobble * 0.3) * bounds.width + parallaxX * (cloud.index % 3 + 1) * 0.6;
      const cy = (cloud.ny + Math.cos(t * cloud.drift * 800 + cloud.phase) * 0.03) * bounds.height + parallaxY * (cloud.index % 2 + 1) * 0.5;
      const rx = cloud.rx * bounds.width;
      const ry = cloud.ry * bounds.height;

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
      gradient.addColorStop(0, `hsla(${cloud.hue}, ${cloud.sat}%, ${cloud.light}%, ${cloud.alpha})`);
      gradient.addColorStop(0.45, `hsla(${cloud.hue}, ${cloud.sat - 8}%, ${cloud.light - 8}%, ${cloud.alpha * 0.55})`);
      gradient.addColorStop(0.75, `hsla(${cloud.hue - 15}, ${cloud.sat - 15}%, ${cloud.light - 15}%, ${cloud.alpha * 0.15})`);
      gradient.addColorStop(1, "hsla(280, 40%, 30%, 0)");

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(cloud.angle + t * cloud.drift * 0.3);
      ctx.scale(1, ry / rx);
      ctx.beginPath();
      ctx.arc(0, 0, rx, 0, tau);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.restore();
    }

    function draw(t) {
      const { ctx } = stage;
      ctx.fillStyle = "#08040c";
      ctx.fillRect(0, 0, bounds.width, bounds.height);

      const coreX = bounds.width * (0.55 + (pointer.x - 0.5) * 0.06);
      const coreY = bounds.height * (0.44 + (pointer.y - 0.5) * 0.05);
      const coreGlow = ctx.createRadialGradient(coreX, coreY, 0, coreX, coreY, bounds.width * 0.35);
      coreGlow.addColorStop(0, "rgba(255, 160, 200, 0.18)");
      coreGlow.addColorStop(0.35, "rgba(200, 80, 140, 0.10)");
      coreGlow.addColorStop(0.7, "rgba(120, 40, 90, 0.04)");
      coreGlow.addColorStop(1, "rgba(8, 4, 12, 0)");
      ctx.fillStyle = coreGlow;
      ctx.fillRect(0, 0, bounds.width, bounds.height);

      ctx.globalCompositeOperation = "lighter";
      for (const cloud of clouds) {
        drawCloud(ctx, cloud, t);
      }
      ctx.globalCompositeOperation = "source-over";

      for (const s of stars) {
        s.twinkle += s.speed;
        const flicker = 0.35 + Math.sin(s.twinkle) * 0.35;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, tau);
        ctx.fillStyle = `hsla(${s.hue}, 60%, 92%, ${flicker})`;
        ctx.fill();
      }

      if (!reduceMotion) requestAnimationFrame(draw);
    }

    window.addEventListener("resize", seed);
    section.addEventListener("mousemove", movePointer);
    section.addEventListener("touchmove", movePointer, { passive: true });

    seed();
    let start = performance.now();
    function loop(now) {
      draw((now - start) / 1000);
      if (!reduceMotion) requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  function initReveal() {
    const nodes = [...document.querySelectorAll(".reveal")];
    if (!nodes.length) return;
    if (!("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );
    nodes.forEach((node) => observer.observe(node));
  }

  initHeroParticles();
  initHeroParallax();
  initRoseNebula();
  initEffects();
  initGalaxyPortal();
  initCosmicCursor();
  initCyberSky();
  initConstellation();
  initReveal();
})();
