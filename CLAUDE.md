# aloongstat — notes for Claude

The stats site of 臺中台壽霸龍成棒隊 (Taiwan Life ALOONG, a 社會甲組 team run by 中國信託育樂): live pitch-by-pitch
recording, live score, game logs, player and team stats. A client project: copied from the NTU 校隊's
`alanwu14832-bit/NTUBAstat` (itself from `alanwu14832-bit/bafinstat`) on 2026-11-02 and **independent of both** — nothing
here is ported to or from them unless the user asks. The maintainer is not a developer: talk in Traditional Chinese,
plainly, and say exactly what to click when something needs doing outside the code (Supabase, Cloudflare, GitHub
settings). Setup and operations are in docs/SETUP.md and docs/HANDOVER.md; keep those in step with what you change.

## Decisions so far (2026-11-02)
- Repo `alanwu14832-bit/aloongstat`, private. Hosting Cloudflare Workers (a paid client: Vercel Hobby is not allowed),
  live at https://aloongstat.mbaw.workers.dev (`siteUrl` in teamDefaults.ts).
- Supabase free plan for now, in the maintainer's account, organization `aloongstat` (that account's two free projects
  are now the 校隊's and this one; the 系隊's lives in another account; Appwrite and Neon
  were weighed on 2026-11-05 and turned down: Appwrite means rewriting the data layer and pauses on console inactivity,
  Neon has no realtime and its auth may not do anonymous sign-in). `.github/workflows/keepalive.yml` stops it pausing;
  `backup.yml` is the only backup.
- Visibility: **scores public, stats behind login** — schedule, live score and game results open to anyone; batting /
  pitching / fielding rows, player pages, scouting only for the team's accounts. Not built yet: today everything is
  public read like the source site.
- First features planned: login-only stats, per-pitch type + location (+ optional velocity), rule presets per
  competition (甲組春季聯賽, 爆米花聯盟, 熱身賽), opponent scouting reports. The team's logo (given by the maintainer
  2026-11-05) is `web/public/logo.png` (outer background made transparent) and `mark.png` (the mascot's head, for small
  sizes); colours from it: navy #011d3b (accent, light mode) and gold #f4cb21 (dark mode and scoreboards). Two more authorized
  pictures (2026-11-05): `web/public/banner.jpg` (the 使用指南 header) and the square artwork, cut out as
  `mascot-shadow.png` (mascot + navy long shadow, used by `YellowPanel` in components/ui/BrandArt.tsx). The cracked
  ground is `cracks.png`, drawn by `tools/brand/cracks.py` and used as a CSS mask (`CrackTexture`).

## Layout
- `web/` — the site (Vite + React 19 + TypeScript + Tailwind 4 + zustand). `npm ci`, `npm test`, `npm run build` from `web/`.
- `supabase/schema.sql` — the whole database, idempotent. `supabase/migrations/` — changes after the first setup.
  `supabase/tests/run.sh` (also in auto-deploy) loads them into a plain Postgres and runs `permissions.sql`: add a check
  there for every new table, policy or function.
- `tools/build_workbook.py` — the Excel 總表. `BLANK=1 TEAM_NAME=台壽霸龍 TEAM_INNINGS=9 OPENPYXL_LXML=False python3 tools/build_workbook.py`
  writes the blank template the site hands out (`data/棒球數據總表.xlsx`, copied into `web/public` by the prebuild); without
  `BLANK` it rebuilds the sample `data/BAFIN_棒球數據總表.xlsx` the tests read (rebuild both when the builder changes).
  `OPENPYXL_LXML=False` keeps the committed files' XML layout. Its 總表 formulas must give the site's numbers.
- `data/` (`games/`, `legacy/`, `BAFIN_棒球數據總表.xlsx`) and `web/src/data/seed/` — BaFiN's sample games, **test
  fixtures only**. The site never ships them (`__TEAM_SEED__` is false outside `vite test`).

