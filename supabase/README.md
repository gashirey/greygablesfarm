# Supabase — unified contacts

One **contacts** table holds each person. Email and SMS are opt-in attributes (`email_opt_in`, `sms_opt_in`), not separate lists. **contact_tags** drive segmentation; **contact_activity** logs events.

## 1. Create a Supabase project

1. [supabase.com](https://supabase.com) → New project.
2. Copy **Project URL** and **secret** key (`sb_secret_…` or legacy `service_role` JWT).

## 2. Run migrations

In **SQL Editor**, run in order:

1. `supabase/migrations/001_mailing_and_sms_lists.sql` — only if you already used the old lists
2. `supabase/migrations/002_unified_contacts.sql` — **required**
3. `supabase/migrations/003_migrate_legacy_lists.sql` — optional, if you have rows in `mailing_list` / `sms_list`

## 3. Environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

Add the same in **Vercel**. Never expose the secret key to the browser.

## 4. API routes

| Route | Purpose |
|-------|---------|
| `POST /api/contacts` | General upsert (any form) |
| `POST /api/subscribe` | Footer newsletter signup |
| `POST /api/contact` | Contact page inquiry |
| `POST /api/delivery-inquiry` | Send Flowers delivery inquiry |
| `POST /api/blooms-booking` | Photos in the Blooms date-night booking |

Legacy `POST /api/subscribe/mailing` and `/sms` still work but are deprecated.

## Photos in the Blooms bookings

Run `supabase/migrations/018_blooms_bookings.sql` for the `blooms_bookings` table.

Page: `/photos-in-the-blooms`

### Stripe (optional — same account as Rooted)

You can reuse the **same Stripe account** used for Rooted Farmers / Shopify. Create a separate product in the Stripe Dashboard (or let Checkout create one inline). Add to Vercel / `.env.local`:

```bash
STRIPE_SECRET_KEY=sk_live_...          # or sk_test_... for sandbox
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...        # endpoint: /api/stripe/webhook
NEXT_PUBLIC_SITE_URL=https://greygablesfarm.com
```

Optional fallback without Checkout API — paste a [Payment Link](https://dashboard.stripe.com/payment-links) URL:

```bash
STRIPE_BLOOMS_PAYMENT_LINK=https://buy.stripe.com/...
```

When Stripe keys are set, the booking form redirects to Checkout after saving the request. The webhook marks bookings as paid.

## Delivery inquiries

Run `supabase/migrations/014_delivery_inquiries.sql` for the `delivery_inquiries` table and optional **Send Flowers** nav row.

Email notifications use [Resend](https://resend.com) when configured:

```bash
RESEND_API_KEY=re_...
RESEND_FROM="Grey Gables <notifications@greygablesfarm.com>"
```

Without `RESEND_API_KEY`, inquiries are still saved; email is skipped (check server logs).

View all form submissions in the site admin at **/admin/inquiries** (contact, delivery, and blooms).

## Found / Artful Lodger QR campaign

Run `supabase/migrations/019_artful_lodger_campaign.sql` and `021_al_campaign_found.sql` (or set in **/admin/campaigns**):

- Page: `/found`
- Short link: `/al` → `/found`

## Media library dimensions

Run `supabase/migrations/020_media_asset_dimensions.sql` to store `width` / `height` on `media_assets` (landscape / portrait filter on **/admin/media**). New uploads save sizes automatically; existing images are scanned when you open a shoot.

## Homepage slideshow speed

Run `supabase/migrations/022_hero_slide_interval.sql` to add `hero_slide_interval_ms` on `site_settings`. Adjust in **Admin → Site editor → Appearance** (Homepage hero layout).

## 5. Segmentation examples

```sql
-- Wedding leads with email opt-in
select c.* from contacts c
join contact_tags t on t.contact_id = c.id
where t.tag = 'wedding_inquiry' and c.email_opt_in = true;

-- SMS-ready flower customers
select c.* from contacts c
join contact_tags t on t.contact_id = c.id
where t.tag = 'flowers' and c.sms_opt_in = true;
```

## 6. Verify locally

1. `npm run dev`
2. Footer sign-up (choose email and/or text opt-in)
3. Contact page message
4. **Table Editor** → `contacts`, `contact_tags`, `contact_activity`

## Dedup & review

- Match by **email** or **phone** updates the same row.
- If email and phone match **different** rows, both are flagged `needs_review` and the user sees a friendly error.
- Opt-ins are only set when explicitly checked; inquiries do not enable marketing without consent.
