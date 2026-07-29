/** Horizontal gallery strip controls for Concept 5 family */
document.addEventListener("DOMContentLoaded", () => {
  const strip = document.querySelector(".gg-gallery-strip");
  const prev = document.querySelector("[data-strip-prev]");
  const next = document.querySelector("[data-strip-next]");
  if (!strip || !prev || !next) return;

  const step = () => {
    const item = strip.querySelector(".gg-gallery-item");
    return item
      ? item.getBoundingClientRect().width + 8
      : strip.clientWidth * 0.75;
  };

  const sync = () => {
    const max = strip.scrollWidth - strip.clientWidth - 2;
    prev.disabled = strip.scrollLeft <= 2;
    next.disabled = strip.scrollLeft >= max;
  };

  prev.addEventListener("click", () => {
    strip.scrollBy({ left: -step(), behavior: "smooth" });
  });
  next.addEventListener("click", () => {
    strip.scrollBy({ left: step(), behavior: "smooth" });
  });
  strip.addEventListener("scroll", sync, { passive: true });
  window.addEventListener("resize", sync);
  requestAnimationFrame(sync);
  setTimeout(sync, 250);
});
