# Designer's Choice — Ordering Concepts

Phase 2 prototypes: **two-page flow** (create arrangement → delivery details). No Stripe / production checkout.

## View locally

```bash
cd design-concepts && npx --yes serve -l 4173
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173).

## Flow

| Page | Purpose | CTA |
|------|---------|-----|
| 1 | Create Your Arrangement | Continue with Your Arrangement |
| 2 | Delivery & Personal Details | Review & Complete Order (Page 3 stub) |
| 3 | Secure Checkout | Production later |

Order state persists in `sessionStorage` across Page 1 ↔ Page 2.

## Lead recommendation

**Concept 5c** — scale photo cards + strip gallery + logistics page.

## Config flags

- `allowCustomerVesselChoice` in `shared/config.js` — currently `false` (Designer's Choice vessel only)
- Pricing & vessel upgrades live on each size in `shared/config.js`

See `NOTES-for-production.md`.
