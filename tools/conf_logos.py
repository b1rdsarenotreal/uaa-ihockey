import os
"""Draws the conference logos in img/conf/ as SVG with transparent
backgrounds. Lettering is converted to outlines (Inter Display Black, SIL
Open Font License) so the logos look the same everywhere, with no font
needed. Run: python3 tools/conf_logos.py"""
import math, os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

FONT = TTFont('/usr/share/fonts/opentype/inter/InterDisplay-Black.otf')
GS, CMAP, UPM = FONT.getGlyphSet(), FONT.getBestCmap(), FONT['head'].unitsPerEm
OUT = os.path.join(os.path.dirname(__file__), '..', 'img', 'conf')


def text(s, cx, baseline, size, fill, spacing=0.0):
    """Outlined text centered on cx, sitting on baseline."""
    k = size / UPM
    names = [CMAP[ord(c)] for c in s]
    adv = [GS[n].width * k for n in names]
    total = sum(adv) + spacing * (len(s) - 1)
    x, parts = cx - total / 2, []
    for n, a in zip(names, adv):
        pen = SVGPathPen(GS)
        GS[n].draw(TransformPen(pen, (k, 0, 0, -k, x, baseline)))
        parts.append(pen.getCommands())
        x += a + spacing
    return f'<path fill="{fill}" d="{" ".join(parts)}"/>'


def svg(name, title, body):
    doc = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">'
           f'<title>{title}</title>{body}</svg>\n')
    with open(os.path.join(OUT, name), 'w') as f:
        f.write(doc)


def wave(y, amp, length, x0=-10, x1=130):
    d = f'M{x0} {y}'
    x = x0
    while x < x1:
        d += f' q{length / 4} {-amp} {length / 2} 0 t{length / 2} 0'
        x += length
    return d + f' V130 H{x0} Z'


# Coastal Atlantic Conference: a block CAC in deep navy, after the Metro
# wordmark (the owner's pick, Nov. 2026), with a thin white edge so it shows
# on dark backgrounds. Lettering: Russo One (SIL Open Font License,
# tools/fonts/).
BLOCK = TTFont(os.path.join(os.path.dirname(__file__), 'fonts', 'RussoOne-Regular.woff'))


def block(s, cx, width, fill, edge='#FFFFFF', edge_w=3):
    """Outlined Russo One text, `width` units wide, centered on (cx, 60)."""
    from fontTools.pens.boundsPen import BoundsPen
    gs, cmap, upm = BLOCK.getGlyphSet(), BLOCK.getBestCmap(), BLOCK['head'].unitsPerEm
    names = [cmap[ord(c)] for c in s]
    k = width / sum(gs[n].width for n in names)
    bp = BoundsPen(gs)
    for n in names: gs[n].draw(bp)
    base = 60 + bp.bounds[3] * k / 2
    x, parts = cx - width / 2, []
    for n in names:
        pen = SVGPathPen(gs)
        gs[n].draw(TransformPen(pen, (k, 0, 0, -k, x, base)))
        parts.append(pen.getCommands())
        x += gs[n].width * k
    d = ' '.join(parts)
    return (f'<path d="{d}" fill="{edge}" stroke="{edge}" stroke-width="{edge_w}" stroke-linejoin="round"/>'
            f'<path fill="{fill}" d="{d}"/>')


svg('cac.svg', 'Coastal Atlantic Conference', block('CAC', 60, 112, '#24364C'))

# Metro Conference: red and charcoal, a city skyline.
RED, CHAR, WHITE = '#E03A3E', '#23262D', '#FFFFFF'
sky = ('M14 66 V52 H22 V40 H30 V52 H35 V30 H41 V22 H45 V30 H50 V46 H56 V36 H64 V18 H67 V12 H69 V18 '
       'H72 V36 H78 V44 H84 V28 H94 V44 H99 V54 H106 V66 Z')
svg('metro.svg', 'Metro Conference', f'''
<defs><clipPath id="m"><rect x="5" y="5" width="110" height="110" rx="20"/></clipPath></defs>
<rect x="5" y="5" width="110" height="110" rx="20" fill="{RED}"/>
<g clip-path="url(#m)"><rect x="0" y="72" width="120" height="50" fill="{CHAR}"/></g>
<path fill="{WHITE}" d="{sky}"/><rect x="14" y="66" width="92" height="3" fill="{WHITE}"/>
{text('METRO', 60, 102, 23, WHITE, 0.4)}
<rect x="5" y="5" width="110" height="110" rx="20" fill="none" stroke="{WHITE}" stroke-opacity=".9" stroke-width="2.5"/>''')

