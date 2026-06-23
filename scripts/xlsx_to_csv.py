"""
xlsx_to_csv.py — Conversión normalizada del inventario maestro.
Lee:  base-de-datos/inventario-maestro-lovesex-22-junio-2026.xlsx
Escribe: base-de-datos/inventario_maestro_lovesex.csv  (sobrescribe)

Normalización aplicada (Kaizen):
  - UTF-8 SIN BOM (el CSV restaurado tenía BOM, fuente de bugs en parsing)
  - Sin filas vacías intermedias (el xlsx tiene 1 fila basura entre header y datos)
  - Solo las 12 columnas válidas (sin comas sobrantes al final como el CSV viejo)
  - Quoteo RFC 4180 correcto para campos con comas en su contenido
"""
import csv
import os
import sys

try:
    import openpyxl
except ImportError:
    print("Instalando openpyxl...", file=sys.stderr)
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "openpyxl", "-q"])
    import openpyxl

BASE = r"C:\Users\elult\Downloads\IA-CROPOLIS\AGENTES-IA\AGENTES ACTIVOS\ANTIGRAVITY\artefactos-antigravity\tienda-lovesex\base-de-datos"
XLSX = os.path.join(BASE, "inventario-maestro-lovesex-22-junio-2026.xlsx")
CSV_OUT = os.path.join(BASE, "inventario_maestro_lovesex.csv")

wb = openpyxl.load_workbook(XLSX, data_only=True)
ws = wb.active

rows = list(ws.iter_rows(values_only=True))
if not rows:
    print("ERROR: xlsx vacío")
    sys.exit(1)

header = [str(c).strip() if c is not None else "" for c in rows[0]]
print(f"Header detectado ({len(header)} cols): {header}")

data_rows = []
skipped_empty = 0
for r in rows[1:]:
    # Saltar filas completamente vacías
    if all(c is None or str(c).strip() == "" for c in r):
        skipped_empty += 1
        continue
    # Tomar solo las primeras len(header) columnas (descarta basura lateral)
    normalized = ["" if c is None else str(c).strip() for c in r[:len(header)]]
    data_rows.append(normalized)

print(f"Filas de datos válidas: {len(data_rows)}")
print(f"Filas vacías descartadas: {skipped_empty}")

# Escribir CSV normalizado: UTF-8 sin BOM, newline universal, quoting RFC4180
with open(CSV_OUT, "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL, lineterminator="\n")
    writer.writerow(header)
    writer.writerows(data_rows)

size = os.path.getsize(CSV_OUT)
print(f"\nOK -> {CSV_OUT}")
print(f"   Tamaño: {size:,} bytes")
print(f"   Total filas escritas: {len(data_rows) + 1} (header + {len(data_rows)} productos)")
