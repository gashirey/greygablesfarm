/**
 * Shared order state for Designer's Choice concepts.
 * Two-page flow with sessionStorage persistence. Prototype only.
 */
(function () {
  const offering = window.GG_activeOffering();
  if (!offering) return;

  const money = window.GG_formatMoney;
  const cfg = window.GG_CONFIG;
  const STORAGE_KEY = "gg_designers_choice_order_v2";

  const defaultState = () => ({
    sizeId: "signature",
    presentationId: "signature-glass",
    vesselMode: "designer-choice",
    vesselId: null,
    inspirationNote: "",
    inspirationPhotos: [],
    isGift: false,
    cardMessage: "",
    noCard: false,
    hidePricing: false,
    designerNotes: "",
    fulfillment: "delivery",
    delivery: {
      recipient: "",
      phone: "",
      address: "",
      city: "",
      state: "VA",
      zip: "",
      date: "",
      instructions: "",
    },
    pickup: {
      name: "",
      phone: "",
      date: "",
      window: cfg.fulfillment.pickupWindows[0],
      instructions: "",
    },
  });

  function loadState() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      return { ...defaultState(), ...JSON.parse(raw) };
    } catch {
      return defaultState();
    }
  }

  const state = loadState();

  function persist() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }

  function pageKind() {
    return document.body.getAttribute("data-page") || "arrangement";
  }

  function size() {
    return offering.sizes.find((s) => s.id === state.sizeId) || offering.sizes[0];
  }

  function presentation() {
    return (
      offering.presentations.find((p) => p.id === state.presentationId) ||
      offering.presentations[0]
    );
  }

  function curatedPresentation() {
    return offering.presentations.find((p) => p.id === "curated-keepsake");
  }

  function allowCustomerVesselChoice() {
    return Boolean(curatedPresentation()?.allowCustomerVesselChoice);
  }

  function selectedVessel() {
    if (state.presentationId !== "curated-keepsake") return null;
    if (state.vesselMode !== "choose-vessel" || !state.vesselId) return null;
    return offering.vessels.find((v) => v.id === state.vesselId) || null;
  }

  function curatedVesselUpgradeForSize() {
    return Number(size().vesselUpgrade) || 0;
  }

  function vesselUpgrade() {
    if (presentation().id !== "curated-keepsake") return 0;
    const v = selectedVessel();
    if (v) return v.price;
    return curatedVesselUpgradeForSize();
  }

  function deliveryFee() {
    return state.fulfillment === "delivery" ? cfg.fulfillment.deliveryFee : 0;
  }

  function estimatedTax() {
    return 0; // placeholder
  }

  function totals() {
    const arrangement = size().price;
    const vessel = vesselUpgrade();
    const delivery = deliveryFee();
    const tax = estimatedTax();
    const subtotal = arrangement + vessel;
    return {
      arrangement,
      vessel,
      delivery,
      tax,
      subtotal,
      total: subtotal + delivery + tax,
    };
  }

  function presentationLabel() {
    const p = presentation();
    if (p.id === "signature-glass") return p.name;
    const v = selectedVessel();
    if (v) return `${p.name} — ${v.name}`;
    if (state.vesselMode === "designer-choice")
      return `${p.name} — Designer's Choice`;
    return p.name;
  }

  function requestedDate() {
    return state.fulfillment === "delivery"
      ? state.delivery.date
      : state.pickup.date;
  }

  function recipientName() {
    return state.fulfillment === "delivery"
      ? state.delivery.recipient
      : state.pickup.name;
  }

  /* ---------- Size / presentation ---------- */

  function bindSizeButtons(scope) {
    scope.querySelectorAll("[data-size]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.sizeId = btn.getAttribute("data-size");
        refresh();
      });
    });
  }

  function renderSizes(root) {
    root.innerHTML = offering.sizes
      .map((s) => {
        const selected = s.id === state.sizeId;
        return `
        <button type="button" class="gg-option gg-size ${selected ? "is-selected" : ""}"
          data-size="${s.id}" aria-pressed="${selected}">
          <span class="gg-option-top">
            <span class="gg-option-name">${s.name}</span>
            ${s.popular ? '<span class="gg-badge">Most Popular</span>' : ""}
            <span class="gg-option-price">${money(s.price)}</span>
          </span>
          <span class="gg-option-blurb">${s.blurb}</span>
        </button>`;
      })
      .join("");
    bindSizeButtons(root);
  }

  function renderSizeCards(root) {
    root.innerHTML = offering.sizes
      .map((s) => {
        const selected = s.id === state.sizeId;
        return `
        <button type="button" class="gg-size-card ${selected ? "is-selected" : ""}"
          data-size="${s.id}" aria-pressed="${selected}">
          <span class="gg-size-card-photo">
            <img src="${s.image}" alt="${s.imageAlt || s.name}"
              style="object-position: ${s.imagePosition || "50% 50%"}"
              loading="lazy" width="600" height="750" />
          </span>
          <span class="gg-size-card-body">
            <span class="gg-size-card-top">
              <span class="gg-size-card-name">${s.name}</span>
              ${s.popular ? '<span class="gg-badge">Most Popular</span>' : ""}
            </span>
            <span class="gg-size-card-price">${money(s.price)}</span>
            <span class="gg-size-card-blurb">${s.blurb}</span>
          </span>
        </button>`;
      })
      .join("");
    bindSizeButtons(root);
  }

  function renderPresentations(root) {
    const tight = Boolean(
      document.querySelector("[data-order-shell][data-presentation-tight]")
    );
    root.innerHTML = offering.presentations
      .map((p) => {
        const selected = p.id === state.presentationId;
        const upgrade = curatedVesselUpgradeForSize();
        const priceLabel = p.included
          ? "Included"
          : `+ ${money(p.id === "curated-keepsake" ? upgrade : p.price)}`;
        const blurb =
          tight && p.shortDescription ? p.shortDescription : p.description;
        return `
        <button type="button" class="gg-option gg-presentation ${selected ? "is-selected" : ""}"
          data-presentation="${p.id}" aria-pressed="${selected}">
          <span class="gg-option-top">
            <span class="gg-option-name">${p.name}</span>
            <span class="gg-option-price">${priceLabel}</span>
          </span>
          <span class="gg-option-blurb">${blurb}</span>
        </button>`;
      })
      .join("");

    root.querySelectorAll("[data-presentation]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.presentationId = btn.getAttribute("data-presentation");
        if (state.presentationId !== "curated-keepsake") {
          state.vesselId = null;
          state.vesselMode = "designer-choice";
        }
        refresh();
      });
    });
  }

  function renderVesselModes(root) {
    const wrap = root.closest("[data-vessel-panel]") || root.parentElement;
    const curated = state.presentationId === "curated-keepsake";
    const canChoose = allowCustomerVesselChoice();

    if (!canChoose) {
      state.vesselMode = "designer-choice";
      state.vesselId = null;
      if (wrap) wrap.hidden = true;
      return;
    }

    if (wrap) wrap.hidden = !curated;
    if (!curated) return;

    const modes = curatedPresentation()?.vesselModes || [];
    root.innerHTML = modes
      .map((m) => {
        const selected = m.id === state.vesselMode;
        return `
        <button type="button" class="gg-option gg-vessel-mode ${selected ? "is-selected" : ""}"
          data-vessel-mode="${m.id}" aria-pressed="${selected}">
          <span class="gg-option-top">
            <span class="gg-option-name">${m.name}</span>
            ${m.recommended ? '<span class="gg-badge">Recommended</span>' : ""}
          </span>
          <span class="gg-option-blurb">${m.description}</span>
        </button>`;
      })
      .join("");

    root.querySelectorAll("[data-vessel-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.vesselMode = btn.getAttribute("data-vessel-mode");
        if (state.vesselMode !== "choose-vessel") state.vesselId = null;
        refresh();
      });
    });
  }

  function renderVessels(root) {
    const panel = root.closest("[data-choose-vessel]") || root.parentElement;
    const show =
      allowCustomerVesselChoice() &&
      state.presentationId === "curated-keepsake" &&
      state.vesselMode === "choose-vessel";
    if (panel) panel.hidden = !show;
    if (!show) return;

    root.innerHTML = offering.vessels
      .map((v) => {
        const selected = v.id === state.vesselId;
        const unavailable = !v.available;
        return `
        <button type="button"
          class="gg-vessel ${selected ? "is-selected" : ""} ${unavailable ? "is-unavailable" : ""}"
          data-vessel="${v.id}" ${unavailable ? "disabled" : ""}
          aria-pressed="${selected}">
          <span class="gg-vessel-photo">
            <img src="${v.image}" alt="${v.alt}" loading="lazy" width="400" height="400"
              style="object-position: ${v.imagePosition || "50% 50%"}" />
          </span>
          <span class="gg-vessel-meta">
            <span class="gg-vessel-name">${v.name}</span>
            <span class="gg-vessel-price">${money(v.price)}</span>
            <span class="gg-vessel-avail">${v.available ? "Available" : "Currently unavailable"}</span>
          </span>
        </button>`;
      })
      .join("");

    root.querySelectorAll("[data-vessel]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        state.vesselId = btn.getAttribute("data-vessel");
        refresh();
      });
    });
  }

  function renderGallery(root) {
    const { gallery } = cfg;
    root.innerHTML = gallery.items
      .map(
        (item, i) => `
      <button type="button" class="gg-gallery-item" data-gallery-index="${i}"
        aria-label="View past arrangement: ${item.alt}">
        <img src="${item.thumb}" alt="${item.alt}" loading="lazy" width="600" height="750"
          style="object-position: ${item.position || "50% 50%"}" />
        ${
          item.labels?.length
            ? `<span class="gg-gallery-labels">${item.labels
                .map((l) => `<span class="gg-label">${l}</span>`)
                .join("")}</span>`
            : ""
        }
      </button>`
      )
      .join("");

    root.querySelectorAll("[data-gallery-index]").forEach((btn) => {
      btn.addEventListener("click", () => {
        openLightbox(Number(btn.getAttribute("data-gallery-index")));
      });
    });
  }

  function renderInspiration(root) {
    const max = cfg.inspiration.maxPhotos;
    root.innerHTML = `
      <p class="gg-lede">${cfg.inspiration.copy}</p>
      <label class="gg-field">
        <span class="gg-field-label">Note (optional)</span>
        <textarea data-inspiration-note rows="3" maxlength="400"
          placeholder="What caught your eye — a color, a mood, a feeling…">${state.inspirationNote}</textarea>
      </label>
      <div class="gg-inspire-photos" role="group" aria-label="Select up to ${max} inspiration photos">
        <p class="gg-field-label">Or select up to ${max} photos from our work</p>
        <div class="gg-inspire-grid">
          ${cfg.gallery.items
            .map((item) => {
              const on = state.inspirationPhotos.includes(item.id);
              return `
              <button type="button" class="gg-inspire-thumb ${on ? "is-selected" : ""}"
                data-inspire="${item.id}" aria-pressed="${on}">
                <img src="${item.thumb}" alt="" />
              </button>`;
            })
            .join("")}
        </div>
        <p class="gg-hint">${state.inspirationPhotos.length} of ${max} selected</p>
      </div>`;

    root.querySelector("[data-inspiration-note]")?.addEventListener("input", (e) => {
      state.inspirationNote = e.target.value;
      persist();
      renderSummary();
    });

    root.querySelectorAll("[data-inspire]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-inspire");
        const idx = state.inspirationPhotos.indexOf(id);
        if (idx >= 0) state.inspirationPhotos.splice(idx, 1);
        else if (state.inspirationPhotos.length < max)
          state.inspirationPhotos.push(id);
        refresh();
      });
    });
  }

  /* ---------- Summaries ---------- */

  function renderArrangementSummary() {
    const t = totals();
    const next = document.body.getAttribute("data-next-page") || "#";
    const html = `
      <div class="gg-summary-inner">
        <p class="gg-summary-eyebrow">Your arrangement</p>
        <h3 class="gg-summary-title">${offering.shortName}</h3>
        <dl class="gg-summary-list">
          <div><dt>Scale</dt><dd>${size().name}</dd></div>
          <div><dt>Presentation</dt><dd>${presentationLabel()}</dd></div>
          <div><dt>Arrangement</dt><dd>${money(t.arrangement)}</dd></div>
          ${
            t.vessel
              ? `<div><dt>Curated vessel</dt><dd>+ ${money(t.vessel)}</dd></div>`
              : ""
          }
          <div><dt>Subtotal</dt><dd>${money(t.subtotal)}</dd></div>
        </dl>
        <div class="gg-summary-total">
          <span>Current total</span>
          <strong>${money(t.subtotal)}</strong>
        </div>
        <a class="gg-btn gg-btn-primary" href="${next}" data-continue-arrangement>
          Continue with Your Arrangement
        </a>
        <p class="gg-prototype-note">Next: delivery &amp; personal details.</p>
      </div>`;

    document.querySelectorAll("[data-order-summary]").forEach((node) => {
      node.innerHTML = html;
    });
    document.querySelectorAll("[data-mobile-total]").forEach((el) => {
      el.textContent = money(t.subtotal);
    });
  }

  function renderArrangementRecap() {
    const t = totals();
    const back = document.body.getAttribute("data-back-page") || "#";
    document.querySelectorAll("[data-arrangement-recap]").forEach((node) => {
      node.innerHTML = `
        <div class="gg-recap">
          <p class="gg-summary-eyebrow">Your Arrangement</p>
          <p class="gg-recap-line"><strong>${size().name}</strong> arrangement</p>
          <p class="gg-recap-line">${presentationLabel()}</p>
          <p class="gg-recap-line">Subtotal ${money(t.subtotal)}</p>
          <a class="gg-recap-edit" href="${back}">Edit Arrangement</a>
        </div>`;
    });
  }

  function renderReviewSummary() {
    const t = totals();
    const method =
      state.fulfillment === "delivery" ? "Local Delivery" : "Farm Pickup";
    const date = requestedDate() || "—";
    const who = recipientName() || "—";

    const html = `
      <dl class="gg-summary-list gg-review-list">
        <div><dt>Arrangement</dt><dd>${offering.shortName}</dd></div>
        <div><dt>Scale</dt><dd>${size().name}</dd></div>
        <div><dt>Presentation</dt><dd>${presentationLabel()}</dd></div>
        ${
          t.vessel
            ? `<div><dt>Curated vessel</dt><dd>+ ${money(t.vessel)}</dd></div>`
            : ""
        }
        <div><dt>Delivery method</dt><dd>${method}</dd></div>
        <div><dt>Requested date</dt><dd>${date}</dd></div>
        <div><dt>Recipient</dt><dd>${who}</dd></div>
        <div><dt>Arrangement</dt><dd>${money(t.arrangement)}</dd></div>
        ${
          t.delivery
            ? `<div><dt>Delivery fee</dt><dd>+ ${money(t.delivery)}</dd></div>`
            : `<div><dt>Delivery fee</dt><dd>None</dd></div>`
        }
        <div><dt>Estimated tax</dt><dd>${
          t.tax ? money(t.tax) : "—"
        } <span class="gg-hint">(placeholder)</span></dd></div>
      </dl>
      <div class="gg-summary-total">
        <span>Total</span>
        <strong>${money(t.total)}</strong>
      </div>`;

    document.querySelectorAll("[data-review-summary]").forEach((n) => {
      n.innerHTML = html;
    });
    document.querySelectorAll("[data-order-summary]").forEach((n) => {
      n.innerHTML = `
        <div class="gg-summary-inner">
          <p class="gg-summary-eyebrow">Order summary</p>
          <h3 class="gg-summary-title">${size().name}</h3>
          ${html}
        </div>`;
    });
    document.querySelectorAll("[data-mobile-total]").forEach((el) => {
      el.textContent = money(t.total);
    });
  }

  function renderSummary() {
    if (pageKind() === "delivery") {
      renderArrangementRecap();
      renderReviewSummary();
    } else {
      renderArrangementSummary();
    }
  }

  /* ---------- Delivery page binders ---------- */

  function refreshFulfillmentUI() {
    const delivery = document.querySelector("[data-panel-delivery]");
    const pickup = document.querySelector("[data-panel-pickup]");
    if (delivery) delivery.hidden = state.fulfillment !== "delivery";
    if (pickup) pickup.hidden = state.fulfillment !== "pickup";

    document.querySelectorAll("[data-fulfillment]").forEach((btn) => {
      const on = btn.getAttribute("data-fulfillment") === state.fulfillment;
      btn.classList.toggle("is-selected", on);
      btn.setAttribute("aria-pressed", String(on));
    });
  }

  function refreshGiftUI() {
    document.querySelectorAll("[data-is-gift]").forEach((btn) => {
      const yes = btn.getAttribute("data-is-gift") === "yes";
      const on = yes === state.isGift;
      btn.classList.toggle("is-selected", on);
      btn.setAttribute("aria-pressed", String(on));
    });
    const hideWrap = document.querySelector("[data-hide-pricing-wrap]");
    if (hideWrap) hideWrap.hidden = !state.isGift;
  }

  function bindDeliveryForms() {
    document.querySelectorAll("[data-fulfillment]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.fulfillment = btn.getAttribute("data-fulfillment");
        refresh();
      });
    });

    document.querySelectorAll("[data-is-gift]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.isGift = btn.getAttribute("data-is-gift") === "yes";
        if (!state.isGift) state.hidePricing = false;
        refresh();
      });
    });

    const map = [
      ["[data-delivery-recipient]", "delivery", "recipient"],
      ["[data-delivery-phone]", "delivery", "phone"],
      ["[data-delivery-address]", "delivery", "address"],
      ["[data-delivery-city]", "delivery", "city"],
      ["[data-delivery-state]", "delivery", "state"],
      ["[data-delivery-zip]", "delivery", "zip"],
      ["[data-delivery-date]", "delivery", "date"],
      ["[data-delivery-instructions]", "delivery", "instructions"],
      ["[data-pickup-name]", "pickup", "name"],
      ["[data-pickup-phone]", "pickup", "phone"],
      ["[data-pickup-date]", "pickup", "date"],
      ["[data-pickup-window]", "pickup", "window"],
      ["[data-pickup-instructions]", "pickup", "instructions"],
    ];

    map.forEach(([sel, group, key]) => {
      const el = document.querySelector(sel);
      if (!el) return;
      if (state[group][key] != null && state[group][key] !== "") {
        el.value = state[group][key];
      }
      const sync = () => {
        state[group][key] = el.value;
        persist();
        renderSummary();
      };
      el.addEventListener("input", sync);
      el.addEventListener("change", sync);
    });

    const windowSelect = document.querySelector("[data-pickup-window]");
    if (windowSelect && windowSelect.tagName === "SELECT") {
      windowSelect.innerHTML = cfg.fulfillment.pickupWindows
        .map(
          (w) =>
            `<option value="${w}" ${
              w === state.pickup.window ? "selected" : ""
            }>${w}</option>`
        )
        .join("");
    }

    const card = document.querySelector("[data-card-message]");
    const noCard = document.querySelector("[data-no-card]");
    const hidePricing = document.querySelector("[data-hide-pricing]");
    const notes = document.querySelector("[data-designer-notes]");
    const max = cfg.cardMessage.maxLength;

    if (card) {
      card.value = state.cardMessage;
      card.setAttribute("maxlength", String(max));
      const counter = document.querySelector("[data-card-count]");
      const sync = () => {
        state.cardMessage = card.value;
        if (counter) counter.textContent = `${card.value.length} / ${max}`;
        persist();
      };
      card.addEventListener("input", sync);
      sync();
    }

    if (noCard) {
      noCard.checked = state.noCard;
      noCard.addEventListener("change", () => {
        state.noCard = noCard.checked;
        if (card) {
          card.disabled = state.noCard;
          if (state.noCard) {
            card.value = "";
            state.cardMessage = "";
          }
        }
        persist();
      });
      if (card) card.disabled = state.noCard;
    }

    if (hidePricing) {
      hidePricing.checked = state.hidePricing;
      hidePricing.addEventListener("change", () => {
        state.hidePricing = hidePricing.checked;
        persist();
      });
    }

    if (notes) {
      notes.value = state.designerNotes;
      notes.addEventListener("input", () => {
        state.designerNotes = notes.value;
        persist();
      });
    }

    const back = document.body.getAttribute("data-back-page") || "#";
    document.querySelectorAll("[data-back-arrangement]").forEach((a) => {
      a.setAttribute("href", back);
    });

    document.querySelectorAll("[data-cta-checkout]").forEach((btn) => {
      btn.addEventListener("click", () => {
        alert(
          "Page 3 — Secure Checkout — will be designed in production. This prototype ends here."
        );
      });
    });
  }

  /* ---------- Lightbox ---------- */

  let lightboxIndex = 0;

  function ensureLightbox() {
    if (document.getElementById("gg-lightbox")) return;
    const el = document.createElement("div");
    el.id = "gg-lightbox";
    el.className = "gg-lightbox";
    el.hidden = true;
    el.innerHTML = `
      <div class="gg-lightbox-backdrop" data-lightbox-close></div>
      <div class="gg-lightbox-dialog" role="dialog" aria-modal="true" aria-labelledby="gg-lightbox-title">
        <button type="button" class="gg-lightbox-close" data-lightbox-close aria-label="Close">×</button>
        <button type="button" class="gg-lightbox-nav prev" data-lightbox-prev aria-label="Previous image">‹</button>
        <button type="button" class="gg-lightbox-nav next" data-lightbox-next aria-label="Next image">›</button>
        <figure>
          <img id="gg-lightbox-img" src="" alt="" />
          <figcaption>
            <strong id="gg-lightbox-title">${cfg.gallery.lightboxCaption}</strong>
            <span>${cfg.gallery.lightboxNote}</span>
            <span id="gg-lightbox-labels" class="gg-gallery-labels"></span>
          </figcaption>
        </figure>
      </div>`;
    document.body.appendChild(el);
    el.querySelectorAll("[data-lightbox-close]").forEach((b) =>
      b.addEventListener("click", closeLightbox)
    );
    el.querySelector("[data-lightbox-prev]")?.addEventListener("click", () =>
      openLightbox(lightboxIndex - 1)
    );
    el.querySelector("[data-lightbox-next]")?.addEventListener("click", () =>
      openLightbox(lightboxIndex + 1)
    );
  }

  function openLightbox(index) {
    ensureLightbox();
    const items = cfg.gallery.items;
    lightboxIndex = ((index % items.length) + items.length) % items.length;
    const item = items[lightboxIndex];
    const box = document.getElementById("gg-lightbox");
    const img = document.getElementById("gg-lightbox-img");
    const labels = document.getElementById("gg-lightbox-labels");
    img.src = item.src;
    img.alt = item.alt;
    img.style.objectPosition = item.position || "50% 50%";
    labels.innerHTML = (item.labels || [])
      .map((l) => `<span class="gg-label">${l}</span>`)
      .join("");
    box.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    const box = document.getElementById("gg-lightbox");
    if (!box) return;
    box.hidden = true;
    document.body.style.overflow = "";
  }

  document.addEventListener("keydown", (e) => {
    const box = document.getElementById("gg-lightbox");
    if (!box || box.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") openLightbox(lightboxIndex - 1);
    if (e.key === "ArrowRight") openLightbox(lightboxIndex + 1);
  });

  /* ---------- Progress + hero ---------- */

  function injectProgress() {
    document.querySelectorAll("[data-progress]").forEach((el) => {
      if (el.dataset.ready) return;
      const step = pageKind() === "delivery" ? 2 : 1;
      el.innerHTML = `
        <ol class="gg-progress">
          <li class="${step > 1 ? "is-done" : "is-current"}">
            <span class="gg-progress-label">Create Your Arrangement</span>
          </li>
          <li class="${step === 2 ? "is-current" : step > 2 ? "is-done" : ""}">
            <span class="gg-progress-label">Delivery &amp; Personal Details</span>
          </li>
          <li>
            <span class="gg-progress-label">Secure Checkout</span>
          </li>
        </ol>`;
      el.dataset.ready = "1";
    });
  }

  function injectHeroCopy() {
    document.querySelectorAll("[data-hero-eyebrow]").forEach((el) => {
      el.textContent = cfg.hero.eyebrow;
    });
    document.querySelectorAll("[data-hero-title]").forEach((el) => {
      el.textContent = cfg.hero.title;
    });
    document.querySelectorAll("[data-hero-lead]").forEach((el) => {
      el.textContent = cfg.hero.lead;
    });
    document.querySelectorAll("[data-hero-supporting]").forEach((el) => {
      el.textContent = cfg.hero.supporting;
    });
    document.querySelectorAll("[data-gallery-title]").forEach((el) => {
      el.textContent = cfg.gallery.title;
    });
    document.querySelectorAll("[data-gallery-copy]").forEach((el) => {
      el.textContent = cfg.gallery.copy;
    });
    document.querySelectorAll("[data-inspiration-title]").forEach((el) => {
      el.textContent = cfg.inspiration.title;
    });
  }

  function refresh() {
    const sizeCards = document.querySelector("[data-size-cards]");
    const sizes = document.querySelector("[data-sizes]");
    const presentations = document.querySelector("[data-presentations]");
    const vesselModes = document.querySelector("[data-vessel-modes]");
    const vessels = document.querySelector("[data-vessels]");
    const gallery = document.querySelector("[data-gallery]");
    const inspiration = document.querySelector("[data-inspiration]");

    if (sizeCards) renderSizeCards(sizeCards);
    else if (sizes) renderSizes(sizes);
    if (presentations) renderPresentations(presentations);
    if (vesselModes) renderVesselModes(vesselModes);
    if (vessels) renderVessels(vessels);
    if (gallery && !gallery.dataset.bound) {
      renderGallery(gallery);
      gallery.dataset.bound = "1";
    }
    if (inspiration) renderInspiration(inspiration);

    refreshFulfillmentUI();
    refreshGiftUI();
    renderSummary();
    persist();
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (typeof window.GG_injectOrderShell === "function") {
      window.GG_injectOrderShell();
    }
    if (typeof window.GG_injectDeliveryShell === "function") {
      window.GG_injectDeliveryShell();
    }
    injectProgress();
    injectHeroCopy();
    if (pageKind() === "delivery") bindDeliveryForms();
    refresh();
    window.GG_ORDER = { state, totals, refresh, persist };
  });
})();
