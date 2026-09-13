# Rift Staff Dashboard (staff.rift.baby)

Executive/staff dashboard frontend for the Rift bot. Talks to the bot's
existing Quart API (`cogs/web_server.py`) over the `/api/exec/*` and
`/ws/exec` endpoints.

## Setup

```bash
npm install
cp .env.example .env
# edit .env -- set VITE_API_BASE to your bot's API URL (e.g. https://api.rift.baby)
npm run dev
```

## Access model

This dashboard has its own independent username/password login -- it is
**not** tied to Discord OAuth or Discord permissions. Every capability
(viewing economy stats, restarting the bot, managing other staff, etc.)
is gated by an individual **permission**, not a fixed role. A staff
member's `role` field is just a display label (e.g. "Founder", "Support
Lead") -- what they can actually see and do is entirely determined by
their `permissions` array, editable from the Staff Management page by
anyone holding the `staff.manage` permission.

Full list of permissions lives in `PERMISSION_CATALOG` in the bot's
`cogs/web_server.py`, and is also fetched live from `GET /api/exec/permissions`
so the UI always reflects whatever's defined server-side.

## Creating the first account

There's no one logged in yet to grant the first `staff.manage` permission,
so bootstrap it directly on the bot's machine:

```bash
cd Rift/           # the bot's repo root
python create_staff_account.py
```

## Deploying to staff.rift.baby (GitHub Pages)

Same pattern as the public site:

```bash
npm run build
# push the contents of dist/ to the gh-pages branch (or your usual deploy flow)
```

`public/CNAME` is already set to `staff.rift.baby` and `public/404.html`
handles client-side route refreshes the same way the main site does.

**Strongly recommended:** put this behind an extra layer (Cloudflare Access,
an IP allowlist, or at minimum keep the domain unlisted) since it's not
indexed (`robots: noindex`) but is still just a normal public URL otherwise.
