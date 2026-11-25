const header = document.querySelector("[data-header]");
const scrollGuide = document.querySelector("[data-scroll-guide]");
const heroVideo = document.querySelector("[data-hero-video]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const sequence = document.querySelector("[data-scroll-sequence]");
const stage = document.querySelector("[data-sequence-stage]");
const heroLayer = document.querySelector("[data-hero-layer]");
const heroContent = document.querySelector(".hero__content");
const heroShade = document.querySelector(".hero__shade");
const vision = document.querySelector("[data-vision]");
const visionCopy = document.querySelector("[data-vision-copy]");
const visionCopyNext = document.querySelector("[data-vision-copy-next]");
const special = document.querySelector("[data-special]");
const objects = [...document.querySelectorAll("[data-object]")];
const backToTop = document.querySelector("[data-back-to-top]");
const footer = document.querySelector("[data-footer]");

// 화면 높이를 1로 둔 스크롤 거리. 기존 영상/첫 문장 타이밍을 유지하며 뒤 구간을 확장합니다.
const sequenceTiming = {
  zoomEnd: 0.924,
  fadeEnd: 1.68,
  revealStart: 1.764,
  revealEnd: 2.352,
  fillEnd: 3.948,
  firstExitStart: 4.12,
  firstExitEnd: 4.65,
  nextRevealStart: 4.65,
  nextRevealEnd: 5.25,
  nextFillEnd: 6.65,
  nextExitStart: 6.85,
  nextExitEnd: 7.4,
  specialStart: 7.4,
  specialEnd: 8.15,
  // Theme. On 완전 등장 이후 Company. On 진입까지의 거리를 기존의 70%로 압축합니다.
  objectFadeEnd: 8.465,
  specialExitStart: 8.5,
  specialExitEnd: 8.85,
  insideStart: 8.885,
  insideEnd: 9.585,
};

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const phase = (progress, start, end) => clamp((progress - start) / (end - start));
const smoothstep = (value) => value * value * (3 - 2 * value);

// 회색 원문 위의 흰색 텍스트를 왼쪽부터 드러내 첫 줄 → 둘째 줄 순서로 채웁니다.
function prepareText(copy) {
  const lines = [];
  let total = 0;
  copy.querySelectorAll("[data-fill-line]").forEach((line) => {
    const text = line.textContent;
    const overlay = document.createElement("span");
    overlay.className = "vision__line-fill";
    overlay.textContent = text;
    line.append(overlay);
    const length = Array.from(text).length;
    lines.push({ overlay, start: total, length });
    total += length;
  });
  return { lines, total };
}

const firstText = prepareText(visionCopy);
const nextText = prepareText(visionCopyNext);

function fillText(text, progress) {
  text.lines.forEach(({ overlay, start, length }) => {
    const amount = clamp((progress * text.total - start) / length) * 100;
    overlay.style.setProperty("--line-fill", `${amount.toFixed(2)}%`);
  });
}

function moveCopy(copy, reveal, exit) {
  copy.style.opacity = String(reveal * (1 - exit));
  copy.style.visibility = reveal > 0 && exit < 1 ? "visible" : "hidden";
  copy.setAttribute("aria-hidden", String(reveal === 0 || exit === 1));
  const offset = reduceMotion.matches ? 0 : ((1 - reveal) * 0.15 - exit * 0.18) * stageHeight;
  copy.style.transform = offset ? `translate3d(0, ${offset}px, 0)` : "none";
}

let sequenceTop = 0;
let scrollDistance = 1;
let stageHeight = 1;
let displayedProgress = 0;
let targetProgress = 0;
let frameId = 0;
let lastFrameTime = 0;
let videoShouldPlay = null;

function renderSequence(progress) {
  // 150%부터 페이드가 시작되지만, 완전히 사라질 때까지 같은 속도로 확대합니다.
  const zoom = clamp(progress, 0, sequenceTiming.fadeEnd) / sequenceTiming.zoomEnd;
  const fade = smoothstep(phase(progress, sequenceTiming.zoomEnd, sequenceTiming.fadeEnd));
  const reveal = smoothstep(phase(progress, sequenceTiming.revealStart, sequenceTiming.revealEnd));
  const firstExit = smoothstep(phase(progress, sequenceTiming.firstExitStart, sequenceTiming.firstExitEnd));
  const nextReveal = smoothstep(phase(progress, sequenceTiming.nextRevealStart, sequenceTiming.nextRevealEnd));
  const nextExit = smoothstep(phase(progress, sequenceTiming.nextExitStart, sequenceTiming.nextExitEnd));
  const specialReveal = smoothstep(phase(progress, sequenceTiming.specialStart, sequenceTiming.specialEnd));
  const insideReveal = smoothstep(phase(progress, sequenceTiming.insideStart, sequenceTiming.insideEnd));
  const specialExit = smoothstep(phase(progress, sequenceTiming.specialExitStart, sequenceTiming.specialExitEnd));

  heroVideo.style.transform = `scale(${reduceMotion.matches ? 1 : 1 + zoom * 0.5})`;
  heroVideo.style.opacity = String(1 - fade);
  heroContent.style.opacity = String(1 - fade);
  heroShade.style.opacity = String(1 - fade);
  const heroVisible = progress < sequenceTiming.fadeEnd;
  heroLayer.style.visibility = heroVisible ? "visible" : "hidden";
  const playVideo = heroVisible && !reduceMotion.matches;
  if (playVideo !== videoShouldPlay) {
    videoShouldPlay = playVideo;
    if (playVideo) heroVideo.play().catch(() => {});
    else heroVideo.pause();
  }
  scrollGuide.style.opacity = String(1 - phase(progress, 0, 0.336));
  scrollGuide.style.visibility = progress >= 0.336 ? "hidden" : "visible";

  vision.style.visibility = progress > sequenceTiming.revealStart ? "visible" : "hidden";
  vision.style.opacity = String(reveal);
  const entrance = reduceMotion.matches ? 0 : (1 - reveal) * stageHeight * 0.15;
  moveCopy(visionCopy, reveal, firstExit);
  moveCopy(visionCopyNext, nextReveal, nextExit);
  fillText(firstText, phase(progress, sequenceTiming.revealEnd, sequenceTiming.fillEnd));
  fillText(nextText, phase(progress, sequenceTiming.nextRevealEnd, sequenceTiming.nextFillEnd));

  // Theme. On까지 오브제를 유지하며 전경/배경의 속도 차이로 깊이감을 만듭니다.
  const drift = Math.max(0, progress - sequenceTiming.revealEnd) * stageHeight;
  const objectOpacity = (1 - 0.7 * smoothstep(phase(progress, sequenceTiming.nextRevealStart, sequenceTiming.objectFadeEnd))) * (1 - insideReveal);
  objects.forEach((object) => {
    const offset = entrance - (reduceMotion.matches ? 0 : drift * Number(object.dataset.speed));
    object.style.transform = `translate3d(0, ${offset}px, 0)`;
    object.style.opacity = String(objectOpacity);
  });

  special.style.opacity = String(specialReveal * (1 - specialExit));
  special.style.visibility = specialReveal > 0 && specialExit < 1 ? "visible" : "hidden";
  special.inert = specialReveal === 0 || specialExit === 1;
  special.style.transform = reduceMotion.matches ? "none" : `translate3d(0, ${((1 - specialReveal) * 0.12 - specialExit * 0.22) * stageHeight}px, 0)`;
  const baseColor = progress >= sequenceTiming.nextRevealStart ? 13 : 0;
  const backgroundChannel = Math.round(baseColor + (255 - baseColor) * insideReveal);
  const backgroundColor = `rgb(${backgroundChannel}, ${backgroundChannel}, ${backgroundChannel})`;
  stage.style.backgroundColor = backgroundColor;
  document.body.style.backgroundColor = backgroundColor;
  header.classList.toggle("is-light", insideReveal >= 0.5);
  backToTop.classList.toggle("is-light", insideReveal >= 0.5);
  document.documentElement.style.colorScheme = insideReveal >= 0.5 ? "light" : "dark";
  setCarouselActive(specialReveal > 0 && specialExit < 1);
}

function animateSequence(time) {
  const delta = lastFrameTime ? Math.min(time - lastFrameTime, 64) : 16;
  lastFrameTime = time;
  // 브라우저의 기본 스크롤을 유지하며 시각 효과만 약 80ms 부드럽게 따라갑니다.
  const blend = reduceMotion.matches ? 1 : 1 - Math.exp(-delta / 80);
  displayedProgress += (targetProgress - displayedProgress) * blend;
  if (Math.abs(targetProgress - displayedProgress) < 0.0001) displayedProgress = targetProgress;
  renderSequence(displayedProgress);

  if (displayedProgress !== targetProgress) {
    frameId = requestAnimationFrame(animateSequence);
  } else {
    frameId = 0;
    lastFrameTime = 0;
  }
}

function updateScroll() {
  targetProgress = clamp((window.scrollY - sequenceTop) / stageHeight, 0, scrollDistance / stageHeight);
  header.classList.toggle("is-scrolled", window.scrollY > sequenceTop + scrollDistance);
  backToTop.hidden = window.scrollY < stageHeight * 0.4;
  const footerVisibleHeight = Math.max(0, window.innerHeight - footer.getBoundingClientRect().top);
  backToTop.style.setProperty("--footer-clearance", `${footerVisibleHeight > 0 ? footerVisibleHeight + 24 : 0}px`);
  if (!frameId) frameId = requestAnimationFrame(animateSequence);
}

function measureSequence() {
  sequenceTop = sequence.getBoundingClientRect().top + window.scrollY;
  stageHeight = stage.clientHeight;
  scrollDistance = Math.max(1, sequence.offsetHeight - stageHeight);
  updateScroll();
}

window.addEventListener("scroll", updateScroll, { passive: true });
window.addEventListener("resize", measureSequence);
window.addEventListener("pageshow", measureSequence);
reduceMotion.addEventListener("change", () => {
  scheduleCarousel();
  updateScroll();
});

scrollGuide.addEventListener("click", () => {
  window.scrollTo({
    top: sequenceTop + stageHeight * sequenceTiming.revealEnd,
    behavior: reduceMotion.matches ? "auto" : "smooth",
  });
});

backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
});

