/**
 * Page 2 shell — Delivery & Personal Details.
 */
(function () {
  const cfg = window.GG_CONFIG;

  const html = `
    <section class="gg-section" id="arrive" aria-labelledby="arrive-heading">
      <header class="gg-section-head">
        <p class="gg-eyebrow">Fulfillment</p>
        <h2 id="arrive-heading">How should your arrangement arrive?</h2>
      </header>
      <div class="gg-arrive-cards" role="group" aria-label="Fulfillment method">
        <button type="button" class="gg-arrive-card is-selected" data-fulfillment="delivery" aria-pressed="true">
          <span class="gg-arrive-card-name">Local Delivery</span>
          <span class="gg-arrive-card-blurb">We bring your arrangement to the recipient.</span>
        </button>
        <button type="button" class="gg-arrive-card" data-fulfillment="pickup" aria-pressed="false">
          <span class="gg-arrive-card-name">Farm Pickup</span>
          <span class="gg-arrive-card-blurb">Collect at Grey Gables Farm in Louisa.</span>
        </button>
      </div>

      <div data-panel-delivery class="gg-fulfill-panel">
        <p class="gg-lede">${cfg.fulfillment.deliveryNote}</p>
        <div class="gg-field-grid">
          <label class="gg-field">
            <span class="gg-field-label">Recipient name</span>
            <input type="text" data-delivery-recipient autocomplete="name" />
          </label>
          <label class="gg-field">
            <span class="gg-field-label">Recipient phone</span>
            <input type="tel" data-delivery-phone autocomplete="tel" />
          </label>
          <label class="gg-field gg-field-span">
            <span class="gg-field-label">Street address</span>
            <input type="text" data-delivery-address autocomplete="street-address" />
          </label>
          <label class="gg-field">
            <span class="gg-field-label">City</span>
            <input type="text" data-delivery-city autocomplete="address-level2" />
          </label>
          <label class="gg-field">
            <span class="gg-field-label">State</span>
            <input type="text" data-delivery-state autocomplete="address-level1" value="VA" />
          </label>
          <label class="gg-field">
            <span class="gg-field-label">ZIP</span>
            <input type="text" data-delivery-zip autocomplete="postal-code" />
          </label>
          <label class="gg-field">
            <span class="gg-field-label">Requested delivery date</span>
            <input type="date" data-delivery-date />
          </label>
          <label class="gg-field">
            <span class="gg-field-label">Preferred window</span>
            <select data-delivery-window disabled aria-disabled="true">
              <option>Coming soon</option>
            </select>
            <span class="gg-hint">Placeholder for a future enhancement.</span>
          </label>
          <label class="gg-field gg-field-span">
            <span class="gg-field-label">Delivery instructions</span>
            <textarea data-delivery-instructions rows="2" placeholder="Gate code, porch preference, leave with neighbor…"></textarea>
          </label>
        </div>
      </div>

      <div data-panel-pickup class="gg-fulfill-panel" hidden>
        <p class="gg-lede">${cfg.fulfillment.pickupNote}</p>
        <div class="gg-field-grid">
          <label class="gg-field">
            <span class="gg-field-label">Pickup name</span>
            <input type="text" data-pickup-name autocomplete="name" />
          </label>
          <label class="gg-field">
            <span class="gg-field-label">Phone number</span>
            <input type="tel" data-pickup-phone autocomplete="tel" />
          </label>
          <label class="gg-field">
            <span class="gg-field-label">Requested pickup date</span>
            <input type="date" data-pickup-date />
          </label>
          <label class="gg-field">
            <span class="gg-field-label">Preferred pickup window</span>
            <select data-pickup-window></select>
          </label>
          <label class="gg-field gg-field-span">
            <span class="gg-field-label">Pickup instructions</span>
            <textarea data-pickup-instructions rows="2"></textarea>
          </label>
        </div>
      </div>
    </section>

    <section class="gg-section" id="gift" aria-labelledby="gift-heading">
      <header class="gg-section-head">
        <p class="gg-eyebrow">Gift</p>
        <h2 id="gift-heading">Is this arrangement a gift?</h2>
      </header>
      <div class="gg-chips" role="group" aria-label="Gift">
        <button type="button" class="gg-chip" data-is-gift="yes" aria-pressed="false">Yes</button>
        <button type="button" class="gg-chip is-selected" data-is-gift="no" aria-pressed="true">No</button>
      </div>

      <div data-gift-fields class="gg-gift-fields">
        <p class="gg-lede">Keep it short and personal.</p>
        <label class="gg-check" data-hide-pricing-wrap hidden>
          <input type="checkbox" data-hide-pricing />
          <span>Do not include pricing</span>
        </label>
        <label class="gg-field">
          <span class="gg-field-label">Card message (optional)</span>
          <textarea data-card-message rows="3" placeholder="${cfg.cardMessage.placeholder}"></textarea>
          <span class="gg-hint" data-card-count>0 / ${cfg.cardMessage.maxLength}</span>
        </label>
        <label class="gg-check">
          <input type="checkbox" data-no-card />
          <span>No card message</span>
        </label>
      </div>
    </section>

    <section class="gg-section" id="designer" aria-labelledby="designer-heading">
      <header class="gg-section-head">
        <p class="gg-eyebrow">For our designer</p>
        <h2 id="designer-heading">Anything helpful for our designer to know?</h2>
        <p class="gg-lede">Share the occasion, a feeling you'd like the arrangement to convey, or anything we should avoid. Flower varieties and exact colors cannot be guaranteed—we'll always design using the freshest and most beautiful flowers available. This is guidance, not instructions.</p>
      </header>
      <label class="gg-field">
        <span class="gg-field-label">Notes</span>
        <textarea data-designer-notes rows="4" placeholder="${cfg.designerNotes.placeholder}"></textarea>
      </label>
    </section>

    <section class="gg-section" id="review" aria-labelledby="review-heading">
      <header class="gg-section-head">
        <p class="gg-eyebrow">Review</p>
        <h2 id="review-heading">Before you continue</h2>
      </header>
      <div data-review-summary></div>
      <div class="gg-review-actions">
        <a class="gg-btn gg-btn-ghost" data-back-arrangement href="#">Back to Arrangement</a>
        <button type="button" class="gg-btn gg-btn-primary" data-cta-checkout>
          Review &amp; Complete Order
        </button>
      </div>
      <p class="gg-prototype-note">Prototype only — secure checkout (Page 3) is not connected yet.</p>
    </section>
  `;

  function inject() {
    document.querySelectorAll("[data-delivery-shell]").forEach((el) => {
      if (el.dataset.ready) return;
      el.innerHTML = html;
      el.dataset.ready = "1";
    });
  }

  window.GG_injectDeliveryShell = inject;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }
})();
