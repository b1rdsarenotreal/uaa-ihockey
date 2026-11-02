# AAU Hockey

A commissioner-style college ice hockey dynasty. It's 2030: the NCAA has
collapsed and the **Association of American Universities** runs college
athletics. Women's and men's hockey are **two separate dynasties** behind
the switch in the top bar, each with its own save. It has box scores by
period, overtime and ties, weekend series, standings by points, the RPI, a
voters' poll, conference tournaments, the **AAU National Tournament** and the
**Frozen Four**, coaches, the offseason and a record book.

It's built on the MCS Dynasty engine (by way of AAU Lacrosse and AAU Soccer)
and works the same way, with hockey's rules, schedule and tournament.

Open `index.html` through any static web server (GitHub Pages works: Settings
→ Pages → Deploy from a branch → `main`, `/ (root)`). **Settings → Download
backup** keeps a copy. AAU History reads these backups (they carry
`sport: 'hockey'`).

## The league

**Women's: 13 programs** in the owner's AAU Dynasty conferences: the Ivy
League (Brown, Cornell, Dartmouth, Harvard, Princeton, Yale), the Big Ten
(Minnesota, Ohio State, Penn State, Wisconsin) and the Metro Conference
(Boston University, McGill, Toronto).

**Men's: 17 programs** in two conferences made for this dynasty (rename or
realign them in the offseason):

| Conference | Teams |
|---|---|
| Western Hockey Conference | Arizona State, Michigan, Michigan State, Minnesota, Notre Dame, Ohio State, Penn State, Wisconsin |
| Eastern Hockey Conference | Boston University, Brown, Cornell, Dartmouth, Harvard, McGill, Princeton, Toronto, Yale |

Real colors, real 2026-27 head coaches and real home rinks (some men's teams
play in a bigger arena).

## Ratings

**OFF** (offense), **MID** (two-way play and special teams) and **DEF**
(defense and goaltending); **OVR = 40% OFF + 30% MID + 30% DEF.** Starting
ratings come from the 2025-26 season: Wisconsin's men were the national
runner-up and Michigan reached the Frozen Four; Wisconsin's women won their
second straight title. `js/data.js` lists the sources.

## Games

- **Three 20-minute periods**, minute by minute: about 3 goals and 30 shots
  on goal a team.
- **Regular season:** a game tied after 60 minutes plays a **5-minute
  sudden-death overtime**; still tied, it's a **tie**.
- **Postseason:** 20-minute sudden-death overtimes until someone scores.
- **Standings are points:** 3 for a win, 1 for a tie.
- Box scores show goals by period and overtime, shots on goal and penalty
  minutes.

## The season

Weekends from early October to early March, games Friday and Saturday, with
a holiday break in late December. **Every pair of teams meets:**

- **Men's:** a home-and-home with each conference opponent (Friday at one
  rink, Saturday at the other) and **one game against every team in the
  other conference** (23–24 games).
- **Women's:** two two-game series with each conference opponent, one at
  each rink, and a two-game series against every other team (28–34 games).

Non-conference games come early in the season, conference games later.

## The postseason

1. **Conference tournaments:** the top 4 of each conference with 4 or more
   teams, for the automatic bid.
2. **AAU National Tournament: 8 teams**, the quarterfinals at the higher
   seed's rink.
3. **The Frozen Four:** men's at Xcel Energy Center, St. Paul (semifinals
   Thursday, final Saturday); women's at Ridder Arena, Minneapolis (Friday
   and Sunday). Venues and the format are in Settings.

## Development

Plain ES modules, no build step. Before every commit:

```
python3 tools/stamp.py
sh tools/check.sh
node tests/logic.test.mjs
python3 tests/ui_test.py
```
