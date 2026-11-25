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
})();
