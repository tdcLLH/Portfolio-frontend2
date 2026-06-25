(() => {
  "use strict";

  const FRAME_COUNT = 121;
  const HERO_TEXT_FADE_END = 0.08;
  const framePath = (n) => `public/frames/frame_${String(n).padStart(4, "0")}.jpg`;

  const CARDS = [
    { id: "c1", show: 0.1, hide: 0.32 },
    { id: "c2", show: 0.38, hide: 0.58 },
    { id: "c3", show: 0.64, hide: 0.84 },
  ];

  if (typeof window.Lenis === "function") {
    const lenis = new window.Lenis({
      lerp: 0.1,
      duration: 1.2,
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1.1,
    });
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }

  const section = document.querySelector(".scroll-animation");
  const canvas = document.getElementById("hero-canvas");
  const ctx = canvas.getContext("2d");

  const heroCopy = document.getElementById("hero-copy");
  const progressFill = document.getElementById("progress-fill");
  const seqReadout = document.getElementById("seq-readout");
  const syncReadout = document.getElementById("sync-readout");
  const frameCounter = document.getElementById("frame-counter");

  const loadingOverlay = document.getElementById("loading-overlay");
  const loadingFill = document.getElementById("loading-fill");
  const loadingText = document.getElementById("loading-text");

  const desktopCards = Array.from(document.querySelectorAll(".story-card"));
  const mobileCards = Array.from(
    document.querySelectorAll(".story-card-mobile"),
  );

  const frames = [];
  let loadedCount = 0;
  let loaded = false;
  let tickingRaf = false;
  let lastFrameIndex = -1;
  let prevVisibleIds = "";

  function preloadFrames() {
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
      img.src = framePath(i);

      const onDone = () => {
        loadedCount++;
        const pct = Math.round((loadedCount / FRAME_COUNT) * 100);
        loadingFill.style.width = pct + "%";
        loadingText.textContent = `Loading frames · ${pct}%`;
        if (loadedCount === FRAME_COUNT) {
          loaded = true;
          loadingOverlay.classList.add("is-hidden");
          drawFrame(0);
          lastFrameIndex = 0;
        }
      };
      img.onload = onDone;
      img.onerror = onDone;
      frames.push(img);
    }
  }

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 3;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    drawFrame(lastFrameIndex >= 0 ? lastFrameIndex : 0);
  }

  function drawFrame(index) {
    const img = frames[index];
    if (!img || !img.complete || !img.naturalWidth) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = cw / ch;

    let drawW, drawH;
    if (canvasRatio > imgRatio) {
      drawW = cw;
      drawH = cw / imgRatio;
    } else {
      drawH = ch;
      drawW = ch * imgRatio;
    }

    if (window.innerWidth <= 768) {
      drawW *= 1.3;
      drawH *= 1.3;
    }

    const drawX = (cw - drawW) / 2;
    const drawY = (ch - drawH) / 2;
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }

  function handleScroll() {
    if (tickingRaf) return;
    tickingRaf = true;

    requestAnimationFrame(() => {
      tickingRaf = false;
      if (!loaded) return;

      const rect = section.getBoundingClientRect();
      const scrollable = section.offsetHeight - window.innerHeight;
      const progress =
        scrollable <= 0 ? 0 : Math.min(1, Math.max(0, -rect.top / scrollable));

      const frameIndex = Math.min(
        FRAME_COUNT - 1,
        Math.floor(progress * FRAME_COUNT),
      );
      if (frameIndex !== lastFrameIndex) {
        lastFrameIndex = frameIndex;
        drawFrame(frameIndex);
        frameCounter.textContent = String(frameIndex + 1).padStart(3, "0");
        seqReadout.textContent = `SEQ ${String(frameIndex + 1).padStart(3, "0")} / ${FRAME_COUNT}`;
      }

      const opacity = Math.max(0, 1 - progress / HERO_TEXT_FADE_END);
      heroCopy.style.opacity = String(opacity);
      heroCopy.style.transform = `translateY(${(1 - opacity) * 12}px)`;

      progressFill.style.transform = `scaleX(${progress})`;

      const sync = 92 + Math.sin(progress * Math.PI * 2.4) * 6.2;
      syncReadout.textContent = sync.toFixed(1) + "%";

      const visible = new Set();
      for (const c of CARDS) {
        if (progress >= c.show && progress <= c.hide) visible.add(c.id);
      }
      const ids = [...visible].sort().join(",");
      if (ids !== prevVisibleIds) {
        prevVisibleIds = ids;
        for (const card of [...desktopCards, ...mobileCards]) {
          card.classList.toggle("is-visible", visible.has(card.dataset.card));
        }
      }
    });
  }

  const navbar = document.getElementById("navbar");
  function handleNavbar() {
    if (window.scrollY > 40) navbar.classList.add("is-scrolled");
    else navbar.classList.remove("is-scrolled");
  }

  preloadFrames();
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  window.addEventListener(
    "scroll",
    () => {
      handleScroll();
      handleNavbar();
    },
    { passive: true },
  );
  handleScroll();
  handleNavbar();
})();
