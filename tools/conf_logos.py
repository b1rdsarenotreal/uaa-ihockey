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

print('wrote', sorted(os.listdir(OUT)))