# Southwest Conference: a slab SWC with a beveled lone star to its right, in
# the spirit of the Ivy League wordmark (the owner's pick, Nov. 2026): navy
# lettering, a two-tone sunset-orange star, a thin white edge for dark
# backgrounds. Lettering: Arvo Bold (SIL Open Font License, tools/fonts/).
ARVO = TTFont(os.path.join(os.path.dirname(__file__), 'fonts', 'Arvo-Bold.woff'))


def arvo(s, x0, width, cy, fill, edge='#FFFFFF', edge_w=2.6):
    """Outlined Arvo text, `width` units wide from x0, centered on cy."""
    from fontTools.pens.boundsPen import BoundsPen
    gs, cmap = ARVO.getGlyphSet(), ARVO.getBestCmap()
    names = [cmap[ord(c)] for c in s]
    k = width / sum(gs[n].width for n in names)
    bp = BoundsPen(gs)
    for n in names: gs[n].draw(bp)
    base = cy + bp.bounds[3] * k / 2
    x, parts = x0, []
    for n in names:
        pen = SVGPathPen(gs)
        gs[n].draw(TransformPen(pen, (k, 0, 0, -k, x, base)))
        parts.append(pen.getCommands())
        x += gs[n].width * k
    d = ' '.join(parts)
    return (f'<path d="{d}" fill="{edge}" stroke="{edge}" stroke-width="{edge_w}" stroke-linejoin="round"/>'
            f'<path fill="{fill}" d="{d}"/>')


def bevel_star(cx, cy, r_out, light, dark, inner=0.42):
    """A five-point star in ten triangles, light and dark by turns, with white
    cuts from the center to the inner corners."""
    pts = []
    for i in range(10):
        a, r = math.radians(-90 + i * 36), r_out if i % 2 == 0 else r_out * inner
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    P = ' '.join(f'{x:.2f},{y:.2f}' for x, y in pts)
    tri = ''.join(f'<polygon points="{cx},{cy} {pts[i][0]:.2f},{pts[i][1]:.2f} {pts[(i + 1) % 10][0]:.2f},{pts[(i + 1) % 10][1]:.2f}" fill="{light if i % 2 == 0 else dark}"/>' for i in range(10))
    cuts = ''.join(f'<line x1="{cx}" y1="{cy}" x2="{pts[i][0]:.2f}" y2="{pts[i][1]:.2f}" stroke="#FFFFFF" stroke-width="1.8"/>' for i in (1, 3, 5, 7, 9))
    return f'<polygon points="{P}" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="2.6" stroke-linejoin="round"/>{tri}{cuts}'


NAVY, SUN, SUN_DARK = '#1D2D50', '#F28C38', '#E0761F'
svg('swc.svg', 'Southwest Conference', arvo('SWC', 4, 74, 60, NAVY) + bevel_star(98, 59, 19, SUN, SUN_DARK))

# UC Athletic Association: a sunset over the Pacific in block letters, after
# the Sun Belt wordmark (the owner's pick, Nov. 2026). UC over AA in Bungee
# (SIL Open Font License, tools/fonts/): California-gold sky over a wavy
# Pacific-teal sea, a deeper swell below, and a white sun on the waterline
# between the U and the C, its rays cutting up through both. A thin white
# edge for dark backgrounds.
BUNGEE = TTFont(os.path.join(os.path.dirname(__file__), 'fonts', 'Bungee-Regular.woff'))


def bungee_row(s, cx, width, top, spacing):
    """[(path, x0, x1)] per letter, `width` wide centered on cx, cap top at
    `top`; and the cap height."""
    from fontTools.pens.boundsPen import BoundsPen
    gs, cmap = BUNGEE.getGlyphSet(), BUNGEE.getBestCmap()
    names = [cmap[ord(c)] for c in s]
    k = (width - spacing * (len(s) - 1)) / sum(gs[n].width for n in names)
    bp = BoundsPen(gs)
    for n in names: gs[n].draw(bp)
    cap = bp.bounds[3] * k
    x, out = cx - width / 2, []
    for n in names:
        pen = SVGPathPen(gs)
        gs[n].draw(TransformPen(pen, (k, 0, 0, -k, x, top + cap)))
        out.append((pen.getCommands(), x, x + gs[n].width * k))
        x += gs[n].width * k + spacing
    return out, cap


