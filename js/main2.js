const header = document.querySelector("[data-header]");
const hero = document.querySelector(".main2-hero");
const heroVideo = hero.querySelector("video");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const topLink = document.querySelector("[data-main2-top]");
const footer = document.querySelector("[data-footer]");

function updateHeader() {
  const light = hero.getBoundingClientRect().top <= -header.offsetHeight / 2;
  header.classList.toggle("is-light", light);
  header.classList.toggle("is-scrolled", light);
  topLink.hidden = window.scrollY < window.innerHeight * 0.4;

  const footerVisible = Math.max(0, window.innerHeight - footer.getBoundingClientRect().top);
  topLink.style.setProperty("--footer-clearance", `${footerVisible ? footerVisible + 24 : 0}px`);
}

window.addEventListener("scroll", updateHeader, { passive: true });
window.addEventListener("resize", updateHeader);
window.addEventListener("pageshow", updateHeader);
updateHeader();

function updateHeroPlayback() {
  if (reduceMotion.matches) {
    heroVideo.pause();
  } else {
    heroVideo.play().catch(() => {
      // 자동 재생이 제한된 경우 포스터를 표시합니다.
    });
  }
}

reduceMotion.addEventListener("change", updateHeroPlayback);
updateHeroPlayback();
