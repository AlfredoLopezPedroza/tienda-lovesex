const fs = require('fs');
const path = require('path');

// Ruta a las carpetas de imágenes
const imgDir = path.join(__dirname, '../public/img');
const outputFile = path.join(__dirname, '../data/productos.js');

// Función para convertir SKU a nombre legible (Title Case)
function skuToNombre(sku) {
  return sku
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Función para convertir nombre de carpeta a categoría legible (Title Case)
function formatearCategoria(nombreCarpeta) {
  return nombreCarpeta
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

try {
  // Leer todas las carpetas en public/img
  const categorias = fs.readdirSync(imgDir).filter(file => {
    return fs.statSync(path.join(imgDir, file)).isDirectory();
  });

  const productos = [];

  // Procesar cada categoría
  categorias.forEach(categoria => {
    const categoriePath = path.join(imgDir, categoria);
    const archivos = fs.readdirSync(categoriePath).filter(file => file.endsWith('.webp'));

    // Procesar cada imagen webp
    archivos.forEach(archivo => {
      const sku = archivo.replace('.webp', '');
      const nombreLegible = skuToNombre(sku);
      const categorialegible = formatearCategoria(categoria);

      productos.push({
        sku: sku,
        nombre: nombreLegible,
        categoria: categorialegible,
        precio: 0,
        disponible: true,
        imagen: `/img/${categoria}/${sku}.webp`
      });
    });
  });

  // Generar contenido del archivo
  const contenido = 'module.exports = ' + JSON.stringify(productos, null, 2) + ';';

  // Escribir el archivo
  fs.writeFileSync(outputFile, contenido, 'utf8');

  console.log(`✓ Archivo data/productos.js generado correctamente`);
  console.log(`✓ Total de productos generados: ${productos.length}`);
  console.log(`✓ Categorías procesadas: ${categorias.join(', ')}`);
} catch (error) {
  console.error('Error al generar el archivo de productos:', error.message);
  process.exit(1);
}
