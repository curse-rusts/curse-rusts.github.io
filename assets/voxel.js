(() => {
  const canvas = document.getElementById("voxel-world");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const palettes = {
    overworld: {
      grass: "#9bdc67",
      dirt: "#79604d",
      stone: "#566980",
      wood: "#74503d",
      leaf: "#53ad80",
      water: "#559bc8",
      ore: "#f9a267",
      glow: "#b4ff78",
    },
    nether: {
      grass: "#ae4b49",
      dirt: "#673846",
      stone: "#3e3e53",
      wood: "#593548",
      leaf: "#d86665",
      water: "#ff8a48",
      ore: "#ffb955",
      glow: "#ff845b",
    },
    end: {
      grass: "#d8d6aa",
      dirt: "#a39d84",
      stone: "#403d59",
      wood: "#4b3e63",
      leaf: "#b098f2",
      water: "#855bc1",
      ore: "#d6b9ff",
      glow: "#bd91ff",
    },
  };
  let biome = "overworld";
  let cells = new Map();
  let faces = [];
  let width = 500;
  let height = 600;
  let yaw = -0.65;
  let drag = null;
  let lastFrame = 0;
  let frameId = 0;
  let clock = 0;
  let assembly = 0;
  let paused = document.body.classList.contains("motion-paused");
  let visible = true;
  let lastTime = 0;
  const stars = Array.from({ length: 40 }, (_, i) => ({
    x: Math.sin(i * 43.7) * 0.46,
    y: Math.cos(i * 87.3) * 0.35,
    size: i % 4 === 0 ? 1.8 : 0.8,
    phase: i * 0.8,
  }));
  const key = (x, y, z) => `${x},${y},${z}`;
  const noise = (x, z) =>
    (Math.sin(x * 2.71 + z * 4.13) + Math.cos(z * 1.83 - x * 2.31)) * 0.5;
  function put(x, y, z, material) {
    cells.set(key(x, y, z), { x, y, z, material });
  }
  function surface(x, z) {
    return Math.floor(1.2 + noise(x, z) * 0.85 + Math.sin(x * 0.55) * 0.7);
  }
  function build() {
    cells = new Map();
    for (let x = -5; x <= 5; x++) {
      for (let z = -5; z <= 5; z++) {
        const radius = Math.hypot(x, z);
        if (radius > 5.1 + noise(x, z) * 0.65) continue;
        const top = surface(x, z);
        const bottom = -4 + Math.floor(radius * 0.48);
        for (let y = bottom; y <= top; y++) {
          let material = y === top ? "grass" : y >= top - 1 ? "dirt" : "stone";
          if (y < 0 && Math.sin(x * 9 + z * 3 + y * 2) > 0.91) material = "ore";
          if (y === top && x >= -1 && x <= 1 && z >= -3 && z <= -1)
            material = "water";
          put(x, y, z, material);
        }
      }
    }
    for (const [x, z, tall] of [
      [-3, 0, 4],
      [2, 2, 3],
      [2, -3, 3],
    ]) {
      const base = surface(x, z) + 1;
      for (let y = base; y < base + tall; y++) put(x, y, z, "wood");
      if (biome === "end") {
        for (let y = base + tall - 1; y <= base + tall + 2; y++)
          put(x, y, z, "leaf");
        put(x + 1, base + tall, z, "leaf");
        put(x, base + tall + 1, z + 1, "leaf");
      } else {
        for (let dx = -1; dx <= 1; dx++) {
          for (let dz = -1; dz <= 1; dz++) {
            for (let dy = -1; dy <= 1; dy++) {
              if (Math.abs(dx) + Math.abs(dz) + Math.max(0, dy) > 2) continue;
              put(x + dx, base + tall + dy, z + dz, "leaf");
            }
          }
        }
        put(x, base + tall + 2, z, "leaf");
      }
    }
    const sides = [
      {
        normal: [0, 1, 0],
        vertices: [
          [0, 1, 0],
          [1, 1, 0],
          [1, 1, 1],
          [0, 1, 1],
        ],
        shade: 1.12,
      },
      {
        normal: [1, 0, 0],
        vertices: [
          [1, 0, 0],
          [1, 1, 0],
          [1, 1, 1],
          [1, 0, 1],
        ],
        shade: 0.82,
      },
      {
        normal: [-1, 0, 0],
        vertices: [
          [0, 0, 1],
          [0, 1, 1],
          [0, 1, 0],
          [0, 0, 0],
        ],
        shade: 0.68,
      },
      {
        normal: [0, 0, 1],
        vertices: [
          [0, 0, 1],
          [1, 0, 1],
          [1, 1, 1],
          [0, 1, 1],
        ],
        shade: 0.88,
      },
      {
        normal: [0, 0, -1],
        vertices: [
          [0, 1, 0],
          [1, 1, 0],
          [1, 0, 0],
          [0, 0, 0],
        ],
        shade: 0.72,
      },
      {
        normal: [0, -1, 0],
        vertices: [
          [0, 0, 0],
          [1, 0, 0],
          [1, 0, 1],
          [0, 0, 1],
        ],
        shade: 0.5,
      },
    ];
    faces = [];
    for (const cell of cells.values()) {
      for (const side of sides) {
        const [nx, ny, nz] = side.normal;
        if (cells.has(key(cell.x + nx, cell.y + ny, cell.z + nz))) continue;
        const material =
          cell.material === "grass" && ny !== 1 ? "dirt" : cell.material;
        const base = palettes[biome][material];
        const variation = 1 + noise(cell.x + cell.y, cell.z) * 0.065;
        const rgb = [1, 3, 5].map((i) =>
          Math.min(
            255,
            Math.round(
              parseInt(base.slice(i, i + 2), 16) * side.shade * variation,
            ),
          ),
        );
        faces.push({
          normal: side.normal,
          vertices: side.vertices.map(([x, y, z]) => [
            x + cell.x - 0.5,
            y + cell.y,
            z + cell.z - 0.5,
          ]),
          color: `rgb(${rgb.join(",")})`,
          delay: (cell.x + cell.z + 10) * 28 + (cell.y + 4) * 22,
        });
      }
    }
    assembly = reduced.matches ? 2800 : 0;
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    const dpr = Math.min(devicePixelRatio || 1, 1.7);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  function draw() {
    ctx.clearRect(0, 0, width, height);
    if (!width || !height) return;
    const c = Math.cos(yaw),
      s = Math.sin(yaw);
    const scale = Math.min(width / 16.8, height / 17.5);
    const cx = width * 0.51,
      cy = height * 0.52;
    const floating = Math.sin(clock * 0.00075) * 0.18;
    const project = ([x, y, z]) => ({
      x: cx + (x * c - z * s) * scale,
      y: cy + ((x * s + z * c) * 0.46 - (y + floating) * 0.88) * scale,
      depth: (x * s + z * c) * 0.88 + y * 0.46,
    });
    const glow = palettes[biome].glow;
    for (const star of stars) {
      const pulse = 0.25 + (Math.sin(clock * 0.001 + star.phase) + 1) * 0.2;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = glow;
      ctx.fillRect(
        width * (0.5 + star.x),
        height * (0.45 + star.y) + Math.sin(clock * 0.0003 + star.phase) * 10,
        star.size,
        star.size,
      );
    }
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.translate(cx, cy + scale * 4.9);
    ctx.scale(1, 0.3);
    const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, scale * 6.8);
    halo.addColorStop(0, `${glow}24`);
    halo.addColorStop(0.6, `${glow}0d`);
    halo.addColorStop(1, `${glow}00`);
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, scale * 6.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `${glow}35`;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 8]);
    ctx.beginPath();
    ctx.ellipse(0, 0, scale * 6.3, scale * 6.3, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    const polygons = [];
    for (const face of faces) {
      const [nx, ny, nz] = face.normal;
      if ((nx * s + nz * c) * 0.88 + ny * 0.46 <= 0) continue;
      const t = Math.max(0, Math.min(1, (assembly - face.delay) / 1250));
      const offset = -Math.pow(1 - t, 3) * 11;
      const points = face.vertices.map(([x, y, z]) =>
        project([x, y + offset, z]),
      );
      polygons.push({
        points,
        color: face.color,
        alpha: Math.min(1, t * 3),
        depth: points.reduce((sum, p) => sum + p.depth, 0) / 4,
      });
    }
    polygons.sort((a, b) => a.depth - b.depth);
    for (const face of polygons) {
      ctx.globalAlpha = face.alpha;
      ctx.beginPath();
      face.points.forEach((point, i) =>
        i ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y),
      );
      ctx.closePath();
      ctx.fillStyle = face.color;
      ctx.fill();
      ctx.strokeStyle = "#050a151c";
      ctx.lineWidth = 0.55;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  function tick(now) {
    frameId = 0;
    if (paused || reduced.matches || !visible || document.hidden) return;
    if (now - lastFrame >= 32) {
      const delta = Math.min(60, now - (lastTime || now));
      lastTime = now;
      lastFrame = now;
      clock += delta;
      assembly += delta;
      if (!drag) yaw += delta * 0.000055;
      draw();
    }
    frameId = requestAnimationFrame(tick);
  }
  function schedule() {
    lastTime = 0;
    if (!frameId && !paused && !reduced.matches && visible && !document.hidden)
      frameId = requestAnimationFrame(tick);
    else if (paused || reduced.matches) {
      assembly = 2800;
      draw();
    }
  }
  canvas.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary) return;
    drag = { x: event.clientX, yaw };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!drag) return;
    yaw = drag.yaw + (event.clientX - drag.x) * 0.009;
    draw();
  });
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
    canvas.addEventListener(name, () => {
      drag = null;
    });
  document.querySelectorAll("[data-biome]").forEach((button) =>
    button.addEventListener("click", () => {
      if (!palettes[button.dataset.biome]) return;
      biome = button.dataset.biome;
      document.body.dataset.biome = biome;
      document
        .querySelectorAll("[data-biome]")
        .forEach((item) =>
          item.setAttribute("aria-pressed", String(item === button)),
        );
      build();
      schedule();
      draw();
    }),
  );
  document.addEventListener("curse-motion", (event) => {
    paused = event.detail.paused;
    schedule();
  });
  document.addEventListener("visibilitychange", schedule);
  reduced.addEventListener("change", schedule);
  new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      schedule();
    },
    { rootMargin: "100px" },
  ).observe(canvas);
  new ResizeObserver(resize).observe(canvas);
  build();
  resize();
  schedule();
})();
