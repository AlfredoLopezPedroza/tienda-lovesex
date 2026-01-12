const fs = require('fs');
const path = require('path');

// Ruta absoluta a productos.js
const productosPath = path.join(__dirname, '../data/productos.js');

// Leer el archivo
const contenido = fs.readFileSync(productosPath, 'utf8');

// Extraer el array del module.exports
const match = contenido.match(/module\.exports = (\[.*\]);/s);
if (!match) {
  console.error('❌ No se pudo extraer el array de productos');
  process.exit(1);
}

const productos = JSON.parse(match[1]);

// Transformar cada producto
const productosTransformados = productos.map(producto => {
  return {
    sku: producto.sku,
    nombre: producto.nombre,
    categoria: producto.categoria,
    precio_base: producto.precio,
    precio_promo: null,
    promo_activa: false,
    disponible: producto.disponible,
    imagen: producto.imagen
  };
});

// Generar el nuevo archivo
const nuevoContenido = `module.exports = ${JSON.stringify(productosTransformados, null, 2)};\n`;

// Escribir el nuevo archivo
fs.writeFileSync(productosPath, nuevoContenido, 'utf8');

console.log('✅ Productos transformados correctamente');
console.log(`📊 Total de productos: ${productosTransformados.length}`);
