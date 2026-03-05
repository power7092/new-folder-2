(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const speedEl = document.getElementById("speed");
  const touchZone = document.getElementById("touchZone");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayText = document.getElementById("overlayText");
  const startBtn = document.getElementById("startBtn");

  const width = canvas.width;
  const height = canvas.height;
  const lanePadding = 44;

  const state = {
    running: false,
    lastTs: 0,
    score: 0,
    best: Number(localStorage.getItem("neon-best") || 0),
    spawnTimer: 0,
    spawnInterval: 860,
    speedFactor: 1,
    pointerDown: false,
    keys: { left: false, right: false },
    player: {
      x: width / 2,
      y: height - 72,
      r: 20,
      speed: 380,
    },
    blocks: [],
  };

  bestEl.textContent = state.best.toString();

  function reset() {
    state.running = true;
    state.lastTs = 0;
    state.score = 0;
    state.spawnTimer = 0;
    state.spawnInterval = 860;
    state.speedFactor = 1;
    state.blocks = [];
    state.player.x = width / 2;
    scoreEl.textContent = "0";
    speedEl.textContent = "1.0x";
    overlay.classList.add("hidden");
    requestAnimationFrame(loop);
  }

  function gameOver() {
    state.running = false;

    if (state.score > state.best) {
      state.best = Math.floor(state.score);
      localStorage.setItem("neon-best", String(state.best));
      bestEl.textContent = state.best.toString();
    }

    overlayTitle.textContent = "Game Over";
    overlayText.textContent = `Score ${Math.floor(state.score)} | Best ${state.best}`;
    startBtn.textContent = "Play Again";
    overlay.classList.remove("hidden");
  }

  function spawnBlock() {
    const w = 38 + Math.random() * 70;
    const x = lanePadding + Math.random() * (width - lanePadding * 2 - w);
    const speed = 170 + Math.random() * 140;
    state.blocks.push({ x, y: -80, w, h: 26 + Math.random() * 28, speed });
  }

  function update(dt) {
    const move = (Number(state.keys.right) - Number(state.keys.left)) * state.player.speed * dt;
    state.player.x += move;
    state.player.x = Math.max(lanePadding, Math.min(width - lanePadding, state.player.x));

    state.spawnTimer += dt * 1000;
    const pace = Math.max(260, state.spawnInterval - state.score * 0.9);

    while (state.spawnTimer >= pace) {
      state.spawnTimer -= pace;
      spawnBlock();
    }

    state.speedFactor = 1 + Math.min(2.5, state.score / 420);
    speedEl.textContent = `${state.speedFactor.toFixed(1)}x`;

    for (const b of state.blocks) {
      b.y += b.speed * state.speedFactor * dt;
    }

    state.blocks = state.blocks.filter((b) => b.y < height + 60);

    for (const b of state.blocks) {
      if (circleRectHit(state.player.x, state.player.y, state.player.r, b.x, b.y, b.w, b.h)) {
        gameOver();
        return;
      }
    }

    state.score += 42 * dt;
    scoreEl.textContent = Math.floor(state.score).toString();
  }

  function circleRectHit(cx, cy, cr, rx, ry, rw, rh) {
    const nearestX = Math.max(rx, Math.min(cx, rx + rw));
    const nearestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    return dx * dx + dy * dy <= cr * cr;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#062349");
    sky.addColorStop(1, "#031126");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(36, 216, 255, 0.16)";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 12]);
    for (let i = 1; i <= 3; i += 1) {
      const x = (width / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.fillStyle = "#ff8f24";
    for (const b of state.blocks) {
      ctx.shadowColor = "rgba(255, 178, 48, 0.65)";
      ctx.shadowBlur = 12;
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }

    ctx.shadowColor = "rgba(36, 216, 255, 0.75)";
    ctx.shadowBlur = 14;
    ctx.fillStyle = "#24d8ff";
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, state.player.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  }

  function loop(ts) {
    if (!state.running) {
      return;
    }

    if (!state.lastTs) {
      state.lastTs = ts;
    }

    const dt = Math.min(0.034, (ts - state.lastTs) / 1000);
    state.lastTs = ts;

    update(dt);
    draw();

    if (state.running) {
      requestAnimationFrame(loop);
    }
  }

  function keyChange(isDown, key) {
    if (key === "ArrowLeft" || key.toLowerCase() === "a") {
      state.keys.left = isDown;
    }

    if (key === "ArrowRight" || key.toLowerCase() === "d") {
      state.keys.right = isDown;
    }
  }

  window.addEventListener("keydown", (e) => {
    keyChange(true, e.key);
  });

  window.addEventListener("keyup", (e) => {
    keyChange(false, e.key);
  });

  function movePlayerTo(clientX) {
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * width;
    state.player.x = Math.max(lanePadding, Math.min(width - lanePadding, x));
  }

  touchZone.addEventListener("pointerdown", (e) => {
    state.pointerDown = true;
    movePlayerTo(e.clientX);
  });

  touchZone.addEventListener("pointermove", (e) => {
    if (!state.pointerDown || !state.running) {
      return;
    }
    movePlayerTo(e.clientX);
  });

  window.addEventListener("pointerup", () => {
    state.pointerDown = false;
  });

  startBtn.addEventListener("click", () => {
    overlayTitle.textContent = "Neon Dodger";
    overlayText.textContent = "Move with Arrow keys, A/D, or drag on screen.";
    startBtn.textContent = "Start Game";
    reset();
  });

  draw();
})();
