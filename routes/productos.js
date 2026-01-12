const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/', (req, res) => {
  try {
    const productosPath = path.join(__dirname, '../data/productos.json');
    console.log('=== PETICIÓN /api/productos ===');
    console.log('Ruta absoluta:', path.resolve(productosPath));
    
    if (!fs.existsSync(productosPath)) {
      console.error('❌ Archivo no existe:', productosPath);
      res.status(500).json({
        success: false,
        error: 'Archivo productos.json no encontrado'
      });
      return;
    }

    const productosData = JSON.parse(fs.readFileSync(productosPath, 'utf8'));
    
    if (!productosData.productos || !Array.isArray(productosData.productos)) {
      console.error('❌ Estructura inválida: productos array no encontrado');
      console.log('  Claves disponibles:', Object.keys(productosData));
      res.status(500).json({
        success: false,
        error: 'Estructura de datos inválida'
      });
      return;
    }

    console.log('✅ Total productos:', productosData.productos.length);

    res.json({
      success: true,
      total: productosData.productos.length,
      data: productosData.productos
    });
  } catch (error) {
    console.error('❌ Error leyendo productos.json:', error.message);
    res.status(500).json({
      success: false,
      error: 'Error cargando productos'
    });
  }
});

module.exports = router;