const carousel = document.querySelector("[data-carousel]");
const slidesContainer = document.querySelector("[data-slides]");
const slideStatus = document.querySelector("[data-slide-status]");
const slideData = [...document.querySelectorAll("[data-slide-template]")].map((template) => ({
  template,
  title: template.content.querySelector("h3").textContent,
}));
let activeSlide = 0;
let carouselActive = false;
let carouselHovered = false;
let carouselFocused = false;
let carouselBusy = false;
let carouselTimer = 0;
let pointerStart = null;
let swipeHandled = false;
const wrappedIndex = (index) => (index + slideData.length) % slideData.length;

function buildSlides() {
  // 양 끝에 여분 카드를 둬 마지막 → 첫 번째 전환도 같은 방향으로 이어집니다.
  slidesContainer.classList.add("is-resetting");
  const fragment = document.createDocumentFragment();
  for (let slot = -2; slot <= 2; slot += 1) {
    const index = wrappedIndex(activeSlide + slot);
    const data = slideData[index];
    const card = data.template.content.firstElementChild.cloneNode(true);
    card.className = `special__card${slot === 0 ? " is-active" : ""}`;
    card.dataset.slot = String(slot);
    card.dataset.index = String(index);
    card.style.setProperty("--slot", slot);
    card.setAttribute("aria-hidden", String(Math.abs(slot) > 1));
    card.inert = Math.abs(slot) > 1;
    card.querySelector(".thumbnail").tabIndex = slot === 0 ? 0 : -1;
    card.setAttribute("aria-label", `${index + 1} / ${slideData.length}: ${data.title}`);
    fragment.append(card);
  }
  slidesContainer.replaceChildren(fragment);
  requestAnimationFrame(() => slidesContainer.classList.remove("is-resetting"));
}

