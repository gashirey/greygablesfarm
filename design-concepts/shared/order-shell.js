/**
 * Page 1 shell — Create Your Arrangement only.
 * No logistics, card message, or designer notes.
 */
(function () {
  const html = `
    <section class="gg-section" id="arrangement" aria-labelledby="arrangement-heading">
      <header class="gg-section-head">
        <p class="gg-eyebrow">Arrangement</p>
        <h2 id="arrangement-heading">Choose your scale</h2>
        <p class="gg-lede">These options describe scale and abundance — not a guaranteed stem count. Your arrangement will be designed uniquely for you.</p>
      </header>
      <div class="gg-size-list" data-sizes></div>
    </section>

    <section class="gg-section" id="presentation" aria-labelledby="presentation-heading">
      <header class="gg-section-head">
        <p class="gg-eyebrow">Presentation</p>
        <h2 id="presentation-heading">Every arrangement arrives in a vessel</h2>
        <p class="gg-lede">Ready to display — never a wrapped bouquet.</p>
      </header>
      <div data-presentations></div>
      <div class="gg-vessel-panel" data-vessel-panel hidden>
        <h3 class="gg-subhead">Keepsake options</h3>
        <div data-vessel-modes></div>
        <div class="gg-choose-vessel" data-choose-vessel hidden>
          <h4 class="gg-subhead">Currently available vessels</h4>
          <p class="gg-lede">These pieces are rare and limited. Availability changes as vessels are claimed.</p>
          <div class="gg-vessel-grid" data-vessels></div>
        </div>
      </div>
    </section>

    <section class="gg-section" id="inspiration" aria-labelledby="inspiration-heading">
      <header class="gg-section-head">
        <p class="gg-eyebrow">Optional</p>
        <h2 id="inspiration-heading" data-inspiration-title>Share Inspiration (Optional)</h2>
      </header>
      <div data-inspiration></div>
    </section>
  `;

  function inject() {
    document.querySelectorAll("[data-order-shell]").forEach((el) => {
      if (el.dataset.ready) return;
      el.innerHTML = html;
      const omit = (el.getAttribute("data-omit") || "")
        .split(/[\s,]+/)
        .filter(Boolean);
      omit.forEach((id) => {
        el.querySelector(`#${CSS.escape(id)}`)?.remove();
      });

      if (el.getAttribute("data-presentation") === "tight") {
        const head = el.querySelector("#presentation .gg-section-head");
        if (head) {
          head.innerHTML = `
            <p class="gg-eyebrow">Presentation</p>
            <h2 id="presentation-heading">How it arrives</h2>
            <p class="gg-lede">Ready to display in a vessel — never a wrapped bouquet.</p>`;
        }
        el.dataset.presentationTight = "1";
      }

      el.dataset.ready = "1";
    });
  }

  window.GG_injectOrderShell = inject;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }
})();