def wave_line(y, amp, period, up=True, x0=-10, x1=130):
    d, x = f'M{x0} {y}', x0
    while x < x1:
        h, dy = period / 2, (-amp if up else amp) * 1.33
        d += f' c{h * 0.37:.2f} {dy:.2f} {h * 0.63:.2f} {dy:.2f} {h:.2f} 0'
        x += h; up = not up
    return d


def sun_rays(cx, cy, n, r1, spread=130, r0=7, w0=0.7, w1=3.2):
    out = ''
    for i in range(n):
        a = math.radians(-90 - spread / 2 + spread * i / (n - 1)); px, py = -math.sin(a), math.cos(a)
        x0, y0, x1, y1 = cx + r0 * math.cos(a), cy + r0 * math.sin(a), cx + r1 * math.cos(a), cy + r1 * math.sin(a)
        out += (f'<polygon points="{x0 - px * w0:.2f},{y0 - py * w0:.2f} {x0 + px * w0:.2f},{y0 + py * w0:.2f} '
                f'{x1 + px * w1:.2f},{y1 + py * w1:.2f} {x1 - px * w1:.2f},{y1 - py * w1:.2f}" fill="#FFFFFF"/>')
    return out


UTEAL, UGOLD, UDEEP = '#0F6E7A', '#F2C14E', '#0A535C'
uc, c1 = bungee_row('UC', 60, 96, 8, 2.5)
aa, c2 = bungee_row('AA', 60, 96, 8 + c1 + 6, 2.5)
letters_d = ' '.join(d for d, _, _ in uc + aa)
sun_d = ' '.join(d for d, _, _ in uc)
water, deep, sun_x = 8 + c1 * 0.58, 8 + c1 + 6 + c2 * 0.5, (uc[0][2] + uc[1][1]) / 2
svg('ucaa.svg', 'UC Athletic Association', f"""<defs><clipPath id="u"><path d="{letters_d}"/></clipPath><clipPath id="us"><path d="{sun_d}"/></clipPath></defs>
<path d="{letters_d}" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="3.4" stroke-linejoin="round"/>
<g clip-path="url(#u)">
<rect x="-10" y="-10" width="140" height="140" fill="{UTEAL}"/>
<path d="{wave_line(water, 2.6, 26)} V-10 H-10 Z" fill="{UGOLD}"/>
<path d="{wave_line(deep, 2.08, 20.8, up=False)} V140 H-10 Z" fill="{UDEEP}"/>
<path d="{wave_line(water, 2.6, 26)}" fill="none" stroke="#FFFFFF" stroke-width="1.6"/>
</g>
<g clip-path="url(#us)">{sun_rays(sun_x, water, 7, c1 * 0.85)}<circle cx="{sun_x:.2f}" cy="{water}" r="9" fill="#FFFFFF"/></g>""")

# Pacific-10 Conference: deep navy and gold, peaks over the Pacific.
PNAVY, PGOLD = '#092346', '#D6A84B'
hexpts = ' '.join(f'{60 + 55 * math.cos(math.radians(-90 + 60 * k)):.1f},{60 + 55 * math.sin(math.radians(-90 + 60 * k)):.1f}' for k in range(6))
svg('pac10.svg', 'Pacific-10 Conference', f"""
<defs><clipPath id="p"><polygon points="{hexpts}"/></clipPath></defs>
<polygon points="{hexpts}" fill="{PNAVY}"/>
<g clip-path="url(#p)"><circle cx="78" cy="40" r="9" fill="{PGOLD}"/>
<path fill="#FFFFFF" d="M8 70 L32 42 L42 54 L58 30 L76 56 L86 46 L112 70 Z"/>
<path fill="{PNAVY}" d="M58 30 L52 39 L58 36 L63 41 Z M32 42 L28 47 L33 45 Z"/>
<rect x="0" y="70" width="120" height="3" fill="{PGOLD}"/></g>
{text('PAC-10', 60, 95, 19, '#FFFFFF', 0.3)}
<polygon points="{hexpts}" fill="none" stroke="{PGOLD}" stroke-width="3.5" stroke-linejoin="round"/>""")

