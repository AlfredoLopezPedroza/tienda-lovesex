"""
sync_csv.py — Réplica fiel en Python del sync-csv.js original de Antigravity.
Genera data/productos.json desde base-de-datos/inventario_maestro_lovesex.csv,
respetando el MISMO contrato de datos que espera routes/productos.js + public/js/app.js.

Fidelidad contractual verificada campo por campo contra el sync-csv.js original:
  parseCSV:  sku, nombre, categoria, precio_base, precio_promo, promo_activa,
             descripcion, beneficio, ficha, disponible, stock
  mapImages: slug, imagen, galeria, stock_nota, stock_estado
  output:    { categorias: [{slug,nombre}], productos: [...] }
"""
import csv
import json
import os
import re
import unicodedata

ROOT = r"C:\Users\elult\Downloads\IA-CROPOLIS\AGENTES-IA\AGENTES ACTIVOS\ANTIGRAVITY\artefactos-antigravity\tienda-lovesex"
CSV_PATH = os.path.join(ROOT, "base-de-datos", "inventario_maestro_lovesex.csv")
JSON_OUT = os.path.join(ROOT, "data", "productos.json")
IMG_BASE = os.path.join(ROOT, "public", "img", "productos")


def slugify(text):
    """Idéntica a la del sync-csv.js original."""
    s = str(text).lower()
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"[^\w-]+", "", s)
    s = re.sub(r"--+", "-", s)
    s = s.strip("-")
    return s


def get_category_slug(categoria):
    """Réplica exacta de getCategorySlug() del sync-csv.js."""
    s = categoria.lower()
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"\s+", "-", s)
    if "lubricantes" in s or "cremas" in s:
        return "lubricantes-cremas"
    if "masturbadores" in s or "bombas" in s:
        return "masturbadores-bombas"
    if "arnes" in s or "fetish" in s:
        return "arnes-fetish"
    if "retardantes" in s:
        return "retardantes-sexuales"
    if "vigorizantes" in s or "estimulantes" in s:
        return "vigorizantes-sexuales"
    if "juguetes-anales" in s or "anal" in s:
        return "juguetes-anales"
    if "fundas" in s or "anillos" in s:
        return "fundas-anillos"
    return s.replace("-y-", "-")


def parse_csv(path):
    """Réplica de parseCSV del sync-csv.js. Usa DictReader (más robusto que split por coma)."""
    products = []
    with open(path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            sku = (row.get("SKU") or "").strip()
            nombre = (row.get("Nombre actual") or "").strip()
            categoria = (row.get("Categoria") or "").strip()
            if not sku or not nombre or not categoria:
                continue
            try:
                precio_base = float(row.get("Precio regular") or 0)
            except ValueError:
                precio_base = 0.0
            try:
                precio_promo = float(row.get("Precio activo") or "nan")
            except ValueError:
                precio_promo = None
            promo_activa = precio_promo is not None and precio_promo < precio_base
            products.append({
                "sku": sku,
                "nombre": nombre,
                "categoria": categoria,
                "precio_base": precio_base,
                "precio_promo": precio_promo if promo_activa else None,
                "promo_activa": promo_activa,
                "descripcion": (row.get("Descripcion comercial (Oferta irresistible)") or "").strip(),
                "beneficio": (row.get("Beneficio principal") or "").strip(),
                "ficha": (row.get("Caracteristicas / ficha tecnica") or "").strip(),
                "disponible": (row.get("Estado") or "").strip().lower() == "activo",
                "stock": int(float(row.get("Stock") or 0)),
            })
    return products


def build_all_images():
    all_images = {}
    for cat in os.listdir(IMG_BASE):
        cat_path = os.path.join(IMG_BASE, cat)
        if os.path.isdir(cat_path):
            all_images[cat] = os.listdir(cat_path)
    return all_images


def map_images(products, all_images):
    """Réplica de mapImages del sync-csv.js."""
    out = []
    for p in products:
        cat_slug = get_category_slug(p["categoria"])
        cat_files = all_images.get(cat_slug, [])
        sku_regex = re.compile(rf"^{re.escape(p['sku'])}(-\d+)?\.(webp|jpg|jpeg|png)$", re.IGNORECASE)
        matching = [f for f in cat_files if sku_regex.match(f)]
        # Ordenar: sku.webp primero, luego sku-1.webp, sku-2.webp...
        def num_key(f):
            m = re.search(r"-(\d+)\.", f)
            return int(m.group(1)) if m else -1
        matching.sort(key=num_key)
        main_image = f"{cat_slug}/{matching[0]}" if matching else "pendiente.webp"
        gallery = [f"{cat_slug}/{f}" for f in matching]
        p["slug"] = f"{slugify(p['nombre'])}-{p['sku'].lower()}"
        p["imagen"] = main_image
        p["galeria"] = gallery
        p["stock_nota"] = "Disponible" if p["stock"] > 0 else "No disponible"
        p["stock_estado"] = "disponible" if p["stock"] > 0 else "agotado"
        out.append(p)
    return out


def main():
    print("🚀 Iniciando sincronización CSV -> productos.json (Python port)")
    if not os.path.exists(CSV_PATH):
        print(f"ERROR: CSV no encontrado: {CSV_PATH}")
        return 1
    products = parse_csv(CSV_PATH)
    print(f"📊 Productos parseados desde CSV: {len(products)}")
    all_images = build_all_images()
    products = map_images(products, all_images)
    print(f"📸 Imágenes mapeadas.")
    categorias = sorted({p["categoria"] for p in products})
    categorias_out = [{"slug": get_category_slug(c), "nombre": c.upper()} for c in categorias]
    output = {"categorias": categorias_out, "productos": products}
    # Backup del JSON actual antes de pisar
    if os.path.exists(JSON_OUT):
        bak = JSON_OUT + ".bak"
        if os.path.exists(bak):
            os.remove(bak)
        os.rename(JSON_OUT, bak)
        print(f"💾 Backup del productos.json anterior -> {bak}")
    with open(JSON_OUT, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"✅ productos.json regenerado: {len(products)} productos, {len(categorias_out)} categorías")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
