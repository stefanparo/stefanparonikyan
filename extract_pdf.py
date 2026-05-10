"""Extract embedded images + full page renders from the LSA portfolio PDF."""
import fitz  # PyMuPDF
from pathlib import Path

PDF = Path(r"C:\Users\paron\Downloads\LSA portfolio.pdf")
ROOT = Path(r"C:\Users\paron\OneDrive\Desktop\stefan\Portfolio Website")
IMG_DIR = ROOT / "assets" / "images"
PAGE_DIR = ROOT / "assets" / "pages"
IMG_DIR.mkdir(parents=True, exist_ok=True)
PAGE_DIR.mkdir(parents=True, exist_ok=True)

doc = fitz.open(PDF)
print(f"Pages: {len(doc)}")

# 1) Render every page as a high-res JPG (good fallback for drawings/diagrams).
zoom = 2.0
mat = fitz.Matrix(zoom, zoom)
for i, page in enumerate(doc, start=1):
    pix = page.get_pixmap(matrix=mat, alpha=False)
    out = PAGE_DIR / f"page_{i:02d}.jpg"
    pix.save(out, jpg_quality=85)
    print(f"page_{i:02d}.jpg  {pix.width}x{pix.height}")

# 2) Extract every embedded raster image with a stable name.
seen = set()
for i, page in enumerate(doc, start=1):
    for j, info in enumerate(page.get_images(full=True), start=1):
        xref = info[0]
        if xref in seen:
            continue
        seen.add(xref)
        try:
            pix = fitz.Pixmap(doc, xref)
            if pix.n - pix.alpha > 3:  # CMYK -> RGB
                pix = fitz.Pixmap(fitz.csRGB, pix)
            ext = "png" if pix.alpha else "jpg"
            name = f"p{i:02d}_img{j:02d}.{ext}"
            out = IMG_DIR / name
            if ext == "jpg":
                pix.save(out, jpg_quality=88)
            else:
                pix.save(out)
            print(f"{name}  {pix.width}x{pix.height}")
        except Exception as e:
            print(f"  skip xref={xref}: {e}")

print("done")
