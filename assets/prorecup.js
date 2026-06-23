/* ============================================================
   PRORECUP — Main JS
   Three.js 3D + Scroll animations + Cursor
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initCursor();
  initNav();
  initReveal();
  initHero3D();
});

/* ── Cursor ── */
function initCursor() {
  const cursor = document.getElementById('cursor');
  if (!cursor) return;

  let mx = 0, my = 0;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top = my + 'px';
  });

  document.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.width = '36px';
      cursor.style.height = '36px';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.width = '12px';
      cursor.style.height = '12px';
    });
  });
}

/* ── Nav scroll ── */
function initNav() {
  const header = document.getElementById('site-header');
  if (!header) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      header.classList.toggle('scrolled', !entry.isIntersecting);
    },
    { rootMargin: '-80px 0px 0px 0px' }
  );

  const hero = document.getElementById('hero');
  if (hero) observer.observe(hero);
}

/* ── Reveal on scroll ── */
function initReveal() {
  const items = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  items.forEach(el => observer.observe(el));
}

/* ── Three.js 3D Massage Gun ── */
function initHero3D() {
  const canvas = document.getElementById('three-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const container = canvas.parentElement;
  let w = container.clientWidth;
  let h = container.clientHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
  camera.position.set(0, 0.5, 5);

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
  keyLight.position.set(3, 4, 3);
  keyLight.castShadow = true;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x8888ff, 0.4);
  fillLight.position.set(-3, 0, 2);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
  rimLight.position.set(0, -3, -3);
  scene.add(rimLight);

  // Material — dark metallic
  const mat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.85,
    roughness: 0.15,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.6,
    roughness: 0.3,
  });

  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.4,
  });

  // Gun group
  const gun = new THREE.Group();

  // Main body (elongated cylinder - horizontal)
  const bodyGeo = new THREE.CylinderGeometry(0.28, 0.28, 1.8, 32);
  const body = new THREE.Mesh(bodyGeo, mat);
  body.rotation.z = Math.PI / 2;
  gun.add(body);

  // Front cap
  const frontCapGeo = new THREE.SphereGeometry(0.28, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const frontCap = new THREE.Mesh(frontCapGeo, mat);
  frontCap.rotation.z = -Math.PI / 2;
  frontCap.position.set(0.9, 0, 0);
  gun.add(frontCap);

  // Back cap
  const backCapGeo = new THREE.SphereGeometry(0.28, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const backCap = new THREE.Mesh(backCapGeo, mat);
  backCap.rotation.z = Math.PI / 2;
  backCap.position.set(-0.9, 0, 0);
  gun.add(backCap);

  // Handle (vertical cylinder)
  const handleGeo = new THREE.CylinderGeometry(0.18, 0.16, 1.1, 32);
  const handle = new THREE.Mesh(handleGeo, mat);
  handle.position.set(-0.1, -0.75, 0);
  gun.add(handle);

  // Handle bottom cap
  const handleCapGeo = new THREE.SphereGeometry(0.16, 32, 16);
  const handleCap = new THREE.Mesh(handleCapGeo, accentMat);
  handleCap.position.set(-0.1, -1.3, 0);
  gun.add(handleCap);

  // USB-C port detail on handle
  const portGeo = new THREE.BoxGeometry(0.12, 0.04, 0.02);
  const port = new THREE.Mesh(portGeo, new THREE.MeshStandardMaterial({ color: 0x000000 }));
  port.position.set(-0.1, -1.15, 0.165);
  gun.add(port);

  // Power button stripe on body
  const buttonGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.04, 24);
  const button = new THREE.Mesh(buttonGeo, whiteMat);
  button.rotation.z = Math.PI / 2;
  button.position.set(-0.3, 0.3, 0);
  gun.add(button);

  // Grip lines on handle
  for (let i = 0; i < 6; i++) {
    const lineGeo = new THREE.TorusGeometry(0.185, 0.008, 8, 32);
    const line = new THREE.Mesh(lineGeo, accentMat);
    line.position.set(-0.1, -0.55 + i * 0.12, 0);
    gun.add(line);
  }

  // Attachment head (front)
  const headGeo = new THREE.SphereGeometry(0.2, 32, 32);
  const head = new THREE.Mesh(headGeo, whiteMat);
  head.position.set(1.2, 0, 0);
  gun.add(head);

  // Attachment stem
  const stemGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.25, 16);
  const stem = new THREE.Mesh(stemGeo, accentMat);
  stem.rotation.z = Math.PI / 2;
  stem.position.set(1.03, 0, 0);
  gun.add(stem);

  // Logo text plane
  const logoGeo = new THREE.PlaneGeometry(0.5, 0.08);
  const logoMat = new THREE.MeshStandardMaterial({
    color: 0x444444,
    metalness: 0.2,
    roughness: 0.8,
  });
  const logo = new THREE.Mesh(logoGeo, logoMat);
  logo.position.set(0.2, 0, 0.285);
  gun.add(logo);

  gun.position.set(0, 0.1, 0);
  scene.add(gun);

  // Auto-rotation + drag control
  let isDragging = false;
  let prevX = 0, prevY = 0;
  let rotX = 0.2, rotY = 0;
  let velX = 0, velY = 0.004;

  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    prevX = e.clientX;
    prevY = e.clientY;
    velX = 0; velY = 0;
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = (e.clientX - prevX) * 0.008;
    const dy = (e.clientY - prevY) * 0.004;
    velY = dx;
    velX = dy;
    rotY += dx;
    rotX += dy;
    rotX = Math.max(-0.5, Math.min(0.5, rotX));
    prevX = e.clientX;
    prevY = e.clientY;
  });

  canvas.addEventListener('mouseup', () => { isDragging = false; });
  canvas.addEventListener('mouseleave', () => { isDragging = false; });

  // Touch support
  canvas.addEventListener('touchstart', (e) => {
    isDragging = true;
    prevX = e.touches[0].clientX;
    prevY = e.touches[0].clientY;
    velX = 0; velY = 0;
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const dx = (e.touches[0].clientX - prevX) * 0.008;
    const dy = (e.touches[0].clientY - prevY) * 0.004;
    velY = dx;
    velX = dy;
    rotY += dx;
    rotX += dy;
    rotX = Math.max(-0.5, Math.min(0.5, rotX));
    prevX = e.touches[0].clientX;
    prevY = e.touches[0].clientY;
  }, { passive: true });

  canvas.addEventListener('touchend', () => { isDragging = false; });

  // Animate
  function animate() {
    requestAnimationFrame(animate);

    if (!isDragging) {
      velY *= 0.95;
      velX *= 0.95;
      if (Math.abs(velY) < 0.0001) velY = 0.004;
    }

    rotY += velY;
    rotX += velX * 0.1;

    gun.rotation.y = rotY;
    gun.rotation.x = rotX;

    // Subtle floating
    gun.position.y = 0.1 + Math.sin(Date.now() * 0.001) * 0.06;

    renderer.render(scene, camera);
  }

  animate();

  // Resize
  window.addEventListener('resize', () => {
    w = container.clientWidth;
    h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
}
