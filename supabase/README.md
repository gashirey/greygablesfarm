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

Legacy `POST /api/subscribe/mailing` and `/sms` still work but are deprecated.

## Delivery inquiries

Run `supabase/migrations/014_delivery_inquiries.sql` for the `delivery_inquiries` table and optional **Send Flowers** nav row.

Email notifications use [Resend](https://resend.com) when configured:

```bash
RESEND_API_KEY=re_...
RESEND_FROM="Grey Gables <notifications@greygablesfarm.com>"
```

Without `RESEND_API_KEY`, inquiries are still saved; email is skipped (check server logs).

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