# Big Ten: blue over navy, a cut-corner crest.
BLUE, BNAVY = '#0088CE', '#0B2A4A'
crest = '22,6 98,6 114,22 114,98 98,114 22,114 6,98 6,22'
svg('bigten.svg', 'Big Ten', f"""
<defs><clipPath id="b"><polygon points="{crest}"/></clipPath></defs>
<polygon points="{crest}" fill="{BLUE}"/>
<g clip-path="url(#b)"><rect x="0" y="62" width="120" height="60" fill="{BNAVY}"/></g>
{text('BIG', 60, 52, 32, '#FFFFFF', 1)}{text('TEN', 60, 96, 32, '#FFFFFF', 1)}
<polygon points="{crest}" fill="none" stroke="#FFFFFF" stroke-opacity=".9" stroke-width="2.5" stroke-linejoin="round"/>""")

# Ivy League: green and old gold, an ivy leaf.
IVY, OLDGOLD = '#026937', '#C9B37E'
leaf = ('M60 16 C65 25 72 28 80 25 C78 33 80 40 87 45 C77 48 70 54 66 62 L60 66 L54 62 '
        'C50 54 43 48 33 45 C40 40 42 33 40 25 C48 28 55 25 60 16 Z')
svg('ivy.svg', 'Ivy League', f"""
<circle cx="60" cy="60" r="57" fill="{IVY}" stroke="{OLDGOLD}" stroke-width="3"/>
<path fill="#FFFFFF" d="{leaf}"/>
<path fill="none" stroke="{IVY}" stroke-width="2.4" stroke-linecap="round" d="M60 64 V30 M60 50 L72 38 M60 50 L48 38"/>
<path fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" d="M60 66 V75"/>
{text('IVY', 60, 99, 25, '#FFFFFF', 1.5)}""")

# Western Hockey Conference: a navy puck-style badge with a gold ring,
# crossed gold sticks over a puck, a white star and WHC in Saira Stencil One
# (the owner's pick, B4, Nov. 2026; SIL Open Font License, tools/fonts/).
STENCIL = TTFont(os.path.join(os.path.dirname(__file__), 'fonts', 'SairaStencilOne-Regular.woff'))
WNAVY, WGOLD, WICE = '#14365D', '#C8A951', '#DCE7F2'


def stencil(s, cx, cy, width):
    """Outlined Saira Stencil One text, `width` units wide, centered on (cx, cy)."""
    gs, cmap = STENCIL.getGlyphSet(), STENCIL.getBestCmap()
    names = [cmap[ord(c)] for c in s]
    k = width / sum(gs[n].width for n in names)
    bp = BoundsPen(gs)
    for n in names: gs[n].draw(bp)
    base = cy + bp.bounds[3] * k / 2
    x, parts = cx - width / 2, []
    for n in names:
        pen = SVGPathPen(gs)
        gs[n].draw(TransformPen(pen, (k, 0, 0, -k, x, base)))
        parts.append(pen.getCommands())
        x += gs[n].width * k
    return ' '.join(parts)


def hockey_stick(flip):
    sx = -1 if flip else 1
    return (f'<g transform="translate(60 0) scale({sx} 1) translate(-60 0)">'
            f'<path d="M37 26 L40 23 L80 66 L77 69 Z" fill="{WGOLD}"/>'
            f'<path d="M77 69 L80 66 L86 72 Q88 75 86 76 L76 76 Q73 76 74 73 Z" fill="{WGOLD}"/></g>')


wstar = ' '.join(f'{60 + r * math.sin(math.pi * i / 5):.1f},{27 - r * math.cos(math.pi * i / 5):.1f}' for i, r in zip(range(10), [8.5, 3.6] * 5))
svg('whc.svg', 'Western Hockey Conference', f"""
<circle cx="60" cy="60" r="56" fill="{WNAVY}"/>
<circle cx="60" cy="60" r="50" fill="none" stroke="{WGOLD}" stroke-width="2"/>
{hockey_stick(False)}{hockey_stick(True)}
<ellipse cx="60" cy="73" rx="9" ry="3.6" fill="#FFFFFF"/><rect x="51" y="69.5" width="18" height="3.5" fill="#FFFFFF"/><ellipse cx="60" cy="69.5" rx="9" ry="3.6" fill="{WICE}"/>
<polygon points="{wstar}" fill="#FFFFFF"/>
<path fill="#FFFFFF" d="{stencil('WHC', 60, 93, 54)}"/>
<circle cx="60" cy="60" r="56" fill="none" stroke="#FFFFFF" stroke-width="2.5"/>""")

