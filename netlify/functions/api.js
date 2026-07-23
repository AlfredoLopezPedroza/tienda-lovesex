const path = require('path');
const fs = require('fs');

// ── Ruta base: desde netlify/functions/ → raíz del proyecto ──
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const { path: urlPath, httpMethod } = event;

    // ── GET /api/productos ──────────────────────────────
    if (urlPath === '/api/productos' && httpMethod === 'GET') {
      const productosPath = path.join(DATA_DIR, 'productos.json');

      if (!fs.existsSync(productosPath)) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ success: false, error: 'Archivo productos.json no encontrado' })
        };
      }

      const raw = fs.readFileSync(productosPath, 'utf8');
      const data = JSON.parse(raw);

      if (!data.productos || !Array.isArray(data.productos)) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ success: false, error: 'Estructura inválida' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          total: data.productos.length,
          data: data.productos
        })
      };
    }

    // ── GET /api/packs ──────────────────────────────────
    if (urlPath === '/api/packs' && httpMethod === 'GET') {
      const packs = require(path.join(DATA_DIR, 'packs.js'));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, total: packs.length, data: packs })
      };
    }

    // ── GET /api/experiencias ───────────────────────────
    if (urlPath === '/api/experiencias' && httpMethod === 'GET') {
      const experiencias = require(path.join(DATA_DIR, 'experiencias.js'));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, total: experiencias.length, data: experiencias })
      };
    }

    // ── 404 para cualquier otra ruta ────────────────────
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ success: false, error: 'Ruta no encontrada' })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};