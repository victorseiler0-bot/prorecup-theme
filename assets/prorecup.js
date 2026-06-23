/* ============================================================
   PRORECUP — Main JS
   Three.js 3D Pro + Scroll FX + Cursor + Parallax
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initCursor();
  initNav();
  initReveal();
  initParallax();
  initHero3D();
  initCounters();
});

/* ── Custom Cursor ── */
function initCursor() {
  const cursor = document.getElementById('cursor');
  const cursorRing = document.getElementById('cursor-ring');
  if (!cursor) return;

  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top = my + 'px';
  });

  if (cursorRing) {
    function lerp(a, b, t) { return a + (b - a) * t; }
    function animRing() {
      rx = lerp(rx, mx, 0.12);
      ry = lerp(ry, my, 0.12);
      cursorRing.style.left = rx + 'px';
      cursorRing.style.top = ry + 'px';
      requestAnimationFrame(animRing);
    }
    animRing();
  }

  document.querySelectorAll('a, button, .feature-card, .buy-cta').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('hover');
      if (cursorRing) cursorRing.classList.add('hover');
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('hover');
      if (cursorRing) cursorRing.classList.remove('hover');
    });
  });
}

/* ── Nav ── */
function initNav() {
  const header = document.getElementById('site-header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

/* ── Reveal on scroll ── */
function initReveal() {
  const items = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), entry.target.dataset.delay || 0);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  items.forEach((el, i) => {
    el.dataset.delay = (i % 4) * 80;
    io.observe(el);
  });
}

/* ── Parallax hero ── */
function initParallax() {
  const heroContent = document.querySelector('.hero-content');
  const heroBg = document.querySelector('.hero-bg-gradient');
  if (!heroContent) return;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    heroContent.style.transform = `translateY(${y * 0.25}px)`;
    heroContent.style.opacity = 1 - y / 500;
    if (heroBg) heroBg.style.transform = `translateY(${y * 0.1}px)`;
  }, { passive: true });
}

/* ── Animated counters ── */
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = +el.dataset.count;
      const suffix = el.dataset.suffix || '';
      let start = 0;
      const dur = 1800;
      const step = timestamp => {
        if (!start) start = timestamp;
        const p = Math.min((timestamp - start) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.floor(ease * target) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => io.observe(c));
}

/* ================================================================
   THREE.JS — Professional Massage Gun 3D Model
   ================================================================ */