function scheduleCarousel() {
  clearInterval(carouselTimer);
  carouselTimer = 0;
  if (carouselActive && !carouselHovered && !carouselFocused && !document.hidden && !reduceMotion.matches) {
    carouselTimer = setInterval(() => moveSlide(1, false), 4000);
  }
}

function setCarouselActive(active) {
  const inView = active && window.scrollY < sequenceTop + scrollDistance + stageHeight;
  if (carouselActive === inView) return;
  carouselActive = inView;
  scheduleCarousel();
}

function moveSlide(direction, manual = true) {
  if (carouselBusy) return;
  carouselBusy = true;
  activeSlide = wrappedIndex(activeSlide + direction);
  slidesContainer.querySelectorAll(".special__card").forEach((card) => {
    const slot = Number(card.dataset.slot) - direction;
    card.style.setProperty("--slot", slot);
    card.classList.toggle("is-active", slot === 0);
    card.setAttribute("aria-hidden", String(Math.abs(slot) > 1));
    card.inert = Math.abs(slot) > 1;
    card.querySelector(".thumbnail").tabIndex = slot === 0 ? 0 : -1;
  });
  if (manual) {
    slideStatus.textContent = `${activeSlide + 1} / ${slideData.length}: ${slideData[activeSlide].title}`;
    scheduleCarousel();
  }
  setTimeout(() => {
    const focusWasInSlide = slidesContainer.contains(document.activeElement);
    buildSlides();
    if (focusWasInSlide) slidesContainer.querySelector(".is-active .thumbnail").focus({ preventScroll: true });
    carouselBusy = false;
  }, reduceMotion.matches ? 0 : 750);
}

