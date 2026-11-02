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
  to Jan 1 (`breakWeek`). Every pair meets: `settings.confSeries` 'split'
  (men's: Fri at one rink, Sat at the other) or 'twice' (women's: a series
  at each rink), `settings.nonConf` 'single' (men's: once) or 'series'
  (women's: one two-game series). Weekends are filled so each team spreads
  its games over `regWeeks` (22), non-conference first.
- Postseason stages keep the MCS internal names: `regionals`, `supers`,
  `mcws` = the Frozen Four. Default 8 teams in four regions of two (the
  quarterfinal at the higher seed's rink); Frozen Four days from
  `settings.finalDays` (men's Thu/Sat, women's Fri/Sun). Automatic bids only
  for conferences of `aqMin` (4) or more; conference tournaments take the
  top 4. User-facing text never says NCAA or MCWS.
- On-screen text says "game".
- Women's and men's: `league.side` is 'women' or 'men', each with its own
  save key (`js/store.js`), team rows and coaches (`js/data.js`, edited
  directly) and default settings (`defaultSettings(side)`).
- Ratings come from the 2025-26 season (see `js/data.js`); coaches are the
  real 2026-27 head coaches.

## Before every commit

- `python3 tools/stamp.py`
- `sh tools/check.sh`
- `node tests/logic.test.mjs`
- `python3 tests/ui_test.py` (Playwright; Chromium is preinstalled)
