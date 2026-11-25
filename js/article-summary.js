(() => {
  const summary = document.querySelector("[data-summary]");
  const toggle = summary.querySelector("[data-summary-toggle]");
  const panel = summary.querySelector("[data-summary-panel]");
  const close = summary.querySelector("[data-summary-close]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let animation;

  const isOpen = () => toggle.getAttribute("aria-expanded") === "true";

  async function setSummary(open, restoreFocus = false) {
    if (open === isOpen()) return;

    animation?.cancel();
    panel.hidden = false;
    summary.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    panel.inert = !open;

    if (!reducedMotion.matches) {
      const buttonRect = toggle.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const style = getComputedStyle(panel);
      const right = parseFloat(style.right);
      const collapsed = {
        width: `${buttonRect.width}px`,
        height: `${buttonRect.height}px`,
        right: `${right + panelRect.right - buttonRect.right}px`,
        borderRadius: "40px",
      };
      const expanded = {
        width: `${panelRect.width}px`,
        height: `${panelRect.height}px`,
        right: style.right,
        borderRadius: style.borderRadius,
      };

      panel.classList.add("is-animating");
      animation = panel.animate(open ? [collapsed, expanded] : [expanded, collapsed], {
        duration: 480,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      });

      try {
        await animation.finished;
      } catch {
        return;
      }
    }

    animation = undefined;
    panel.classList.remove("is-animating");
    panel.hidden = !open;
    if (open) panel.focus({ preventScroll: true });
    else if (restoreFocus) toggle.focus({ preventScroll: true });
  }

  toggle.addEventListener("click", () => setSummary(true));
  close.addEventListener("click", () => setSummary(false, true));
  document.addEventListener("click", (event) => {
    if (!summary.contains(event.target)) setSummary(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !isOpen()) return;
    event.preventDefault();
    setSummary(false, true);
  });
})();
