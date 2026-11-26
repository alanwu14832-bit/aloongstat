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
- Visibility (built 2026-11-05, batch 1): 一般人 → 球員 → 紀錄員 → 管理者 (see the security rule below). Batch 2: data
  that must stay inside the team (players' height / weight / school, later pitch type and location, scouting) in tables
  only `is_member()` reads.
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
  `audit_log` and the quick password itself stay with `is_bound_editor()`. Never check that password in the site.
  身分分層 (`supabase/migrations/2026-11-05_roles.sql`): `editors.role` is player / coach / recorder / admin (教練 `coach` reads like a
  player, `2026-11-12_coach_role.sql`); `is_bound_editor()`
  counts recorders and admins only (so players never write), the account list and `add_member` / `set_member_role` /
  `reset_editor` need `is_admin()`, `my_role()` tells the site. The site gates pages by level (`hooks/useAccess.ts`,
  `components/layout/Gate.tsx`, `level` on the menu items): 0 一般人 (即時比分, 比賽, 紀錄簿, 使用指南, 數據字典, a short
  總覽, 練習紀錄), 1 球員, 2 紀錄員, 3 管理者 (帳號管理 at /accounts, 網站版本). That gate is only what the site shows: the
  plate-appearance rows stay publicly readable because 比賽 and 紀錄簿 are built from them; data that must stay inside
  the team goes into tables only `is_member()` can read. 快速登入 is no longer offered in the sign-in form. Never write an email into a public table (`updated_by`/`created_by` are stamped by a trigger),
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
- 跑者出局 (2026-11-18): the runner pickers (修改資料 EndPicker, 紀錄比賽 DestRow) have one 壘死 for a runner put out (the batter's
  row: 出局) and a 「自己跑壘失誤」 tick beside it (`baserunningOuts`, shown as 跑壘失誤; the Excel column keeps the name 壘死).
  內滾／犧觸 plus a runner put out on that play becomes 野選 (FC_FROM in GameEditor and Record). Out codes stay on the runner's
  own row (scorebook style); `record/timeline.outsDuring` lets the editor list say which plate appearance he was put out in.
- 紀錄比賽 → 逐打席 → a row opens the full 修改資料 panel (`GameEditor` with `live`: no 插入／移動／刪除, no draft);
  `record/liveEdit.applyLiveEdit` puts the game back on the changed rows (finished halves keep 3 outs, the half being played
  gets its outs and runners again, a third out is refused). 好壞球分佈 is `components/charts/StrikeRatioCard` (share, sortable).
- 球速 (2026-11-23): `speeds` on a plate appearance, one per pitch (null = not measured; `data/speeds.ts`), stored as
  `pitch_speeds` (`2026-11-23_pitch_speeds.sql`). 紀錄比賽 asks with a number pad (`SpeedPad`) when `RecordState.speedOn`
  says so for the pitcher on the mound (us / opp); 修改資料 has a 球速 field; the pitch chips show them. Step 2: `speedSummary`
  (球員 → 投球 `SpeedCard`: 最快, 均速 of every measured pitch — no pitch types —, per inning, per game), the 文字轉播 (each
  pitch's km/h, 「最快」 on the summary line, 上一球 on /live) and Excel (球速 「132,,128」, the last input of 打席紀錄 / 投球紀錄).
- 限時動態 (2026-11-23, step 1 of the IG story cards: no AI yet): `data/storyCard.ts` works out a card (單場打擊／單場投球／本季打擊／
  本季投球; the numbers and the one editable sentence), `lib/storyImage.ts` draws it 1080 × 1920 with Instagram's top 250 / bottom
  340 px kept clear and an optional photo that never leaves the device, `components/ui/StoryDialog.tsx` (the 限動 button on 球員 and
  on a game page) shares or downloads it. A reader below 球員 level gets single games only (no season card or season line).
  Planned: step 2 a server-side Claude call for the sentence (key never in the site), step 3 里程碑 and 全隊賽後總結 cards.
- 限時動態編輯器 (2026-11-26, the user's ask: a small design desk): `StoryStyle` in lib/storyImage.ts — 版型 滿版照片／上照片下數據／純數據,
  a background photo (pan, zoom, 變暗, 模糊) and a front photo (`fg`: moved, sized, 白框, 陰影), the colours (主色／文字色／底色, `palettes()`),
  and each block of text (`LAYERS`: shown, size, colour, 字型, moved). drawStory returns the blocks' boxes (`hitTest`) so the preview
  picks and drags them; `guides` draws the picked frame only while editing (IG's covered bands were taken out at the user's ask:
  the layout still keeps its text inside SAFE_TOP / SAFE_BOTTOM). 圖層 (`style.order`, `moveLayer`): the front photo and the
  blocks are queued and drawn in the reader's order over the background, and `hitTest` picks by it. The look is kept on the device
  (`bafin.story.style.v1`, `readStyle` cleans it), the photos never. 自動去背 on the front photo (step 2, same day): `lib/cutout.ts`
  → module worker `lib/cutout.worker.ts` running IS-Net (MIT int8 build, Hugging Face pinned revision, ~44 MB, kept in Cache Storage
  `bafin-cutout-v1`; `refineAlpha` then drops the haze, scraps not touching the subject and fills small holes, so a bat in his hand
  stays; 手動修邊 `CutoutRefine` paints 擦掉／補回 on the kept mask and `cutWith` cuts again) on ONNX Runtime Web (`onnxruntime-web`, its WebAssembly from jsDelivr at the package.json version; never put
  the wasm or the model in public/: every Vercel deployment and archived version would carry them). `vite.config` worker format 'es'.
- 複選篩選 (2026-11-25): `Filters.tournament / position / opponent / result` are lists (none = every game; a game passes holding any of
  the values; different filters still narrow together). `components/ui/MultiSelect.tsx` (desktop: checkbox list in a portal, fixed
  widths so the one-row toolbar keeps fitting; the phone sheet: `MultiChips`); the address repeats the key (`?cup=A&cup=B`, old
  one-value / `all` links still read). 主客 and 隊內賽 stay single.
- 犧飛 (2026-11-25, a recorder's report): sending a runner home on a 外飛／界外飛 with fewer than two out turns the result into 犧飛
  (SF_FROM in Record and GameEditor, like FC_FROM's 野選); `data/audit` flags an old 外飛／界外飛 with an RBI as 待核對.
- 2026-11-25 (players' and recorders' asks): 打擊 page's 擊球強度 is a 強擊率 Hard Hit% bar chart (強 ÷ batted balls with a 強度);
  即時比分 shows 球速 (under each pitch of 本打席, the last one, the pitcher's 最快 today) lit 黃 125–134 / 紅 135+ (`speedTone` in
  data/speeds.ts; theme colours `speedClass` in the 文字轉播 and pitch chips); 修改資料 stays open after 儲存修改 (GameView remounts
  it from the saved game via `key`, at the same tab / plate appearance via `view`), and its 取消 reads 結束修改 when nothing is unsaved.
- 2026-11-25 (2): the game page's 逐球紀錄 rows open 修改資料 at that plate appearance for 紀錄員／管理者 (`openPa` in GameView; anyone
  else gets plain rows); the 紀錄比賽 setup form is kept on the device while it is filled in (`SetupSnap`, `bafin.record.setup.v1`, for
  that day, cleared on 開始紀錄) so a phone reloading the page brings it back; each page offers its own filters (`hooks/usePageFilters`:
  總覽／投球／比賽 no 守位, 打擊／守備／球員 all, other pages none) and a filter a page does not offer does not apply there (`useStats`).
- 未完成打席 (2026-11-25): its own panel in 修改資料 (`UnfinishedPanel` in PaEditor: who was up — 打者 on our side, 投手 on theirs —,
  every pitch inserted / changed / deleted / added (no ball in play), 球速, 備註); the runner's out stays on his own row.
- 每個打席換守備 (2026-11-26, the user's ask): 修改資料 → 我隊投球 → 逐打席, each of their plate appearances has a 守備陣容 section
  (`DefenseByInning` with `at={inning,row}`, passed to PaPanel as `defense`): the alignment as it stood for that one
  (`defenseTimeline(inning, half, row)`), and a change starts from it (a DEF sub with `row` = the rows before it in that half);
  the plate appearances before keep the old alignment, errors follow. Not in the live editor (紀錄比賽 has its own 換人).
- 2026-11-25 (3), the look (the same change in all three sites: `bafinstat`, `NTUBAstat`, `aloongstat`): a `Card`'s `subtitle` folds
  behind the ⓘ beside its title (`components/ui/InfoNote.tsx`; `noteOpen` opens it for a warning; printing shows every note); the
  stitches (`Stitches`) stay on page titles only; 選球紀律 lists batters by 打席 with the numbers on the bars; phones get 區塊快捷鈕 on
  打擊, 投球, 守備 and 球員 (`components/layout/SectionNav.tsx`, targets by id / `<Section>`), a fade on the right edge of a table that scrolls
  sideways (`components/ui/ScrollFade.tsx`, in `DataTable` and the hand-built tables) (本季看點 is a list on a phone here, so it has no dots). 總覽 opens with the 開場形象區
  (`SeasonHero`: the team's name as the page's h1 over its real record; planes in `components/ui/HeroArt.tsx`, the team's own art: the navy board, the gold cracks, the yellow slab and the mascot,
  moved by `--hp` on scroll, still under reduced motion, no scroll cue). The team photo is `web/public/hero.jpg` (+ `hero-m.jpg` for
  phones; `heroPhoto*` in teamDefaults.ts, found at build time by vite.config.ts → `config/hero.ts`); without the file the drawn
  backdrop stands in. The design rules came from the scroll-craft plugin (bafinstat's .claude/settings.json).
- 2026-11-26, more of the look (all three sites): the 球員卡 has planes of its own (`components/ui/PlayerArt.tsx`: the team colour, the
  jersey number drawn huge and faint, the seams) moved by the same `--hp` as 總覽's opening (`hooks/useDepthScroll.ts`, shared by both);
  its three numbers roll when the player changes. 總覽 below the opening reads as stretches (`SummaryHead`: a larger head with a line of
  real numbers and more air above it: 打擊摘要, 投球與守備摘要, 球季走勢) that each arrive differently: the tiles count up when scrolled
  to (`StatTile count` → `RollingNumber onView`), the four charts wipe in from the left (`ChartFrame wipe`), 近期比賽 comes in from the
  side (`Reveal x`). All of it is still under reduced motion.
- Games are written by the `save_games()` RPC, one transaction per batch (`supabase/migrations/2026-10-13_save_games.sql`);
  `pushCloudDataset` queues saves per device and falls back to piecewise writes before that migration. The record page
  syncs every change (record_drafts each time, the game rows only when they changed). Before writing the rows it reads the
  game back (`fetchCloudGame`) and takes in what another device changed since its own last save (`record/outsideEdits`, a
  field-by-field three-way merge against the copy read right after that save; flow changes the live game cannot follow are
  left out and the recorder is told): a 球速 typed in 修改資料 on a second device mid-game used to be written over (2026-11-26).
- 網站版本: `auto-deploy.yml` builds each live version as a read-only copy (VITE_ARCHIVE_ID, base /v/<id>/) into the
  `site-archive` branch (last 30); `web/scripts/archive.mjs` (postbuild) serves them at /v/<id>/; `public/boot.js` hands
  deep links into a copy over to it. Archived copies never sign in (config/archive.ts).