## Rules
- Team identity (name as written in games, display names, innings, file prefix) lives in `web/src/config/teamDefaults.ts`.
  Tests run as BaFiN with its 7 innings (`test.env` in `web/vite.config.ts`) because the fixtures are BaFiN's games.
- Ship through a `claude/...` branch: `.github/workflows/auto-deploy.yml` runs tests + build and merges into `main`;
  its last step, 部署到 Cloudflare, builds the site with the Supabase variables and runs `npx wrangler deploy` with the
  `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` secrets (Cloudflare's own Git builds never fired on a push here, so
  GitHub deploys; without the secrets the step only warns). Run `npm test` and `npm run build` in `web/` before pushing.
- Database change: add an idempotent `supabase/migrations/<yyyy-mm-dd>_<what>.sql`, apply the same change to
  `schema.sql`, and tell the maintainer to run the migration in Supabase → SQL Editor. The site must keep working before
  it is run (see how `runner` / `errors` / `day_roster` fall back and warn in `web/src/data/supabase.ts`).
- Never put the Supabase service_role key (or any secret) in the site; everything the browser does uses the anon key and
  row-level security. Writes are allowed only for the account bound to an `editors` row (`is_bound_editor()` checks
  `user_id = auth.uid()`; binding is by 邀請碼, email code or the admin — see `supabase/migrations/2026-10-08_security.sql`
  and docs/SECURITY.md), or for a live 快速登入 session (anonymous sign-in + the shared password checked in the database,
  `quick_sessions`; `supabase/migrations/2026-10-10_quick_login.sql`). `is_editor()` = either; the 紀錄員名單,
  `audit_log` and the quick password itself stay with `is_bound_editor()`. Never check that password in the site. Never write an email into a public table (`updated_by`/`created_by` are stamped by a trigger),
  and keep the Content-Security-Policy (`web/src/config/security.ts`) and `web/public/_headers` when adding features.
- Hosting is Cloudflare Workers static assets (`web/wrangler.jsonc`, root directory `web`, deploy command
  `npx wrangler deploy`; a paid client project, so Vercel Hobby is not allowed). SPA routing comes from
  `not_found_handling: single-page-application`; do not add a `404.html`.
- `record/sim.test.ts` plays 150 random games through the recording model: keep it green when touching recording or the
  runner timeline. `tools/gamesim/` plays scripted games through the real 紀錄比賽 screen (Playwright, local mode) against
  a build seeded with the BaFiN sample roster — see tools/gamesim/README.md for the build it needs; rerun it after
  changes to recording, stats, the game editor or import/export (`edit1.mjs`, `excel.mjs`).
- `web/src/data/broadcast.ts` is the text of /live and the game page's 文字轉播 tab (CPBL-style sentences, runner names from
  `record/timeline.ts`); `tools/gamesim/live.mjs` checks it in the browser.
- 隊內賽 (`web/src/data/intrasquad.ts`): stored once, from one side (`dayRoster.intra` holds the other side's name, lineup
  and subs; its batters/pitchers are named on the rows). The other side's view is made when the data is read
  (`withMirrors`, id + `~2`) and never saved; `Filters.intra` decides whether stats count them (default: not), and team
  records never do. `tools/gamesim/intra.mjs` records one through the real screen.
- Games are written by the `save_games()` RPC, one transaction per batch (`supabase/migrations/2026-10-13_save_games.sql`);
  `pushCloudDataset` queues saves per device and falls back to piecewise writes before that migration. The record page
  syncs every change (record_drafts each time, the game rows only when they changed).
- 網站版本: `auto-deploy.yml` builds each live version as a read-only copy (VITE_ARCHIVE_ID, base /v/<id>/) into the
  `site-archive` branch (last 30); `web/scripts/archive.mjs` (postbuild) serves them at /v/<id>/; `public/boot.js` hands
  deep links into a copy over to it. Archived copies never sign in (config/archive.ts).