print('wrote', sorted(os.listdir(OUT)))


# Greater South Conference (the owner's pick, Nov. 2026): GSC slanted, the S
# in crimson stripes that follow its outline, a compass set into the G with
# a gap cut round it (gold points, crimson south). Lettering: Saira Black
# (SIL Open Font License, tools/fonts/).
SAIRA = TTFont(os.path.join(os.path.dirname(__file__), 'fonts', 'Saira-Black.woff'))
GSC_NAVY, GSC_RED, GSC_GOLD = '#14284B', '#A3262C', '#D9A23A'


def gsc_compass(cx, cy, r, cut=False):
    out = ''
    for i in [1, 3, 5, 7, 0, 2, 6, 4]:
        a = math.pi * i / 4
        tip_r = r if i % 2 == 0 else r * 0.55
        w = r * (0.27 if i % 2 == 0 else 0.2)
        tip = (cx + tip_r * math.sin(a), cy - tip_r * math.cos(a))
        lft = (cx + w * math.sin(a - math.pi / 2), cy - w * math.cos(a - math.pi / 2))
        rgt = (cx + w * math.sin(a + math.pi / 2), cy - w * math.cos(a + math.pi / 2))
        fill = '#000' if cut else GSC_RED if i == 4 else GSC_GOLD if i % 2 == 0 else '#FFFFFF'
        extra = ' stroke="#000" stroke-width="5" stroke-linejoin="round"' if cut else ''
        out += (f'<polygon points="{lft[0]:.2f},{lft[1]:.2f} {tip[0]:.2f},{tip[1]:.2f} '
                f'{rgt[0]:.2f},{rgt[1]:.2f} {cx:.2f},{cy:.2f}" fill="{fill}"{extra}/>')
    if not cut:
        out += (f'<circle cx="{cx:.2f}" cy="{cy:.2f}" r="{r * 0.13:.2f}" fill="{GSC_NAVY}" '
                f'stroke="{GSC_GOLD}" stroke-width="{r * 0.07:.2f}"/>')
    return out


def gsc():
    gs, cmap = SAIRA.getGlyphSet(), SAIRA.getBestCmap()
    cap = 50
    b = BoundsPen(gs); gs[cmap[ord('S')]].draw(b)
    k = cap / (b.bounds[3] - b.bounds[1])
    x, letters = 0, []
    for ch in 'GSC':
        n = cmap[ord(ch)]
        pen, bp = SVGPathPen(gs), BoundsPen(gs)
        gs[n].draw(TransformPen(pen, (k, 0, 0, -k, x, cap)))
        gs[n].draw(TransformPen(bp, (k, 0, 0, -k, x, cap)))
        letters.append((pen.getCommands(), bp.bounds))
        x += gs[n].width * k + 0.02 * cap
    (g, gb), (s, _), (c, cb) = letters
    sk = math.tan(math.radians(12))                    # slant, baseline fixed
    slant = lambda px, py: px - sk * py + sk * cap
    cx, cy, r = slant((gb[0] + gb[2]) / 2, cap / 2), cap / 2, 14
    stem = 11
    band, gap = stem * 0.25, stem * 0.13
    left, right = slant(gb[0], cap), slant(cb[2], 0)
    scale = min(114 / (right - left), 2.0)
    ox, oy = 60 - (left + right) / 2 * scale, (120 - cap * scale) / 2
    svg('gsc.svg', 'Greater South Conference', f"""
<g transform="translate({ox:.2f} {oy:.2f}) scale({scale:.4f})"><defs><clipPath id="gscS"><path d="{s}"/></clipPath>
<mask id="gscStripes" maskUnits="userSpaceOnUse" x="-20" y="-20" width="400" height="120"><g clip-path="url(#gscS)"><path d="{s}" fill="#fff"/><path d="{s}" fill="none" stroke="#000" stroke-width="{2 * (band + gap):.2f}" stroke-linejoin="round"/><path d="{s}" fill="none" stroke="#fff" stroke-width="{2 * band:.2f}" stroke-linejoin="round"/></g></mask>
<mask id="gscCut" maskUnits="userSpaceOnUse" x="-60" y="-40" width="400" height="160"><rect x="-60" y="-40" width="400" height="160" fill="#fff"/>{gsc_compass(cx, cy, r, cut=True)}</mask></defs>
<g mask="url(#gscCut)"><g transform="matrix(1 0 {-sk:.4f} 1 {sk * cap:.2f} 0)">
<path d="{g} {s} {c}" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="6" stroke-linejoin="round"/>
<path d="{g}" fill="{GSC_NAVY}"/><path d="{c}" fill="{GSC_NAVY}"/><path d="{s}" fill="{GSC_RED}" mask="url(#gscStripes)"/></g></g>
{gsc_compass(cx, cy, r)}</g>""")


