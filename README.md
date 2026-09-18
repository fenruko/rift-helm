# Rift Staff Dashboard (staff.rift.cool)

Executive/staff dashboard frontend for the Rift bot. Talks to the bot's
existing Quart API (`cogs/web_server.py`) over the `/api/exec/*` and
`/ws/exec` endpoints.

## Setup

```bash
npm install
cp .env.example .env
# edit .env -- set VITE_API_BASE to your bot's API URL (e.g. https://api.rift.cool)
npm run dev

# ...or explore the UI without a bot using the in-browser mock backend:
npm run dev:mock     # sign in as "demo", any password
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

## Deploying to staff.rift.cool (GitHub Pages)

Same pattern as the public site:

```bash
npm run build
# push the contents of dist/ to the gh-pages branch (or your usual deploy flow)
```

`public/CNAME` is already set to `staff.rift.cool` and `public/404.html`
handles client-side route refreshes the same way the main site does.

**Strongly recommended:** put this behind an extra layer (Cloudflare Access,
an IP allowlist, or at minimum keep the domain unlisted) since it's not
indexed (`robots: noindex`) but is still just a normal public URL otherwise.

## Demo mode (no bot required)

`npm run dev:mock` sets `VITE_MOCK=1`, which loads `src/lib/mockBackend.js` --
an in-browser stand-in for the Quart API (fake guilds, economy, appeals,
telemetry with a live-updating websocket). It only exists in the dev server:
the `if (import.meta.env.VITE_MOCK === "1")` branch in `main.jsx` is statically
replaced at build time, so production bundles never include it. Sign in with
the username `demo` and any password.

## Tests

```bash
npm test        # vitest + jsdom: telemetry math, mock backend routes, page smoke tests
```

## UI revamp notes

- **Design system** lives in `src/index.css` (plain CSS on top of Tailwind
  utilities): dark charcoal surfaces, mint accent, Inter/tabular numerals,
  consistent panels, focus rings, reduced-motion support.
- **Overview telemetry chart**: the bot's API only reports the *current*
  snapshot (no history endpoint), so the chart accumulates up to 120 live
  samples in this tab and clearly says so. Exportable to CSV. No invented
  history or fake growth numbers.
- **Charts on every page**: a small chart kit (`src/components/ChartPanel.jsx`,
  `DistributionChart`, `RankingChart`, `StackedBarChart`, `DonutChart`, shared
  styling in `chartTheme.js`) renders the data each page already fetches —
  action mix and moderator workload on Moderation, balance split on Economy,
  ticket/modmail volume and report statuses, appeal backlog age, bug-report
  statuses and top reporters, blacklist entry types, voice listeners and
  minutes, verification flag reasons and guilds, XP/invites on Leaderboards,
  guild sizes, log severity and audit actions, 2FA coverage on Staff.
  Charts with no data show a plain empty state instead of an empty canvas.
- **Copy**: page headings are just the page name — no eyebrow lines, all-caps
  kickers, taglines or marketing one-liners. Chart subtitles state what the
  numbers are and nothing more.
- **Performance**: every page is lazy-loaded (route-level code splitting);
  one shared websocket with exponential-backoff reconnect replaces the
  per-component connections; charts are skipped entirely for users with
  `prefers-reduced-motion`.
- **Dependencies**: upgraded Vite 5 -> 6 and react-router 6 -> 7 to clear
  published security advisories (`npm audit` is clean).
