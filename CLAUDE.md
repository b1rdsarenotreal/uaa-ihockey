# AAU Hockey

A college ice hockey dynasty set in 2030, women's and men's as two separate
dynasties behind a switch in the top bar: women's has the owner's 13 AAU
programs in his conferences (Ivy 6, Big Ten 4, Metro 3), men's the 17 in two
men's hockey conferences made for this dynasty (West and East; the owner
asked for "everyone once and your conference twice"). It started as a copy of
AAU Lacrosse (from AAU Basketball, AAU Field Hockey, AAU Soccer, AAU
Volleyball and the owner's MCS Dynasty), with AAU Soccer's tie displays.

**It is not synced with MCS Dynasty, SACAA Dynasty or any other AAU app.**
Changes here aren't ported to those repos, and theirs aren't ported here,
unless the owner asks.

## Hockey adaptations to keep in mind

- Game fields keep the MCS names: `homeLine`/`awayLine` are goals per period
  (three periods, then overtimes), `homeR`/`awayR` goals, `homeH`/`awayH`
  shots on goal, `homeE`/`awayE` penalty minutes. `g.pk` is never set. A
  record's `rs`/`ra` are goals for and against.
- **Ties:** a regular-season game tied after its one 5-minute overtime is a
  tie (`isTie`, `resultFor` 'T'; records carry `t`, `ct`, …; standings are
  points, 3 a win and 1 a tie, `confPts`). Postseason games
  (`isKnockout`: any type but 'regular') play 20-minute sudden-death
  overtimes until a goal. Never assume a regular-season game has a winner.
- Ratings are stored as `off`, `pit`, `def` and shown as OFF, MID, DEF.
  OVR = 0.4/0.3/0.3.
- Every league has `league.sport = 'hockey'` so AAU History can detect it.
- Schedule (`js/schedule.js`): week 1 starts the first Monday in October;
  Friday and Saturday games; no games on weekends whose Saturday is Dec 14
  to Jan 1 (`breakWeek`). Every game is in a two-game series at one rink
  (the owner's rules, Nov. 2026; `confSeries: 'auto'`, `nonConf: 'fill'`):
  a conference of `confTwiceMax` (7) or fewer plays everyone twice, a series
  at each rink; a bigger one everyone once, the host swapping every year;
  non-conference series against a different team each time fill to
  `maxMatches` (34) games. The older 'split'/'twice' and 'single'/'series'
  settings still work. Weekends are spread over `regWeeks` (22),
  non-conference first.
- Postseason stages keep the MCS internal names: `regionals`, `supers`,
  `mcws` = the Frozen Four. Default 8 teams in four regions of two (the
  quarterfinal at the higher seed's rink); Frozen Four days from
  `settings.finalDays` (men's Thu/Sat, women's Fri/Sun). Automatic bids only
  for conferences of `aqMin` (4) or more; conference tournaments take the
  top 4. User-facing text never says NCAA or MCWS.
- Selection uses the NCAA Power Index (`npi` in `js/standings.js`, the
  NCAA's D-III ice hockey dials in `NPI_DIALS`) when `settings.index` is
  'npi' (the default; `indexVersion` 1 switched older saves from the current
  or next season on). The committee then goes straight down the NPI: no
  tiers (`sheet.tiers` empty). `rating(season)` gives the season's index in
  the RPI's shape (value in `rpi`, plus `rank`, `sosRank`); use it, not
  `rpi()`, and `indexName(season)` for on-screen labels.
- The AAU look (Nov. 2026, ported from AAU Field Hockey, built to match the
  owner's mockups): a two-row top bar (brand row, then the menu); scoreboard
  cards (`gameCard`: the conference's color bar and logo, a row per team with
  each period and the final, the loser faded); standings with the conference
  list down the side (`st-*`), each conference in its colors (`confVars`,
  `confHead`; points, conference W-L-T, PB), All conferences compact, the last 5 (postseason
  included) opening the poll's game pop-up; the poll as a board (`pb-*`)
  beside movers, receiving votes and dropped out, under the No. 1 team's
  card; the team page header in the team's colors with title banners and a
  numbers strip (`teamHero`) and schedule boxes (`ts2-*`: one regular-season
  box, conference logo on conference games, a box per tournament, a venue
  column, the result opening the box score); Postseason → Full bracket
  (`renderBoard`). Navy `--board`, gold `--optic`; Oswald, Saira Condensed,
  Inter.
- On-screen text says "game".
- Women's and men's: `league.side` is 'women' or 'men', each with its own
  save key (`js/store.js`), team rows and coaches (`js/data.js`, edited
  directly) and default settings (`defaultSettings(side)`).
- Ratings come from the 2025-26 season (see `js/data.js`); coaches are the
  real 2026-27 head coaches.
- Regionals avoid first-round matchups between conference rivals
  (`avoidConferenceMatchups` in `js/postseason.js`, the owner's rule): after
  the serpentine, teams on one seed line trade regionals (lowest lines
  first), then, as a last resort, a team moves one seed line; the top line
  never moves. `pods(field, n, season)` applies it, so bracketology, the
  selection preview and the announced field agree. Bracketology and the
  preview show each regional's first-round matchups.

## Before every commit

- `python3 tools/stamp.py`
- `sh tools/check.sh`
- `node tests/logic.test.mjs`
- `python3 tests/ui_test.py` (Playwright; Chromium is preinstalled)
