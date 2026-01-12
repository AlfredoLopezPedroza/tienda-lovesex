const fs = require('fs');
const path = require('path');

const IMG_BASE = path.join(__dirname, '../public/img');
const OUTPUT = path.join(__dirname, '../data/productos.js');

const CATEGORIAS = {
  'anillos-fundas': 'Anillos y Fundas',
  'dildos': 'Dildos',
  'vibradores': 'Vibradores',
  'juguetes-anales': 'Juguetes Anales',
  'cremas-lubricantes': 'Lubricantes',
  'arnes-fetish': 'Arnés / Fetish',
  'masturbadores-bombas': 'Masturbadores',
  'retardantes': 'Retardantes',
  'vigor-sexual': 'Vigor Sexual'
};

let productos = [];

for (const carpeta of fs.readdirSync(IMG_BASE)) {
  const rutaCategoria = path.join(IMG_BASE, carpeta);
  if (!fs.statSync(rutaCategoria).isDirectory()) continue;

  const categoriaNombre = CATEGORIAS[carpeta] || carpeta;

  for (const archivo of fs.readdirSync(rutaCategoria)) {
    if (!archivo.endsWith('.webp')) continue;

    const sku = archivo.replace('.webp', '');
    const nombre = sku
      .split('-')
      .slice(1)
      .join(' ')
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());

    productos.push({
      sku,
      nombre,
      categoria: categoriaNombre,
      precio: 0,
      disponible: true,
      imagen: `/img/${carpeta}/${archivo}`
    });
  }
}

fs.writeFileSync(
  OUTPUT,
  'module.exports = ' + JSON.stringify(productos, null, 2) + ';\n',
  'utf8'
);

console.log(`✅ ${productos.length} productos generados automáticamente`);
