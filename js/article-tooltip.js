(() => {
  const margin = 18;
  const gap = 11.2;
  let active;
  let dismissTimer;

  function hideTooltip() {
    window.clearTimeout(dismissTimer);
    if (!active) return;
    active.tooltip.hidden = true;
    active.tooltip.classList.remove("is-visible");
    active = undefined;
  }

  function showTooltip(term, tooltip) {
    window.clearTimeout(dismissTimer);
    if (active?.term === term) return;
    hideTooltip();
    active = { term, tooltip };
    tooltip.hidden = false;

    const anchor = term.getBoundingClientRect();
    const bubble = tooltip.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const center = anchor.left + anchor.width / 2;
    const left = Math.max(margin, Math.min(center - bubble.width / 2, viewportWidth - bubble.width - margin));
    const below = anchor.bottom + gap;
    const above = below + bubble.height + margin > viewportHeight && anchor.top > viewportHeight - anchor.bottom;
    const preferredTop = above ? anchor.top - gap - bubble.height : below;
    const top = Math.max(0, Math.min(preferredTop, viewportHeight - bubble.height));
    const arrow = Math.max(margin, Math.min(center - left, bubble.width - margin));

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.style.setProperty("--tooltip-arrow", `${arrow}px`);
    tooltip.classList.toggle("is-above", above);
    tooltip.classList.add("is-visible");
  }

  function scheduleDismiss() {
    window.clearTimeout(dismissTimer);
    dismissTimer = window.setTimeout(hideTooltip, 140);
  }

  document.querySelectorAll("[data-term]").forEach((term) => {
    const tooltip = document.getElementById(term.getAttribute("aria-describedby"));
    const show = () => showTooltip(term, tooltip);

    term.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "touch") show();
    });
    term.addEventListener("pointerleave", (event) => {
      if (event.pointerType !== "touch") scheduleDismiss();
    });
    term.addEventListener("focus", () => {
      if (term.matches(":focus-visible")) show();
    });
    term.addEventListener("blur", scheduleDismiss);
    term.addEventListener("click", show);

    tooltip.addEventListener("pointerenter", () => window.clearTimeout(dismissTimer));
    tooltip.addEventListener("pointerleave", (event) => {
      if (event.pointerType !== "touch") scheduleDismiss();
    });
  });

  document.addEventListener("pointerdown", (event) => {
    if (active && !active.term.contains(event.target) && !active.tooltip.contains(event.target)) hideTooltip();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hideTooltip();
  });
  window.addEventListener("scroll", hideTooltip, { passive: true });
  window.addEventListener("resize", hideTooltip);
})();
