/* =========================================================
   Iglesia Cuadrangular Galilea · pantalla de bienvenida
   con fuegos artificiales
   ========================================================= */

// Año en el pie de página
document.getElementById("y").textContent = new Date().getFullYear();

const welcome = document.getElementById("welcome");
const welcomeBtn = document.getElementById("welcome-btn");
const canvas = document.getElementById("fireworks");
const ctx = canvas.getContext("2d");

// Colores: azules de la web, blanco, dorado y los del emblema del logo
const COLORS = ["#6fa3fa", "#a9c6ff", "#2f5fe0", "#ffffff", "#ffd36b", "#ffb400", "#ff1f8e", "#e8141b"];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let width, height, dpr;
let rockets = [];
let sparks = [];
let running = true;
let lastLaunch = 0;
let frameId;

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

const rand = (min, max) => Math.random() * (max - min) + min;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

// Cohete que sube y explota
const GRAVITY = 0.12;

function launch() {
  const x = rand(width * 0.1, width * 0.9);
  // En pantallas verticales (celular) explotan arriba y abajo de la tarjeta
  const portrait = height > width * 1.2;
  const targetY = portrait && Math.random() < 0.4
    ? rand(height * 0.8, height * 0.92)
    : rand(height * 0.05, height * (portrait ? 0.2 : 0.26));
  // Velocidad justa para llegar a la altura de explosión
  const vy = -Math.sqrt(2 * GRAVITY * (height - targetY)) * rand(1.02, 1.08);
  rockets.push({
    x,
    y: height,
    vx: rand(-0.6, 0.6),
    vy,
    targetY,
    color: pick(COLORS),
  });
}

// Explosión en chispas
function explode(x, y, color) {
  const count = Math.floor(rand(60, 100));
  const second = Math.random() < 0.4 ? pick(COLORS) : color;
  const power = rand(3, 6);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = power * rand(0.5, 1);
    sparks.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: rand(0.011, 0.02),
      color: i % 2 ? color : second,
      size: rand(1.4, 2.6),
    });
  }
}

function draw(time) {
  // Deja una estela suave borrando con transparencia
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "lighter";

  if (running && time - lastLaunch > rand(350, 750)) {
    launch();
    if (Math.random() < 0.35) launch();
    lastLaunch = time;
  }

  rockets = rockets.filter(r => {
    r.x += r.vx;
    r.y += r.vy;
    r.vy += GRAVITY;
    ctx.beginPath();
    ctx.arc(r.x, r.y, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = r.color;
    ctx.fill();
    if (r.y <= r.targetY || r.vy >= 0) {
      explode(r.x, r.y, r.color);
      return false;
    }
    return true;
  });

  sparks = sparks.filter(p => {
    p.vx *= 0.97;
    p.vy = p.vy * 0.97 + 0.05; // gravedad
    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;
    if (p.life <= 0) return false;
    ctx.globalAlpha = p.life;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.globalAlpha = 1;
    return true;
  });

  if (running || rockets.length || sparks.length) {
    frameId = requestAnimationFrame(draw);
  }
}

// Cerrar la bienvenida y mostrar la página
function enter() {
  running = false;
  welcome.classList.add("closing");
  document.body.classList.remove("welcome-open");
  setTimeout(() => {
    welcome.hidden = true;
    cancelAnimationFrame(frameId);
    window.removeEventListener("resize", resize);
  }, 700);
}

welcomeBtn.addEventListener("click", enter);
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !welcome.hidden) enter();
});

if (!reduceMotion) {
  resize();
  window.addEventListener("resize", resize);
  // Primera ráfaga al abrir
  for (let i = 0; i < 3; i++) setTimeout(launch, i * 250);
  frameId = requestAnimationFrame(draw);
}
