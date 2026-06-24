/* ============================================================
   PRORECUP — Main JS
   ============================================================ */

// Désactive la restauration de scroll du navigateur (et de Shopify)
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

// Force le scroll en haut après que tout soit chargé
// (setTimeout override Shopify qui restaure après load)
window.addEventListener('load', () => {
  setTimeout(() => window.scrollTo(0, 0), 0);
});

document.addEventListener('DOMContentLoaded', () => {
  const hasIntro = !!document.getElementById('intro-overlay');

  if (hasIntro && !sessionStorage.getItem('intro-done')) {
    document.fonts.ready.then(initIntroAnimation);
  } else {
    // Pas d'intro : supprime l'overlay s'il existe et lance direct
    const overlay = document.getElementById('intro-overlay');
    if (overlay) overlay.remove();
    document.body.classList.remove('intro-running');
    bootSite();
  }
});

function bootSite() {
  initScrollProgress();
  initCursor();
  initNav();
  initLogoScroll();
  initLogoAnimation();
  initReveal();
  initParallax();
  initCounters();
  initGallery();
  initStickyBar();
}

/* ── Son "clic" Apple (Web Audio) ── */
function playIntroClick() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;

    // Corps du clic — sine freq descendante
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.055);
    oscGain.gain.setValueAtTime(0.22, now);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);

    // Crack haute fréquence (attaque)
    const bufLen = Math.floor(ctx.sampleRate * 0.018);
    const buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data   = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1);
    const noise      = ctx.createBufferSource();
    noise.buffer     = buf;
    const hpf        = ctx.createBiquadFilter();
    hpf.type         = 'highpass';
    hpf.frequency.value = 5500;
    const noiseGain  = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.18, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);
    noise.connect(hpf);
    hpf.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);

    setTimeout(() => ctx.close(), 300);
  } catch(e) {}
}

