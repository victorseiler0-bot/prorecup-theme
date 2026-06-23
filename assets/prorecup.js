/* ============================================================
   PRORECUP — Main JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initScrollProgress();
  initCursor();
  initNav();
  initReveal();
  initParallax();
  initCounters();
  initGallery();
});

/* ── Gallery carousel ── */
function initGallery() {
  const gallery = document.querySelector('.product-gallery');
  if (!gallery) return;

  const slides = gallery.querySelectorAll('.gallery-slide');
  const dots   = gallery.querySelectorAll('.gallery-dot');
  let current  = 0;
  let timer;

  function goTo(n) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (n + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }

  function autoPlay() {
    timer = setInterval(() => goTo(current + 1), 4000);
  }

  gallery.querySelector('.gallery-prev').addEventListener('click', () => { clearInterval(timer); goTo(current - 1); autoPlay(); });
  gallery.querySelector('.gallery-next').addEventListener('click', () => { clearInterval(timer); goTo(current + 1); autoPlay(); });
  dots.forEach(d => d.addEventListener('click', () => { clearInterval(timer); goTo(parseInt(d.dataset.index)); autoPlay(); }));

  autoPlay();
}

window.addEventListener('load', () => {
  initHero3D();
});

/* ── Scroll Progress ── */
function initScrollProgress() {
  const bar = document.createElement('div');
  bar.id = 'scroll-progress';
  document.body.prepend(bar);
  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${window.scrollY / max})`;
  }, { passive: true });
}

/* ── Cursor ── */
function initCursor() {
  const dot = document.getElementById('cursor');
  if (!dot) return;

  document.addEventListener('mousemove', e => {
    dot.style.left = e.clientX + 'px';
    dot.style.top  = e.clientY + 'px';
  }, { passive: true });

  document.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('mouseenter', () => dot.classList.add('hover'));
    el.addEventListener('mouseleave', () => dot.classList.remove('hover'));
  });
}

/* ── Nav ── */
function initNav() {
  const h = document.getElementById('site-header');
  if (!h) return;
  window.addEventListener('scroll', () => h.classList.toggle('scrolled', window.scrollY > 60), { passive: true });
}

/* ── Reveal ── */
function initReveal() {
  const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const delay = parseInt(e.target.dataset.delay || 0);
      setTimeout(() => e.target.classList.add('visible'), delay);
      io.unobserve(e.target);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -60px 0px' });
  els.forEach((el, i) => {
    el.dataset.delay = (i % 4) * 160;
    io.observe(el);
  });
}

/* ── Parallax ── */
function initParallax() {
  const content = document.querySelector('.hero-content');
  if (!content) return;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    content.style.transform = `translateY(${y * 0.07}px)`;
    content.style.opacity = Math.max(0, 1 - y / 1100);
  }, { passive: true });
}

/* ── Counters ── */
function initCounters() {
  const els = document.querySelectorAll('[data-count]');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseFloat(el.dataset.count);
      const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      let start = null;
      const dur = 1600;
      (function step(ts) {
        if (!start) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        const val = ease * target;
        el.textContent = prefix + val.toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(step);
      })(performance.now());
      io.unobserve(el);
    });
  }, { threshold: 0.4 });
  els.forEach(el => io.observe(el));
}

/* ================================================================
   THREE.JS — Massage Gun 3D (basé sur photo produit)
   Forme exacte : corps horizontal + manche vertical + tête ball
   ================================================================ */

function initHero3D() {
  const canvas = document.getElementById('three-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const wrap = canvas.parentElement;
  let W = wrap.clientWidth  || Math.round(window.innerWidth * 0.5);
  let H = wrap.clientHeight || window.innerHeight;

  /* Renderer */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setClearColor(0x060608, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 2.2;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 50);
  camera.position.set(0, 0.3, 7);

  /* ── Éclairage ── */
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));

  // Key light haut-gauche chaud
  const key = new THREE.DirectionalLight(0xfff4e0, 3.5);
  key.position.set(-4, 5, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  scene.add(key);

  // Fill bleu froid droite
  const fill = new THREE.DirectionalLight(0x8ab0ff, 1.2);
  fill.position.set(5, 0, 3);
  scene.add(fill);

  // Rim arrière
  const rim = new THREE.DirectionalLight(0xffffff, 2.2);
  rim.position.set(1, -1, -6);
  scene.add(rim);

  // Bounce sol
  scene.add(Object.assign(new THREE.PointLight(0x2040aa, 0.4, 12), { position: new THREE.Vector3(0, -4, 1) }));

  // Lumière frontale (caméra) — garantit la visibilité sans env map
  const front = new THREE.PointLight(0xffffff, 2.5, 25);
  front.position.set(0, 0.3, 8);
  scene.add(front);

  /* ── Matériaux ── */
  const matte   = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.12, roughness: 0.55 });
  const satin   = new THREE.MeshStandardMaterial({ color: 0x636363, metalness: 0.22, roughness: 0.22 });
  const dark    = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.08, roughness: 0.65 });
  const rubber  = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.0,  roughness: 0.96 });
  const gloss   = new THREE.MeshStandardMaterial({ color: 0x585858, metalness: 0.28, roughness: 0.04 });
  const screen  = new THREE.MeshStandardMaterial({ color: 0x001830, metalness: 0, roughness: 0, emissive: 0x0033aa, emissiveIntensity: 2.0 });
  const ledGreen= new THREE.MeshStandardMaterial({ color: 0x22ff88, emissive: 0x22ff88, emissiveIntensity: 3.0, metalness: 0, roughness: 0.2 });
  const accent  = new THREE.MeshStandardMaterial({ color: 0x424242, metalness: 0.15, roughness: 0.5 });

  const gun = new THREE.Group();

  /* ── CORPS PRINCIPAL (cylindre horizontal) ── */
  // Corps central
  const bodyGeo = new THREE.CylinderGeometry(0.30, 0.30, 1.55, 64);
  const body = new THREE.Mesh(bodyGeo, satin);
  body.rotation.z = Math.PI / 2;
  body.position.set(0.1, 0, 0);
  body.castShadow = true;
  gun.add(body);

  // Tête avant (légèrement évasée — zone moteur)
  const motorGeo = new THREE.CylinderGeometry(0.305, 0.28, 0.45, 64);
  const motor = new THREE.Mesh(motorGeo, matte);
  motor.rotation.z = Math.PI / 2;
  motor.position.set(0.985, 0, 0);
  gun.add(motor);

  // Nez avant (cône)
  const noseGeo = new THREE.CylinderGeometry(0.19, 0.305, 0.22, 64);
  const nose = new THREE.Mesh(noseGeo, dark);
  nose.rotation.z = Math.PI / 2;
  nose.position.set(1.315, 0, 0);
  gun.add(nose);

  // Collerette avant
  const collarGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.055, 48);
  const collar = new THREE.Mesh(collarGeo, accent);
  collar.rotation.z = Math.PI / 2;
  collar.position.set(1.44, 0, 0);
  gun.add(collar);

  // Queue arrière (légèrement plus petite)
  const tailGeo = new THREE.CylinderGeometry(0.27, 0.265, 0.4, 64);
  const tail = new THREE.Mesh(tailGeo, dark);
  tail.rotation.z = Math.PI / 2;
  tail.position.set(-0.88, 0, 0);
  gun.add(tail);

  // Capuchon arrière arrondi
  const backDomeGeo = new THREE.SphereGeometry(0.265, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
  const backDome = new THREE.Mesh(backDomeGeo, gloss);
  backDome.rotation.z = Math.PI / 2;
  backDome.position.set(-1.08, 0, 0);
  gun.add(backDome);

  // Jointure corps/queue (groove)
  const groove1 = new THREE.Mesh(new THREE.TorusGeometry(0.305, 0.009, 8, 64), accent);
  groove1.rotation.y = Math.PI / 2;
  groove1.position.set(-0.64, 0, 0);
  gun.add(groove1);

  /* ── ÉCRAN LCD (sur dessus du corps) ── */
  const screenBzl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.185, 0.038), dark);
  screenBzl.position.set(0.05, 0.31, 0);
  screenBzl.rotation.z = -0.04;
  gun.add(screenBzl);

  const screenMesh = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.13, 0.022), screen);
  screenMesh.position.set(0.05, 0.31, 0.022);
  screenMesh.rotation.z = -0.04;
  gun.add(screenMesh);

  // Chiffres LCD simulés (3 rectangles lumineux)
  for (let i = 0; i < 3; i++) {
    const digit = new THREE.Mesh(
      new THREE.BoxGeometry(0.052, 0.09, 0.005),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xaaccff, emissiveIntensity: 1.5, metalness: 0, roughness: 0.2 })
    );
    digit.position.set(-0.04 + i * 0.07, 0.315, 0.036);
    digit.rotation.z = -0.04;
    gun.add(digit);
  }

  /* ── BOUTON POWER ── */
  const btnGeo = new THREE.CylinderGeometry(0.052, 0.052, 0.032, 32);
  const btn = new THREE.Mesh(btnGeo, gloss);
  btn.rotation.x = Math.PI / 2;
  btn.position.set(0.05, 0.31, -0.312);
  gun.add(btn);

  const btnRingGeo = new THREE.TorusGeometry(0.058, 0.006, 8, 32);
  const btnRing = new THREE.Mesh(btnRingGeo, ledGreen);
  btnRing.rotation.x = Math.PI / 2;
  btnRing.position.set(0.05, 0.31, -0.298);
  gun.add(btnRing);

  /* ── INDICATEURS DE VITESSE (3 points LED) ── */
  const ledColors = [0x22ff88, 0x22ff88, 0xffaa22];
  for (let i = 0; i < 3; i++) {
    const ledMat = new THREE.MeshStandardMaterial({
      color: ledColors[i], emissive: ledColors[i], emissiveIntensity: 2.0, metalness: 0, roughness: 0.2
    });
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.014, 16, 16), ledMat);
    led.position.set(-0.1 + i * 0.1, 0.315, -0.308);
    gun.add(led);
  }

  /* ── FENTES DE VENTILATION (corps arrière) ── */
  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI * 2;
    const slot = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.01, 0.032),
      new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 1 })
    );
    slot.position.set(-0.7, Math.sin(angle) * 0.265, Math.cos(angle) * 0.265);
    slot.rotation.z = angle;
    gun.add(slot);
  }

  /* ── MANCHE (cylindre vertical) ── */
  // Jonction corps-manche
  const junctionGeo = new THREE.CylinderGeometry(0.225, 0.21, 0.32, 32);
  const junction = new THREE.Mesh(junctionGeo, matte);
  junction.position.set(-0.08, -0.43, 0);
  gun.add(junction);

  // Corps manche (grip rubber)
  const gripGeo = new THREE.CylinderGeometry(0.185, 0.165, 0.92, 32);
  const grip = new THREE.Mesh(gripGeo, rubber);
  grip.position.set(-0.08, -1.03, 0);
  gun.add(grip);

  // Rainures de grip
  for (let i = 0; i < 9; i++) {
    const rg = new THREE.Mesh(new THREE.TorusGeometry(0.188, 0.006, 8, 48), accent);
    rg.position.set(-0.08, -0.62 + i * 0.09, 0);
    gun.add(rg);
  }

  // Bas du manche (évasé)
  const baseGeo = new THREE.CylinderGeometry(0.165, 0.155, 0.14, 32);
  const base = new THREE.Mesh(baseGeo, dark);
  base.position.set(-0.08, -1.55, 0);
  gun.add(base);

  // Capuchon bas arrondi
  const baseDome = new THREE.Mesh(new THREE.SphereGeometry(0.155, 32, 16, 0, Math.PI * 2, 0, Math.PI), gloss);
  baseDome.position.set(-0.08, -1.62, 0);
  gun.add(baseDome);

  // Port USB-C
  const usbHole = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.03, 0.018), new THREE.MeshStandardMaterial({ color: 0x010101, roughness: 1 }));
  usbHole.position.set(-0.08, -1.5, 0.168);
  gun.add(usbHole);

  const usbFrame = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.042, 0.012), accent);
  usbFrame.position.set(-0.08, -1.5, 0.178);
  gun.add(usbFrame);

  /* ── TIGE DE L'ACCESSOIRE ── */
  const stemGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.20, 24);
  const stemMesh = new THREE.Mesh(stemGeo, accent);
  stemMesh.rotation.z = Math.PI / 2;
  stemMesh.position.set(1.57, 0, 0);
  gun.add(stemMesh);

  /* ── TÊTE BALL (sphère — identique à la photo) ── */
  const ballGeo = new THREE.SphereGeometry(0.215, 64, 64);
  const ballMat = new THREE.MeshStandardMaterial({ color: 0x505050, metalness: 0.15, roughness: 0.4 });
  const ball = new THREE.Mesh(ballGeo, ballMat);
  ball.position.set(1.82, 0, 0);
  ball.castShadow = true;
  gun.add(ball);

  // Équateur de la balle
  const ballSeam = new THREE.Mesh(new THREE.TorusGeometry(0.215, 0.005, 8, 64), accent);
  ballSeam.rotation.y = Math.PI / 2;
  ballSeam.position.set(1.82, 0, 0);
  gun.add(ballSeam);

  // Flat au fond de la balle (socket)
  const socketGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.025, 24);
  const socket = new THREE.Mesh(socketGeo, dark);
  socket.rotation.z = Math.PI / 2;
  socket.position.set(1.605, 0, 0);
  gun.add(socket);

  /* ── OMBRE AU SOL ── */
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.ShadowMaterial({ opacity: 0.3 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -2.4;
  shadow.receiveShadow = true;
  scene.add(shadow);

  /* Orientation initiale */
  gun.rotation.y = 0.45;
  gun.rotation.x = 0.08;
  gun.position.set(-0.15, 0.1, 0);
  scene.add(gun);

  /* ── Drag & auto-rotation ── */
  let drag = false, px = 0, py = 0, vy = 0.005, vx = 0, autoRot = true;

  canvas.addEventListener('mousedown', e => { drag = true; autoRot = false; px = e.clientX; py = e.clientY; vy = vx = 0; });
  window.addEventListener('mouseup',   () => { drag = false; });
  window.addEventListener('mousemove', e => {
    if (!drag) return;
    const dx = (e.clientX - px) * 0.007, dy = (e.clientY - py) * 0.003;
    vy = dx * 0.6; vx = dy * 0.4;
    gun.rotation.y += dx;
    gun.rotation.x = Math.max(-0.55, Math.min(0.55, gun.rotation.x + dy));
    px = e.clientX; py = e.clientY;
  });
  canvas.addEventListener('touchstart', e => { drag = true; autoRot = false; px = e.touches[0].clientX; py = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchend',   () => { drag = false; });
  window.addEventListener('touchmove',  e => {
    if (!drag) return;
    const dx = (e.touches[0].clientX - px) * 0.007;
    vy = dx * 0.6;
    gun.rotation.y += dx;
    px = e.touches[0].clientX;
  }, { passive: true });

  /* ── Animation loop ── */
  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.015;

    if (!drag) {
      if (autoRot) vy = 0.005;
      vy *= 0.93; vx *= 0.90;
      gun.rotation.y += vy;
      gun.rotation.x += vx;
    }

    // Float subtil
    gun.position.y = 0.1 + Math.sin(t * 0.65) * 0.07;

    // Pulse LED
    if (btnRing.material) btnRing.material.emissiveIntensity = 1.8 + Math.sin(t * 2.2) * 0.7;

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    W = wrap.clientWidth; H = wrap.clientHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  });
}
