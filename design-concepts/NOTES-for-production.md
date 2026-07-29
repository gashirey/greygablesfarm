# Notes for production build

Captured during Phase 1–2 concept review (July 2026).

**Status (July 2026):** Production `/order` uses Concept 5c two-page flow.
Editable chrome: Admin → Site → **Order flowers**. Scales/prices: Admin → Order → Products.
Apply `supabase/migrations/032_designers_choice_scales.sql` for Classic/Signature/Grand + upgrade cents.

## Experience stages (Phase 2)

Three mental stages — do not collapse into one long form:

1. **Create Your Arrangement** — scale, presentation, gallery, optional inspiration
2. **Delivery & Personal Details** — fulfillment, gift/card, designer notes
3. **Secure Checkout** — contact, billing, payment (not prototyped)

Primary Page 1 CTA: “Continue with Your Arrangement” (not “Checkout”).

## Vessel selection: configurable on/off

**Intent:** While vessel inventory is being built, keep curated presentation as **Designer's Choice** only (Andrea / designer selects the vessel).

**Later:** Add an admin / config flag to show or hide **Choose Your Vessel** (customer picks from available inventory).

Suggested shape when building:

- Config flag on the Designer's Choice offering, e.g. `allowCustomerVesselChoice: false`
- When `false`: Curated Keepsake Vessel → Designer's Choice only (no vessel gallery)
- When `true`: Designer's Choice + Choose Your Vessel + inventory gallery
- Signature Glass Vase (included) stays unchanged either way

Prototype currently has `allowCustomerVesselChoice: false` in `shared/config.js`.

## Pricing (as of July 2026 review)

| Scale | Arrangement | Curated vessel upgrade |
|-------|-------------|------------------------|
| Classic | $150 | +$40 |
| Signature | $225 | +$50 |
| Grand | $350 | +$75 |