/* ── Intro plein écran PR → ProRecup → nav (auto-play) ── */
function initIntroAnimation() {
  const overlay = document.getElementById('intro-overlay');
  const logo    = document.getElementById('intro-logo');
  const wraps   = logo.querySelectorAll('.intro-wrap');

  document.body.classList.add('intro-running');

  // Mesure les largeurs naturelles AVANT de mettre width:0
  const widths = [];
  wraps.forEach(wrap => {
    const slide = wrap.querySelector('.intro-slide');
    wrap.style.transition = 'none';
    wrap.style.width      = 'auto';
    widths.push(slide.offsetWidth);
    wrap.style.width = '0px';
  });

  let clothUniforms = null;
  let clothActive   = true;

  function startClothBackground() {
    function run() {
      const W = window.innerWidth, H = window.innerHeight;
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
      overlay.insertBefore(canvas, overlay.firstChild);

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(1);
      renderer.setClearColor(0x000000, 0);

      const scene  = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(78, W / H, 0.1, 50);
      camera.position.set(0, 0.8, 5);
      camera.lookAt(0, 0, 0);

      const seg = W > 600 ? 60 : 36;
      const geo = new THREE.PlaneGeometry(13, 9, seg, Math.round(seg * 0.7));

      clothUniforms = {
        uTime:      { value: 0 },
        uAlpha:     { value: 0 },
        uClickTime: { value: -1.0 },
      };

      const mat = new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.DoubleSide,
        uniforms: clothUniforms,
        vertexShader: `
          uniform float uTime;
          uniform float uClickTime;
          varying float vZ;
          void main() {
            vec3 p = position;
            float w1 = sin(p.x * 0.45 + uTime * 0.13) * cos(p.y * 0.38 + uTime * 0.09);
            float w2 = sin(p.x * 0.70 - uTime * 0.15 + p.y * 0.50) * 0.50;
            float w3 = cos(p.x * 0.30 + p.y * 0.65 - uTime * 0.08) * 0.34;
            float w = (w1 + w2 + w3) * 0.30;
            if (uClickTime >= 0.0) {
              float t  = uTime - uClickTime;
              float d  = length(p.xy);
              float rp = exp(-pow(d - t * 1.1, 2.0) * 1.8) * max(0.0, 1.0 - t * 0.22);
              w += rp * 0.80;
            }
            p.z = w;
            vZ  = w;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uAlpha;
          varying float vZ;
          void main() {
            vec3 shadow = vec3(0.02, 0.02, 0.03);
            vec3 base   = vec3(0.07, 0.07, 0.09);
            vec3 sheen  = vec3(0.26, 0.25, 0.32);
            float h = clamp(vZ * 2.2 + 0.5, 0.0, 1.0);
            vec3 col = h < 0.5
              ? mix(shadow, base, h * 2.0)
              : mix(base, sheen, (h - 0.5) * 2.0);
            float a = uAlpha * clamp(0.62 + vZ * 1.3, 0.0, 0.88);
            gl_FragColor = vec4(col, a);
          }
        `
      });

      scene.add(new THREE.Mesh(geo, mat));

      let t0 = null;
      (function tick(ts) {
        if (!t0) t0 = ts;
        const t = (ts - t0) / 1000;
        clothUniforms.uTime.value  = t;
        clothUniforms.uAlpha.value = Math.min(t / 0.9, 1.0);
        renderer.render(scene, camera);
        if (clothActive) {
          requestAnimationFrame(tick);
        } else {
          renderer.dispose(); geo.dispose(); mat.dispose();
        }
      })(performance.now());
    }

    if (typeof THREE !== 'undefined') { run(); return; }
    const s = document.createElement('script');
    s.src = window.__threeUrl || '';
    s.onload = run;
    document.head.appendChild(s);
  }

  function closeIntro() {
    const navLogo = document.getElementById('nav-logo');
    const header  = document.getElementById('site-header');

    // 1. Tap press
    logo.style.transition = 'transform 0.14s ease-out';
    logo.style.transform  = 'scale(0.92)';
    playIntroClick();

    // 2. Spring-back
    setTimeout(() => {
      logo.style.transition = 'transform 0.22s ease-out';
      logo.style.transform  = 'scale(1)';
    }, 140);

    // 3. Mesure + vol (après que le spring soit fini)
    setTimeout(() => {
      logo.style.textShadow = '';

      document.querySelectorAll('.logo-slide-wrap').forEach(wrap => {
        wrap.style.transition = 'none';
        wrap.style.width      = 'auto';
      });
      void navLogo.offsetWidth;

      const navRect   = navLogo.getBoundingClientRect();
      const introRect = logo.getBoundingClientRect();
      const tx    = (navRect.left + navRect.width  / 2) - (introRect.left + introRect.width  / 2);
      const ty    = (navRect.top  + navRect.height / 2) - (introRect.top  + introRect.height / 2);
      const scale = parseFloat(getComputedStyle(navLogo).fontSize)
                  / parseFloat(getComputedStyle(logo).fontSize);

      requestAnimationFrame(() => {
        logo.style.transition      = 'transform 0.9s cubic-bezier(0.76, 0, 0.24, 1)';
        logo.style.transformOrigin = 'center center';
        logo.style.transform       = `translate(${tx}px, ${ty}px) scale(${scale})`;

        overlay.style.transition   = 'opacity 1.1s ease';
        overlay.style.opacity      = '0';

        // Page + header apparaissent une fois l'overlay bien avancé
        setTimeout(() => {
          document.body.classList.remove('intro-running');
          if (header) {
            header.style.transition = 'opacity 0.7s ease';
            header.style.opacity    = '1';
          }
        }, 650);

        sessionStorage.setItem('intro-done', '1');
      });
    }, 400);

    setTimeout(() => {
      clothActive = false;
      overlay.remove();
      if (header) { header.style.transition = ''; header.style.opacity = ''; }
      bootSite();
    }, 1700);
  }

  startClothBackground();

  // — Phase 1 : PR apparaît lentement
  setTimeout(() => {
    logo.style.transition = 'opacity 0.9s ease, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1)';
    logo.classList.add('visible');

    // — Phase 2 : lettres s'écartent
    setTimeout(() => {
      playIntroClick();
      if (clothUniforms) clothUniforms.uClickTime.value = clothUniforms.uTime.value;

      // Remesure avec police chargée (fonts.ready peut avoir pris du temps)
      wraps.forEach((wrap, i) => {
        wrap.style.transition = 'none';
        wrap.style.width      = 'auto';
        widths[i] = wrap.querySelector('.intro-slide').offsetWidth;
        wrap.style.width      = '0px';
        void wrap.offsetWidth; // commit 0px avant d'animer
      });

      // Double RAF : navigateur a deux frames pour calculer le state 0px proprement
      requestAnimationFrame(() => requestAnimationFrame(() => {
        wraps.forEach((wrap, i) => {
          wrap.style.transition = 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)';
          wrap.style.width      = widths[i] + 'px';
        });
      }));

      // Glow progressif une fois ProRecup pleinement révélé
      setTimeout(() => {
        logo.style.transition = 'text-shadow 1.6s ease';
        logo.style.textShadow = '0 0 30px rgba(255,255,255,0.35), 0 0 70px rgba(255,255,255,0.12)';
      }, 1300);

      // — Phase 3 : fermeture
      setTimeout(closeIntro, 2500);
    }, 1400);

  }, 400);
}

