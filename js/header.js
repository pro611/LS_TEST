(() => {
  const menu = document.querySelector("[data-menu]");
  const menuToggle = document.querySelector("[data-menu-toggle]");

  function setMenu(open) {
    menu.classList.toggle("is-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
  }

  menuToggle.addEventListener("click", () => {
    setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  menu.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      setMenu(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenu(false);
  });

  const eventPopup = document.querySelector("[data-event-popup]");
  const eventOpeners = document.querySelectorAll("[data-event-open]");
  let eventReturnFocus;

  eventOpeners.forEach((opener) => {
    opener.addEventListener("click", (event) => {
      event.preventDefault();
      if (eventPopup.open) return;
      eventReturnFocus = menu.contains(opener) && menuToggle.getClientRects().length ? menuToggle : opener;
      eventPopup.showModal();
    });
  });

  eventPopup.addEventListener("click", (event) => {
    if (event.target === eventPopup || event.target.closest("[data-event-close]")) {
      eventPopup.close();
    }
  });

  eventPopup.addEventListener("close", () => {
    if (eventPopup.open) return;
    eventReturnFocus?.focus({ preventScroll: true });
  });

  const topLink = document.querySelector("[data-article-top]");
  if (!topLink) return;

  const header = document.querySelector("[data-header]");
  const footer = document.querySelector("[data-footer]");

  function updateArticleNavigation() {
    header.classList.toggle("is-scrolled", window.scrollY > 10);
    topLink.hidden = window.scrollY < window.innerHeight * 0.4;

    const footerVisible = Math.max(0, window.innerHeight - footer.getBoundingClientRect().top);
    topLink.style.setProperty("--footer-clearance", `${footerVisible ? footerVisible + 24 : 0}px`);
  }

  window.addEventListener("scroll", updateArticleNavigation, { passive: true });
  window.addEventListener("resize", updateArticleNavigation);
  window.addEventListener("pageshow", updateArticleNavigation);
  updateArticleNavigation();
})();