document.querySelector("[data-slide-prev]").addEventListener("click", () => moveSlide(-1));
document.querySelector("[data-slide-next]").addEventListener("click", () => moveSlide(1));
carousel.addEventListener("pointerenter", () => { carouselHovered = true; scheduleCarousel(); });
carousel.addEventListener("pointerleave", () => { carouselHovered = false; scheduleCarousel(); });
carousel.addEventListener("focusin", () => { carouselFocused = true; scheduleCarousel(); });
carousel.addEventListener("focusout", (event) => {
  if (carousel.contains(event.relatedTarget)) return;
  carouselFocused = false;
  scheduleCarousel();
});
carousel.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
  event.preventDefault();
  moveSlide(event.key === "ArrowRight" ? 1 : -1);
});
carousel.addEventListener("pointerdown", (event) => {
  swipeHandled = false;
  if (event.pointerType === "mouse" || event.target.closest("button")) return;
  pointerStart = { x: event.clientX, y: event.clientY };
});
carousel.addEventListener("pointerup", (event) => {
  if (!pointerStart) return;
  const x = event.clientX - pointerStart.x;
  const y = event.clientY - pointerStart.y;
  if (Math.abs(x) > 40 && Math.abs(x) > Math.abs(y)) {
    swipeHandled = true;
    moveSlide(x < 0 ? 1 : -1);
  }
  pointerStart = null;
});
carousel.addEventListener("pointercancel", () => { pointerStart = null; });
carousel.addEventListener("click", (event) => {
  if (swipeHandled && event.detail > 0 && event.target.closest(".thumbnail")) event.preventDefault();
});
document.addEventListener("visibilitychange", scheduleCarousel);

function scrollToTheme() {
  window.scrollTo({
    top: sequenceTop + stageHeight * sequenceTiming.specialEnd,
    behavior: reduceMotion.matches ? "auto" : "smooth",
  });
}

document.addEventListener("click", (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest('a[href="#theme"]');
  if (!link) return;
  event.preventDefault();
  if (window.location.hash !== "#theme") history.pushState(null, "", "#theme");
  scrollToTheme();
});
window.addEventListener("hashchange", () => {
  if (window.location.hash === "#theme") scrollToTheme();
});

buildSlides();
measureSequence();
if (window.location.hash === "#theme") scrollToTheme();

const newsItems = [...document.querySelectorAll("[data-news-item]")];
const newsImages = [...document.querySelectorAll("[data-news-image]")];
const newsPreview = document.querySelector("#news-preview");

function selectNews(index) {
  newsItems.forEach((item, itemIndex) => {
    const selected = itemIndex === index;
    item.classList.toggle("is-active", selected);
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
    newsImages[itemIndex].classList.toggle("is-active", selected);
    newsImages[itemIndex].setAttribute("aria-hidden", String(!selected));
  });
  newsPreview.setAttribute("aria-labelledby", newsItems[index].id);
}

newsItems.forEach((item, index) => {
  item.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "touch") selectNews(index);
  });
  item.addEventListener("focus", () => selectNews(index));
  item.addEventListener("click", () => selectNews(index));
  item.addEventListener("keydown", (event) => {
    let next;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (index + 1) % newsItems.length;
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (index + newsItems.length - 1) % newsItems.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = newsItems.length - 1;
    else return;
    event.preventDefault();
    newsItems[next].focus({ preventScroll: true });
  });
});

const search = document.querySelector("[data-search]");
const searchInput = search.querySelector("input");
const searchResults = search.querySelector("[data-search-results]");
const searchEmpty = search.querySelector("[data-search-empty]");
const searchEntries = [
  ...slideData.map(({ title }, index) => ({ title, target: "theme", slide: index })),
  ...[...document.querySelectorAll(".inside__card")].map((card) => ({
    title: card.querySelector("h3").textContent.trim(),
    target: card.id,
  })),
  ...newsItems.map((item, index) => ({
    title: item.querySelector(".news__item-title").textContent,
    target: "news",
    news: index,
  })),
];

function updateSearch() {
  const query = searchInput.value.trim().toLocaleLowerCase("ko");
  const results = searchEntries.filter(({ title }) => title.toLocaleLowerCase("ko").includes(query));
  searchResults.replaceChildren();
  searchEmpty.hidden = results.length > 0;

  results.forEach(({ title, target, slide, news: newsIndex }) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = `#${target}`;
    link.textContent = title;
    link.addEventListener("click", () => {
      search.close();
      if (slide !== undefined) {
        activeSlide = slide;
        buildSlides();
      }
      if (newsIndex !== undefined) selectNews(newsIndex);
    });
    item.append(link);
    searchResults.append(item);
  });
}

document.querySelector("[data-search-open]").addEventListener("click", () => {
  searchInput.value = "";
  updateSearch();
  search.showModal();
});
searchInput.addEventListener("input", updateSearch);