/* ── Logo animation nav : PR → ProRecup (seulement sans intro) ── */
function initLogoAnimation() {
  // Si l'intro vient de jouer : logo nav déjà en place, on skip l'animation
  if (sessionStorage.getItem('intro-done')) {
    const wraps = document.querySelectorAll('.logo-slide-wrap');
    wraps.forEach(wrap => {
      wrap.style.transition = 'none';
      wrap.style.width = 'auto';
    });
    return;
  }

  const wraps = document.querySelectorAll('.logo-slide-wrap');
  if (!wraps.length) return;

  wraps.forEach(wrap => {
    const slide = wrap.querySelector('.logo-slide');
    wrap.style.transition = 'none';
    wrap.style.width = 'auto';
    const w = slide.offsetWidth;
    wrap.style.width = '0px';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      wrap.style.transition = '';
    }));
    wrap.dataset.w = w;
  });

  setTimeout(() => {
    wraps.forEach(wrap => { wrap.style.width = wrap.dataset.w + 'px'; });
  }, 500);
}

/* ── Logo : rejoue l'intro sur homepage, navigation normale ailleurs ── */
function initLogoScroll() {
  const logo = document.getElementById('nav-logo');
  if (!logo) return;

  logo.addEventListener('click', e => {
    if (window.location.pathname !== '/') return; // autres pages → lien normal

    e.preventDefault();

    // Ne rejoue pas si intro déjà en cours
    if (document.getElementById('intro-overlay')) return;

    // Scroll en haut instantanément
    window.scrollTo(0, 0);

    // Recrée l'overlay
    sessionStorage.removeItem('intro-done');
    const overlay = document.createElement('div');
    overlay.id = 'intro-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <div class="intro-logo" id="intro-logo">
        <span class="intro-p">P</span><span class="intro-wrap"><span class="intro-slide">ro</span></span><span class="intro-r">R</span><span class="intro-wrap"><span class="intro-slide">ecup</span></span>
      </div>`;
    overlay.style.opacity = '1';
    document.body.prepend(overlay);

    // Remet le nav logo en position fermée (PR)
    document.querySelectorAll('.logo-slide-wrap').forEach(wrap => {
      wrap.style.transition = 'none';
      wrap.style.width      = '0px';
    });

    initIntroAnimation();
  });
}

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

  const prevBtn = gallery.querySelector('.gallery-prev');
  const nextBtn = gallery.querySelector('.gallery-next');
  if (prevBtn) prevBtn.addEventListener('click', () => { clearInterval(timer); goTo(current - 1); autoPlay(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { clearInterval(timer); goTo(current + 1); autoPlay(); });
  dots.forEach(d => d.addEventListener('click', () => { clearInterval(timer); goTo(parseInt(d.dataset.index)); autoPlay(); }));

  // Swipe tactile + drag souris (pointer events)
  let dragStartX = 0;
  let isDragging = false;

  gallery.addEventListener('pointerdown', e => {
    dragStartX = e.clientX;
    isDragging = true;
    gallery.classList.add('dragging');
    gallery.setPointerCapture(e.pointerId);
  });

  gallery.addEventListener('pointerup', e => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    if (Math.abs(dx) > 40) {
      clearInterval(timer);
      goTo(dx < 0 ? current + 1 : current - 1);
      autoPlay();
    }
    isDragging = false;
    gallery.classList.remove('dragging');
  });

  gallery.addEventListener('pointercancel', () => {
    isDragging = false;
    gallery.classList.remove('dragging');
  });

  autoPlay();
}

/* ── Sticky Buy Bar ── */
function initStickyBar() {
  const bar = document.getElementById('sticky-buy-bar');
  if (!bar) return;
  if (!window.matchMedia('(max-width: 600px)').matches) return;

  const hero     = document.querySelector('.hero');
  const buySection = document.getElementById('buy');

  function update() {
    if (!hero) return;
    const heroBottom = hero.getBoundingClientRect().bottom;
    const atBuy = buySection
      ? buySection.getBoundingClientRect().top < window.innerHeight * 0.5
      : false;

    const show = heroBottom < 0 && !atBuy;
    bar.classList.toggle('visible', show);
    bar.setAttribute('aria-hidden', String(!show));
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
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
  // Pas de curseur custom sur écrans tactiles
  if (window.matchMedia('(hover: none)').matches) return;

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
  // Désactivé sur mobile — cause du jank et décharge la batterie
  if (window.matchMedia('(hover: none)').matches) return;

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
   THREE.JS — ProRecup Massage Gun 3D
   Matières noires mat, rotation broche, fond transparent
   ================================================================ */

function initHero3D() {
  const canvas = document.getElementById('three-canvas');
  if (!canvas || typeof THREE === 'undefined') return;
  if (window.innerWidth <= 600) return; // fallback image sur mobile

  // Montrer le canvas, cacher l'image fallback
  canvas.style.display = 'block';
  const fallback = document.querySelector('.hero-product-img');
  if (fallback) fallback.style.display = 'none';

  const wrap = canvas.parentElement;
  let W = wrap.clientWidth  || Math.round(window.innerWidth * 0.5);
  let H = wrap.clientHeight || window.innerHeight;

  /* Renderer — fond transparent pour fusion avec la page */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 2.0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 50);
  camera.position.set(0, 0.3, 7);

  /* ── Éclairage studio — produit noir mat ── */
  scene.add(new THREE.AmbientLight(0xffffff, 0.14));

  // Key — chaud haut-gauche
  const key = new THREE.DirectionalLight(0xfff4e0, 5.5);
  key.position.set(-3, 4, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  scene.add(key);

  // Fill — bleu froid droite
  const fill = new THREE.DirectionalLight(0x5878ff, 2.0);
  fill.position.set(5, 0, 2);
  scene.add(fill);

  // Rim — blanc pur derrière (contour lumineux)
  const rim = new THREE.DirectionalLight(0xffffff, 4.8);
  rim.position.set(0.5, -0.5, -6);
  scene.add(rim);

  // Top — définition des surfaces horizontales
  const top = new THREE.DirectionalLight(0xffffff, 1.8);
  top.position.set(0, 6, 2);
  scene.add(top);

  // Front point — avant-scène
  const front = new THREE.PointLight(0xffffff, 3.0, 22);
  front.position.set(0, 0.5, 7);
  scene.add(front);

  /* ── Matériaux — noir premium mat (produit réel) ── */
  const matte   = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.28, roughness: 0.70 });
  const satin   = new THREE.MeshStandardMaterial({ color: 0x212121, metalness: 0.52, roughness: 0.28 });
  const dark    = new THREE.MeshStandardMaterial({ color: 0x0c0c0c, metalness: 0.10, roughness: 0.80 });
  const rubber  = new THREE.MeshStandardMaterial({ color: 0x080808, metalness: 0.00, roughness: 0.98 });
  const gloss   = new THREE.MeshStandardMaterial({ color: 0x262626, metalness: 0.68, roughness: 0.05 });
  const screen  = new THREE.MeshStandardMaterial({ color: 0x000d1a, metalness: 0, roughness: 0, emissive: 0x0033cc, emissiveIntensity: 3.0 });
  const ledGreen= new THREE.MeshStandardMaterial({ color: 0x22ff88, emissive: 0x22ff88, emissiveIntensity: 5.0, metalness: 0, roughness: 0.2 });
  const accent  = new THREE.MeshStandardMaterial({ color: 0x141414, metalness: 0.20, roughness: 0.60 });

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
  gun.rotation.x = 0.08;
  gun.position.set(-0.15, 0.1, 0);
  scene.add(gun);

  /* ── Rotation broche — constante sur Y ── */
  const SPEED = 0.011; // ~9 secondes par tour complet
  let t = 0;

  function animate() {
    requestAnimationFrame(animate);
    t += SPEED;

    gun.rotation.y = t;
    gun.position.y = 0.1 + Math.sin(t * 0.5) * 0.05;

    if (btnRing.material) btnRing.material.emissiveIntensity = 2.5 + Math.sin(t * 2.5) * 1.0;

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
