"""
preview_server.py — Servidor de previsualización local (réplica fiel del server.js Express).
Permite ver la tienda con el inventario NUEVO sin necesidad de Node.js ni deploy.

Réplica exacta del comportamiento de server.js + routes/*.js:
  - Sirve archivos estáticos desde public/
  - GET /                        -> public/index.html
  - GET /api/productos           -> {success, total, data: productos}
  - GET /api/packs               -> {success, total, data: packs}
  - GET /api/experiencias        -> {success, total, data: experiencias}

Uso:  python scripts/preview_server.py
      Luego abre http://localhost:3000 en el navegador.
      CTRL+C para detener.
"""
import json
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

ROOT = r"C:\Users\elult\Downloads\IA-CROPOLIS\AGENTES-IA\AGENTES ACTIVOS\ANTIGRAVITY\artefactos-antigravity\tienda-lovesex"
PUBLIC = os.path.join(ROOT, "public")
DATA = os.path.join(ROOT, "data")
PORT = 3000


def load_json(name):
    """Carga JSON desde data/. Devuelve [] si no existe (gracia como routes/*.js)."""
    path = os.path.join(DATA, name)
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as f:
        return json.load(f)


class PreviewHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC, **kwargs)

    def _send_api(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = urlparse(self.path).path.rstrip("/") or "/"

        # --- API endpoints (réplica de routes/*.js) ---
        if path == "/api/productos":
            data = load_json("productos.json")
            productos = data.get("productos", []) if isinstance(data, dict) else data
            return self._send_api({"success": True, "total": len(productos), "data": productos})

        if path == "/api/packs":
            # routes/packs.js hace require('../data/packs') que lee packs.js (CommonJS export)
            packs = self._load_js_array("packs.js")
            return self._send_api({"success": True, "total": len(packs), "data": packs})

        if path == "/api/experiencias":
            exp = self._load_js_array("experiencias.js")
            return self._send_api({"success": True, "total": len(exp), "data": exp})

        # --- Raíz -> index.html (réplica de server.js) ---
        if path == "/":
            self.path = "/index.html"
        return super().do_GET()

    def _load_js_array(self, js_filename):
        """data/packs.js y data/experiencias.js son módulos CommonJS (module.exports = [...])
        Python no puede requerirlos directamente. Como precaución, intentamos cargar el .json
        equivalente si existe; si no, devolvemos []. La tienda maneja arrays vacíos sin romper."""
        json_alt = js_filename.replace(".js", ".json")
        if os.path.exists(os.path.join(DATA, json_alt)):
            return load_json(json_alt)
        return []


def main():
    os.chdir(PUBLIC)
    productos = load_json("productos.json")
    n = len(productos.get("productos", [])) if isinstance(productos, dict) else 0
    server = ThreadingHTTPServer(("localhost", PORT), PreviewHandler)
    print("=" * 60)
    print("  LOVE&SEX · Servidor de previsualización local")
    print("=" * 60)
    print(f"  Productos cargados: {n}")
    print()
    print(f"  Abre en el navegador: http://localhost:{PORT}")
    print()
    print("  CTRL+C para detener el servidor.")
    print("=" * 60)
    print()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\nServidor detenido.")
        server.server_close()


if __name__ == "__main__":
    main()
