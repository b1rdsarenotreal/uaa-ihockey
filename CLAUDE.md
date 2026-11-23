# AAU Hockey

A college ice hockey dynasty set in 2030, women's and men's as two separate
dynasties behind a switch in the top bar: women's has the owner's 13 AAU
programs in his conferences (Ivy 6, Big Ten 4, Metro 3), men's the 17 in two
men's hockey conferences made for this dynasty (West and East; the owner
asked for "everyone once and your conference twice"). The Western Hockey
Conference's logo is drawn by `tools/conf_logos.py` (`img/conf/whc.svg`:
a puck badge with crossed sticks, WHC in Saira Stencil One). It started as a copy of
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
  men's conferences then play at least `confMin` (24) conference games
  (the owner's rule, Nov. 2026; `scheduleVersion` 3 set it on men's saves):
  a conference short of it adds a series with some opponents (second
  meetings at the other rink, or third meetings; one more meeting a pair at
  most, nearby rivals more often), the same number for every member;
  non-conference series against a different team each time fill to
  `maxMatches` (34) games, and teams left short take over a series between
  two others (a far-off conference's neighbors fill up with each other
  first). The older 'split'/'twice' and 'single'/'series'
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
- Conference home and away (`js/homeaway.js`, the owner's rule, Nov. 2026):
  no team plays more than two conference weekends in a row away (`MAX_AWAY`)
  or three at home (`MAX_HOME`); a week without a conference game ends a
  run. `generateSchedule` draws the season (`drawSchedule`), then
  `spreadConfHomes` trades hosts between a pair's two meetings, turns around
  triangles of single meetings or a single meeting (every team within one
  game or series of half), and trades two conference weeks when every team
  plays on the same days in both. A pair meeting twice keeps one at each
  school. Once-a-year hosts still swap every year (`keepSwaps`); it may also
  move a series to a week both teams have open (not the holiday break), and
  a rare team may still go three weekends away.
- Regionals avoid first-round matchups between conference rivals
  (`avoidConferenceMatchups` in `js/postseason.js`, the owner's rule): after
  the serpentine, teams on one seed line trade regionals (lowest lines
  first), then, as a last resort, a team moves one seed line; the top line
  never moves. `pods(field, n, season)` applies it, so bracketology, the
  selection preview and the announced field agree. Bracketology and the
  preview show each regional's first-round matchups.
- The Greater South Conference (the owner's, coming in; Kansas, Missouri,
  Tulane, UAB, Vanderbilt, Iowa State, Saint Louis, Memphis) has its logo
  ready (`gsc.svg`, the owner's pick: slanted GSC, striped S, compass in the
  G; Saira Black): it's in the Add conference pick (`AAU_CONFERENCES`), and
  a Greater South made by hand gets it on load (`migrateLeague`).
- The Horizon Valley Conference (the owner's, coming in; Loyola Chicago, UIC,
  IU Indianapolis, UMKC, Missouri S&T, Cincinnati, Dayton, West Virginia,
  Ohio, Southern Illinois) has its logo ready the same way (`hvc.svg`, the
  owner's pick: slanted HVC in Archivo Expanded Black with white, orange and
  plum outlines, a striped orange sun rising behind).
- The Western Athletic Conference is coming back (the owner's; Northern
  Arizona, San Diego State, Nevada, UNLV, Oregon State, BYU, Utah State,
  Washington State) with the owner's pick for its logo, the 1992–2010 WAC
  logo linked from the web (`CONF_LOGO_LINKS.wac`), ready the same way.
- The Rocky West Conference (the owner's, coming in; Colorado State, Denver,
  Colorado School of Mines, Montana, Montana State, North Dakota, North
  Dakota State, New Mexico, New Mexico State, UTEP, UTSA) and the Colonial 10
  (Northeastern, UMass Amherst, Lehigh, Temple, Rhode Island, East Carolina,
  Charlotte, George Mason, VCU) have their logos ready the same way, the
  owner's picks (Nov. 2026): `rwc.svg`, RWC slanted in Saira Black, forest
  green, before a snow-capped range and a gold sun; `c10.svg`, a block C in
  red and white stripes and a navy 10 in Bungee, a red star over the 1.
  The three conferences' thirty schools, and Boston College (suggested for
  the Metro), are in the Add team pick
  (`AAU_SCHOOLS`, `crop: 4`: ESPN logos, `AAU_PROGRAMS` venues for the
  sports each plays, coaches added by hand), not in the starting league.
- Realignment from AAU Dynasty (`js/realign.js`, Nov. 2026): the hub's
  Realignment page leaves a plan in IndexedDB `aau-realignment` (read
  when the app loads or comes back into view, never created here); the
  Offseason page shows it (`realignBanner`) with a review where each move,
  join and leave can be unticked (`realignModal`). Only teams in the AAU's
  all-sports conferences move; schools join only if they play this sport
  (`AAU_PROGRAMS`), at `JOIN_RATING` (60) with their venue and logo; new
  conferences get their logo; empty ones can be retired. Applied or skipped
  is kept in `league.realign[planId]`.

## Before every commit

- `python3 tools/stamp.py`
- `sh tools/check.sh`
- `node tests/logic.test.mjs`
- `python3 tests/ui_test.py` (Playwright; Chromium is preinstalled)
