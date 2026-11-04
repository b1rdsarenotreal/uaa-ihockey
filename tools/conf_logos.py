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

# Southwest Conference: a throwback to the old SWC (1914–1996): heavy slab
# SWC under a lone star, with retro sunset stripes, in cornflower blue, navy
# and sunset orange on cream. Lettering: Alfa Slab One (SIL Open Font
# License, tools/fonts/).
SLAB = TTFont(os.path.join(os.path.dirname(__file__), 'fonts', 'AlfaSlabOne-Regular.woff'))


def slab(s, cx, baseline, size, fill, spacing=0.0):
    """Outlined Alfa Slab One text centered on cx, sitting on baseline."""
    gs, cmap, upm = SLAB.getGlyphSet(), SLAB.getBestCmap(), SLAB['head'].unitsPerEm
    k = size / upm
    names = [cmap[ord(c)] for c in s]
    adv = [gs[n].width * k for n in names]
    x, parts = cx - (sum(adv) + spacing * (len(s) - 1)) / 2, []
    for n, a in zip(names, adv):
        pen = SVGPathPen(gs)
        gs[n].draw(TransformPen(pen, (k, 0, 0, -k, x, baseline)))
        parts.append(pen.getCommands())
        x += a + spacing
    return f'<path fill="{fill}" d="{" ".join(parts)}"/>'


def star(cx, cy, r_out, fill):
    pts = []
    for i in range(10):
        a, r = -math.pi / 2 + i * math.pi / 5, r_out if i % 2 == 0 else r_out * 0.382
        pts.append(f'{cx + r * math.cos(a):.2f},{cy + r * math.sin(a):.2f}')
    return f'<polygon fill="{fill}" points="{" ".join(pts)}"/>'


CORN, NAVY, SUN, CREAM = '#719AE8', '#1D2D50', '#F28C38', '#FFF6E9'
svg('swc.svg', 'Southwest Conference', f'''
<defs><clipPath id="r"><rect x="4" y="4" width="112" height="112" rx="16"/></clipPath></defs>
<rect x="4" y="4" width="112" height="112" rx="16" fill="{CREAM}"/>
<g clip-path="url(#r)"><rect x="0" y="74" width="120" height="9" fill="{SUN}"/><rect x="0" y="86" width="120" height="9" fill="{CORN}"/><rect x="0" y="98" width="120" height="22" fill="{NAVY}"/></g>
{star(60, 22, 11, SUN)}
{slab('SWC', 60, 66, 36, NAVY, 0.5)}
<rect x="4" y="4" width="112" height="112" rx="16" fill="none" stroke="{NAVY}" stroke-width="3"/>''')

# UC Athletic Association: Pacific teal and California gold, sun over the ocean.
TEAL, GOLD = '#0F6E7A', '#F2C14E'
shield = 'M60 6 L107 19 V57 C107 86 88 104 60 114 C32 104 13 86 13 57 V19 Z'
svg('ucaa.svg', 'UC Athletic Association', f'''
<defs><clipPath id="u"><path d="{shield}"/></clipPath></defs>
<path d="{shield}" fill="{TEAL}"/>
<g clip-path="url(#u)"><circle cx="60" cy="52" r="20" fill="{GOLD}"/><rect x="0" y="52" width="120" height="70" fill="{TEAL}"/>
<path fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" d="M28 58 q8 -5 16 0 t16 0 t16 0 t16 0"/>
<path fill="none" stroke="{GOLD}" stroke-width="3" stroke-linecap="round" d="M34 66 q6.5 -4 13 0 t13 0 t13 0 t13 0"/></g>
{text('UCAA', 60, 92, 22, '#FFFFFF', 0.5)}
<path d="{shield}" fill="none" stroke="{GOLD}" stroke-width="4" stroke-linejoin="round"/>''')
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
