#!/usr/bin/env python3
"""Small copies of the cover pictures for the menu and the website (art/thumb/<name>.jpg, 520 px wide).
A TV box holds every menu picture in memory at once; at full size that is hundreds of megabytes.
Run after adding or changing a picture in art/:  python3 tools/thumbs.py"""
import glob, os
from PIL import Image
n = 0
for f in sorted(glob.glob('art/*.jpg')):
    name = os.path.basename(f)
    if name.startswith(('bg-', 'win-')): continue
    out = 'art/thumb/' + name
    if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(f): continue
    im = Image.open(f).convert('RGB'); w = 520; im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(out, quality=80, optimize=True, progressive=True); n += 1
print(f'{n} thumbnails written')