gsc()


# Horizon Valley Conference (the owner's pick, Nov. 2026): HVC slanted in
# Archivo Expanded Black (Archivo at width 125, weight 900; SIL Open Font
# License, tools/fonts/), plum with white, orange and plum outlines, in front
# of a striped orange sun rising with gold rays.
ARCHIVO = TTFont(os.path.join(os.path.dirname(__file__), 'fonts', 'ArchivoExpanded-Black.woff'))
HVC_PLUM, HVC_ORANGE, HVC_GOLD = '#33265A', '#E5672A', '#F2B33D'


def hvc():
    gs, cmap, upm = ARCHIVO.getGlyphSet(), ARCHIVO.getBestCmap(), ARCHIVO['head'].unitsPerEm
    names = [cmap[ord(ch)] for ch in 'HVC']
    raw = sum(gs[n].width for n in names) + 0.02 * upm * 2
    k = 100 / raw
    bp = BoundsPen(gs)
    for n in names: gs[n].draw(bp)
    base = 78 + bp.bounds[3] * k / 2
    x, parts = 60 - raw * k / 2, []
    for n in names:
        pen = SVGPathPen(gs); gs[n].draw(TransformPen(pen, (k, 0, 0, -k, x, base)))
        parts.append(pen.getCommands()); x += gs[n].width * k + 0.02 * upm * k
    d = ' '.join(parts)
    cx, cy, r = 70, 66, 30
    rays = ''
    for i in range(11):
        a, w = math.radians(-80 + 16 * i), math.radians(3.2)
        p = lambda rr, dd: (cx + rr * math.sin(a + dd), cy - rr * math.cos(a + dd))
        (x1, y1), (x2, y2), (x3, y3) = p(r + 3, -w * 1.6), p(r * 1.75, 0), p(r + 3, w * 1.6)
        rays += f'<polygon points="{x1:.1f},{y1:.1f} {x2:.1f},{y2:.1f} {x3:.1f},{y3:.1f}" fill="{HVC_GOLD}"/>'
    stripes = ''.join(f'<rect x="{cx - r}" y="{cy - r * f:.1f}" width="{2 * r}" height="{r * h:.1f}" fill="#FFFFFF"/>'
                      for f, h in ((0.36, 0.07), (0.2, 0.1)))
    sk = math.tan(math.radians(10))
    layers = ''.join(f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}"/>' for fill, stroke, w in
                     (('#FFFFFF', '#FFFFFF', 10.8), (HVC_PLUM, HVC_PLUM, 8.1), (HVC_PLUM, HVC_ORANGE, 5.4), (HVC_PLUM, '#FFFFFF', 2.7)))
    svg('hvc.svg', 'Horizon Valley Conference', f"""
<defs><clipPath id="hvcHalf"><rect x="{cx - 2 * r}" y="{cy - 2 * r}" width="{4 * r}" height="{2 * r}"/></clipPath><clipPath id="hvcDisc"><circle cx="{cx}" cy="{cy}" r="{r}"/></clipPath></defs>
<g clip-path="url(#hvcHalf)">{rays}<circle cx="{cx}" cy="{cy}" r="{r + 3}" fill="{HVC_PLUM}"/><circle cx="{cx}" cy="{cy}" r="{r}" fill="{HVC_ORANGE}"/><g clip-path="url(#hvcDisc)">{stripes}</g></g>
<g transform="matrix(1 0 {-sk:.4f} 1 {sk * 78:.2f} 0)" stroke-linejoin="round">{layers}<path d="{d}" fill="{HVC_PLUM}"/></g>""")


hvc()