function initHero3D() {
  const canvas = document.getElementById('three-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const container = canvas.parentElement;
  let W = container.clientWidth;
  let H = container.clientHeight;

  /* ── Renderer ── */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  /* ── Scene & Camera ── */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, W / H, 0.1, 100);
  camera.position.set(0, 0.6, 6.5);

  /* ── Lights ── */
  // Key light — warm top left
  const keyLight = new THREE.DirectionalLight(0xfff5e0, 2.2);
  keyLight.position.set(4, 6, 4);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 30;
  scene.add(keyLight);

  // Fill light — cool blue left
  const fillLight = new THREE.DirectionalLight(0x7090ff, 0.6);
  fillLight.position.set(-5, 1, 3);
  scene.add(fillLight);

  // Rim light — bright back right
  const rimLight = new THREE.DirectionalLight(0xffffff, 1.4);
  rimLight.position.set(2, -2, -5);
  scene.add(rimLight);

  // Ambient
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));

  // Ground bounce
  const bounceLight = new THREE.PointLight(0x4040ff, 0.3, 10);
  bounceLight.position.set(0, -3, 2);
  scene.add(bounceLight);

  /* ── Materials ── */
  const matBlackMatte = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a, metalness: 0.7, roughness: 0.25
  });
  const matBlackGloss = new THREE.MeshStandardMaterial({
    color: 0x080808, metalness: 0.9, roughness: 0.05
  });
  const matDarkGrey = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a, metalness: 0.5, roughness: 0.5
  });
  const matMidGrey = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a, metalness: 0.4, roughness: 0.6
  });
  const matWhite = new THREE.MeshStandardMaterial({
    color: 0xf0f0f0, metalness: 0.1, roughness: 0.4
  });
  const matOrange = new THREE.MeshStandardMaterial({
    color: 0xff6600, metalness: 0.2, roughness: 0.4,
    emissive: 0xff4400, emissiveIntensity: 0.3
  });
  const matScreen = new THREE.MeshStandardMaterial({
    color: 0x001122, metalness: 0.0, roughness: 0.0,
    emissive: 0x003366, emissiveIntensity: 0.8
  });
  const matLED = new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: 0x88aaff, emissiveIntensity: 1.5,
    metalness: 0, roughness: 0.3
  });
  const matRubber = new THREE.MeshStandardMaterial({
    color: 0x151515, metalness: 0.0, roughness: 0.9
  });

  /* ── Gun Group ── */
  const gun = new THREE.Group();

  // ── MAIN BODY (horizontal arm) ──
  // Front cylinder (motor housing)
  const motorGeo = new THREE.CylinderGeometry(0.32, 0.30, 1.6, 48);
  const motor = new THREE.Mesh(motorGeo, matBlackMatte);
  motor.rotation.z = Math.PI / 2;
  motor.position.set(0.3, 0, 0);
  gun.add(motor);

  // Front cone (nose)
  const noseGeo = new THREE.CylinderGeometry(0.20, 0.32, 0.25, 48);
  const nose = new THREE.Mesh(noseGeo, matDarkGrey);
  nose.rotation.z = Math.PI / 2;
  nose.position.set(1.2, 0, 0);
  gun.add(nose);

  // Front cap (flat)
  const frontCapGeo = new THREE.CylinderGeometry(0.20, 0.20, 0.06, 48);
  const frontCap = new THREE.Mesh(frontCapGeo, matDarkGrey);
  frontCap.rotation.z = Math.PI / 2;
  frontCap.position.set(1.35, 0, 0);
  gun.add(frontCap);

  // Attachment socket (inner ring)
  const socketGeo = new THREE.TorusGeometry(0.12, 0.025, 16, 48);
  const socket = new THREE.Mesh(socketGeo, matMidGrey);
  socket.rotation.y = Math.PI / 2;
  socket.position.set(1.42, 0, 0);
  gun.add(socket);

  // Back body (slightly wider — battery area)
  const backGeo = new THREE.CylinderGeometry(0.30, 0.28, 0.5, 48);
  const back = new THREE.Mesh(backGeo, matBlackMatte);
  back.rotation.z = Math.PI / 2;
  back.position.set(-0.85, 0, 0);
  gun.add(back);

  // Back cap
  const backCapGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.08, 48);
  const backCap = new THREE.Mesh(backCapGeo, matDarkGrey);
  backCap.rotation.z = Math.PI / 2;
  backCap.position.set(-1.14, 0, 0);
  gun.add(backCap);

  // Seam ring between body and back
  const seamGeo = new THREE.TorusGeometry(0.305, 0.012, 12, 64);
  const seam = new THREE.Mesh(seamGeo, matDarkGrey);
  seam.rotation.y = Math.PI / 2;
  seam.position.set(-0.58, 0, 0);
  gun.add(seam);

  // ── HANDLE ──
  // Handle upper (connects to body)
  const handleTopGeo = new THREE.CylinderGeometry(0.22, 0.20, 0.35, 32);
  const handleTop = new THREE.Mesh(handleTopGeo, matBlackMatte);
  handleTop.position.set(-0.15, -0.47, 0);
  gun.add(handleTop);

  // Handle main grip
  const handleGeo = new THREE.CylinderGeometry(0.19, 0.17, 0.9, 32);
  const handle = new THREE.Mesh(handleGeo, matRubber);
  handle.position.set(-0.15, -1.07, 0);
  gun.add(handle);

  // Handle bottom (tapered)
  const handleBotGeo = new THREE.CylinderGeometry(0.17, 0.15, 0.2, 32);
  const handleBot = new THREE.Mesh(handleBotGeo, matDarkGrey);
  handleBot.position.set(-0.15, -1.62, 0);
  gun.add(handleBot);

  // Handle end cap (rounded)
  const endCapGeo = new THREE.SphereGeometry(0.15, 32, 16, 0, Math.PI * 2, 0, Math.PI);
  const endCap = new THREE.Mesh(endCapGeo, matBlackGloss);
  endCap.position.set(-0.15, -1.72, 0);
  gun.add(endCap);

  // ── GRIP TEXTURE RINGS ──
  for (let i = 0; i < 8; i++) {
    const gripGeo = new THREE.TorusGeometry(0.195, 0.007, 8, 48);
    const grip = new THREE.Mesh(gripGeo, matDarkGrey);
    grip.position.set(-0.15, -0.68 + i * 0.1, 0);
    gun.add(grip);
  }

  // ── LCD SCREEN ──
  const screenBezelGeo = new THREE.BoxGeometry(0.28, 0.18, 0.04);
  const screenBezel = new THREE.Mesh(screenBezelGeo, matDarkGrey);
  screenBezel.position.set(0.2, 0.33, 0);
  screenBezel.rotation.z = -0.08;
  gun.add(screenBezel);

  const screenGeo = new THREE.BoxGeometry(0.22, 0.12, 0.02);
  const screen = new THREE.Mesh(screenGeo, matScreen);
  screen.position.set(0.2, 0.33, 0.022);
  screen.rotation.z = -0.08;
  gun.add(screen);

  // Screen glow plane (fake bloom)
  const glowGeo = new THREE.PlaneGeometry(0.3, 0.2);
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0x0044ff, transparent: true, opacity: 0.08,
    emissive: 0x0044ff, emissiveIntensity: 1, side: THREE.DoubleSide
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.set(0.2, 0.33, 0.06);
  glow.rotation.z = -0.08;
  gun.add(glow);

  // ── POWER BUTTON ──
  const btnGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.04, 24);
  const btn = new THREE.Mesh(btnGeo, matBlackGloss);
  btn.rotation.x = Math.PI / 2;
  btn.position.set(0.2, 0.33, -0.325);
  gun.add(btn);

  // Button ring LED
  const btnRingGeo = new THREE.TorusGeometry(0.06, 0.008, 8, 32);
  const btnRing = new THREE.Mesh(btnRingGeo, matOrange);
  btnRing.rotation.x = Math.PI / 2;
  btnRing.position.set(0.2, 0.33, -0.31);
  gun.add(btnRing);

  // ── SPEED INDICATOR DOTS (side) ──
  const dotColors = [0x00ff88, 0x00ff88, 0xffaa00, 0xffaa00, 0xff4400];
  for (let i = 0; i < 5; i++) {
    const dotGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.02, 16);
    const dotMat = new THREE.MeshStandardMaterial({
      color: dotColors[i], emissive: dotColors[i], emissiveIntensity: 1.2,
      metalness: 0, roughness: 0.3
    });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.rotation.x = Math.PI / 2;
    dot.position.set(-0.35 + i * 0.18, 0.34, -0.315);
    gun.add(dot);
  }

  // ── VENTILATION SLOTS ──
  for (let i = 0; i < 8; i++) {
    const slotGeo = new THREE.BoxGeometry(0.06, 0.008, 0.04);
    const slot = new THREE.Mesh(slotGeo, matMidGrey);
    const angle = (i / 8) * Math.PI * 2 + 0.4;
    slot.position.set(
      -0.85,
      Math.sin(angle) * 0.28,
      Math.cos(angle) * 0.28
    );
    slot.rotation.z = angle;
    gun.add(slot);
  }

  // ── USB-C PORT ──
  const usbGeo = new THREE.BoxGeometry(0.1, 0.035, 0.025);
  const usb = new THREE.Mesh(usbGeo, new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 1 }));
  usb.position.set(-0.15, -1.61, 0.17);
  gun.add(usb);

  // USB port rim
  const usbRimGeo = new THREE.BoxGeometry(0.115, 0.05, 0.015);
  const usbRim = new THREE.Mesh(usbRimGeo, matMidGrey);
  usbRim.position.set(-0.15, -1.61, 0.183);
  gun.add(usbRim);

  // ── ATTACHMENT HEAD — Professional ball ──
  // Stem
  const stemGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.22, 24);
  const stem = new THREE.Mesh(stemGeo, matDarkGrey);
  stem.rotation.z = Math.PI / 2;
  stem.position.set(1.565, 0, 0);
  gun.add(stem);

  // Ball head
  const ballGeo = new THREE.SphereGeometry(0.195, 48, 48);
  const ball = new THREE.Mesh(ballGeo, matWhite);
  ball.position.set(1.78, 0, 0);
  gun.add(ball);

  // Ball equator seam
  const ballSeamGeo = new THREE.TorusGeometry(0.195, 0.006, 8, 64);
  const ballSeam = new THREE.Mesh(ballSeamGeo, matDarkGrey);
  ballSeam.rotation.y = Math.PI / 2;
  ballSeam.position.set(1.78, 0, 0);
  gun.add(ballSeam);

  // ── LOGO ENGRAVING ──
  const logoPlaneGeo = new THREE.PlaneGeometry(0.38, 0.07);
  const logoMat = new THREE.MeshStandardMaterial({
    color: 0x222222, metalness: 0.3, roughness: 0.8
  });
  const logoPlane = new THREE.Mesh(logoPlaneGeo, logoMat);
  logoPlane.position.set(0.1, 0, 0.325);
  gun.add(logoPlane);

  // ── CABLE GROOVE (decorative line on handle junction) ──
  const grooveGeo = new THREE.TorusGeometry(0.225, 0.01, 8, 48);
  const groove = new THREE.Mesh(grooveGeo, matDarkGrey);
  groove.position.set(-0.15, -0.285, 0);
  gun.add(groove);

  // Position entire gun
  gun.position.set(-0.2, 0.15, 0);
  gun.rotation.y = 0.3;
  gun.rotation.x = 0.1;
  scene.add(gun);

  /* ── Shadow plane ── */
  const shadowGeo = new THREE.PlaneGeometry(8, 8);
  const shadowMat = new THREE.ShadowMaterial({ opacity: 0.25 });
  const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -2.2;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  /* ── Drag & rotation ── */
  let isDragging = false;
  let prevX = 0, prevY = 0;
  let rotY = 0.3, rotX = 0.1;
  let velY = 0.004, velX = 0;
  let autoRotate = true;

  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    autoRotate = false;
    prevX = e.clientX; prevY = e.clientY;
    velY = 0; velX = 0;
  });
  window.addEventListener('mouseup', () => { isDragging = false; });
  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = (e.clientX - prevX) * 0.007;
    const dy = (e.clientY - prevY) * 0.003;
    velY = dx * 0.5; velX = dy * 0.5;
    rotY += dx; rotX += dy;
    rotX = Math.max(-0.6, Math.min(0.6, rotX));
    prevX = e.clientX; prevY = e.clientY;
  });

  canvas.addEventListener('touchstart', e => {
    isDragging = true; autoRotate = false;
    prevX = e.touches[0].clientX; prevY = e.touches[0].clientY;
  }, { passive: true });
  window.addEventListener('touchend', () => { isDragging = false; });
  window.addEventListener('touchmove', e => {
    if (!isDragging) return;
    const dx = (e.touches[0].clientX - prevX) * 0.007;
    const dy = (e.touches[0].clientY - prevY) * 0.003;
    velY = dx * 0.5; rotY += dx; rotX += dy;
    rotX = Math.max(-0.6, Math.min(0.6, rotX));
    prevX = e.touches[0].clientX; prevY = e.touches[0].clientY;
  }, { passive: true });

  /* ── Animate ── */
  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.016;

    if (!isDragging) {
      if (autoRotate) velY = 0.006;
      velY *= 0.94;
      velX *= 0.92;
      rotY += velY;
      rotX += velX;
    }

    gun.rotation.y = rotY;
    gun.rotation.x = rotX;
    gun.position.y = 0.15 + Math.sin(t * 0.7) * 0.07;

    // Pulse LED glow
    const pulse = 0.3 + Math.sin(t * 2.5) * 0.15;
    if (btnRing.material) btnRing.material.emissiveIntensity = pulse + 0.1;
    if (glow.material) glow.material.opacity = 0.05 + pulse * 0.06;

    renderer.render(scene, camera);
  }
  animate();

  /* ── Resize ── */
  window.addEventListener('resize', () => {
    W = container.clientWidth;
    H = container.clientHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  });
}
