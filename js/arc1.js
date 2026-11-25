(() => {
  const carousel = document.querySelector("[data-archive-carousel]");
  const slides = [...carousel.querySelectorAll("[data-archive-slide]")];
  const dots = [...carousel.querySelectorAll("[data-archive-dot]")];
  const pause = carousel.querySelector("[data-archive-pause]");
  const status = carousel.querySelector("[data-archive-status]");
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let current = 0;
  let paused = motion.matches;
  let hovered = false;
  let timer;

  function showSlide(index, announce = false) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, position) => {
      const active = position === current;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
      slide.inert = !active;
      dots[position].setAttribute("aria-pressed", String(active));
    });
    if (announce) {
      status.textContent = `추천 콘텐츠 ${current + 1} / ${slides.length}, ${slides[current].querySelector("h2").innerText.replace(/\s+/g, " ")}`;
    }
  }

  function scheduleRotation() {
    window.clearTimeout(timer);
    if (paused || hovered || carousel.contains(document.activeElement) || document.hidden) return;
    timer = window.setTimeout(() => {
      showSlide(current + 1);
      scheduleRotation();
    }, 5500);
  }

  function navigate(index) {
    showSlide(index, true);
    scheduleRotation();
  }

  function updatePauseButton() {
    pause.setAttribute("aria-pressed", String(paused));
    pause.setAttribute("aria-label", paused ? "자동 슬라이드 재생" : "자동 슬라이드 일시정지");
    pause.firstElementChild.textContent = paused ? "▶" : "Ⅱ";
  }

  carousel.querySelector("[data-archive-prev]").addEventListener("click", () => navigate(current - 1));
  carousel.querySelector("[data-archive-next]").addEventListener("click", () => navigate(current + 1));
  dots.forEach((dot, index) => dot.addEventListener("click", () => navigate(index)));

  pause.addEventListener("click", () => {
    paused = !paused;
    updatePauseButton();
    scheduleRotation();
  });

  carousel.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "touch") {
      hovered = true;
      scheduleRotation();
    }
  });
  carousel.addEventListener("pointerleave", () => {
    hovered = false;
    scheduleRotation();
  });
  carousel.addEventListener("focusin", scheduleRotation);
  carousel.addEventListener("focusout", () => queueMicrotask(scheduleRotation));
  document.addEventListener("visibilitychange", scheduleRotation);
  window.addEventListener("pagehide", () => window.clearTimeout(timer));
  window.addEventListener("pageshow", scheduleRotation);

  motion.addEventListener("change", () => {
    paused = motion.matches;
    updatePauseButton();
    scheduleRotation();
  });

  updatePauseButton();
  scheduleRotation();
})();
