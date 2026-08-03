# Stripe env checklist (Grey Gables — test mode first)

## Local (`.env.local`)

1. Open [Stripe Dashboard → API keys](https://dashboard.stripe.com/test/apikeys) in **Test mode**.
2. Paste into `.env.local`:
   - `STRIPE_SECRET_KEY=sk_test_...`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...`
3. Log in CLI: `stripe login` (pair in browser).
4. Forward webhooks:
   ```bash
   stripe listen --forward-to 127.0.0.1:3000/api/stripe/webhook
   ```
   Copy the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`.
5. Restart Next (`npm run dev`) so env is reloaded.
6. Verify (no secret values printed):
   ```bash
   node scripts/check-ss-stripe.mjs
   ```

## Vercel

- `NEXT_PUBLIC_SITE_URL=https://greygablesfarm.com` — set on Production + Preview.
- Stripe keys: add when available (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`).
- Production webhook secret is **different** from CLI listen:
  1. Dashboard → Developers → Webhooks → Add endpoint  
     `https://greygablesfarm.com/api/stripe/webhook`
  2. Event: `checkout.session.completed`
  3. Put that endpoint’s `whsec_...` in Vercel Production as `STRIPE_WEBHOOK_SECRET`
- Prefer **test** keys until launch; switch to `sk_live_` / `pk_live_` later.

## Smoke / Live verification

1. Set `SMOKE_ORDER_SECRET` (and `RESEND_API_KEY` for confirmation emails) on Vercel Production.
2. **Full order path (preferred):** https://greygablesfarm.com/order/test  
   - Unlock with the secret  
   - $2 arrangement + ZIP `27606` → $2 delivery ($4 total)  
   - Real `ss_orders` + webhook fulfill + buyer/farm confirmation emails
3. **Bare Stripe charge only:** https://greygablesfarm.com/order/smoke ($5/$7, no order row, no email)

```bash
curl -sS -X POST http://127.0.0.1:3000/api/order/checkout \
  -H 'content-type: application/json' \
  -d '{}'
```

Expect a validation error once Stripe is configured (not “Payment is not configured”).
