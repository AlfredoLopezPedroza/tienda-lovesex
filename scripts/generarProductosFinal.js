const fs = require('fs');
const path = require('path');

const productosData = require('../data/productos.js');

const imgDir = path.join(__dirname, '../public/img');

const categoriasDirs = {
  'ANILLOS FUNDAS': 'anillos-fundas',
  'ARNES FETISH': 'arnes-fetish',
  'CREMAS LUBRICANTES': 'cremas-lubricantes',
  'DILDOS': 'dildos',
  'JUGUETES ANALES': 'juguetes-anales',
  'MASTURBADORES BOMBAS': 'masturbadores-bombas',
  'RETARDANTES': 'retardantes',
  'VIBRADORES': 'vibradores',
  'VIGORIZANTES SEXUALES': 'vigorizantes-sexuales',
  'ESTIMULANTES': 'dildos',
  'FETICHE': 'arnes-fetish',
  'ACCESORIOS': 'anillos-fundas'
};

function generarSlug(nombre) {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function buscarImagen(sku, categoriaNombre) {
  const categoriaDir = categoriasDirs[categoriaNombre];
  if (!categoriaDir) return '/img/categorias/dildos.webp';

  const dirPath = path.join(imgDir, categoriaDir);
  
  if (!fs.existsSync(dirPath)) {
    return '/img/categorias/dildos.webp';
  }

  const archivos = fs.readdirSync(dirPath);
  
  const skuVariants = [
    sku.toLowerCase(),
    sku.replace('DP-', 'DL-').toLowerCase(),
    sku.replace('DL-', 'DP-').toLowerCase(),
    sku.toLowerCase().replace('2', ''),
    sku.toLowerCase().replace('ci', 'ción'),
    sku.toLowerCase().replace('ción', 'ci')
  ];
  
  for (const variant of skuVariants) {
    const archivoEncontrado = archivos.find(archivo => {
      const nombreArchivo = archivo.replace('.webp', '').toLowerCase().trim().replace(/ 2$/, '').replace(/ /g, '');
      const variantClean = variant.replace(/ /g, '');
      return nombreArchivo === variantClean || nombreArchivo.startsWith(variantClean + ' ');
    });

    if (archivoEncontrado) {
      return `/img/${categoriaDir}/${archivoEncontrado}`;
    }
  }

  const todasCategorias = Object.values(categoriasDirs);
  for (const catDir of todasCategorias) {
    if (catDir === categoriaDir) continue;
    
    const catPath = path.join(imgDir, catDir);
    if (!fs.existsSync(catPath)) continue;
    
    const catArchivos = fs.readdirSync(catPath);
    for (const variant of skuVariants) {
      const archivoEncontrado = catArchivos.find(archivo => {
        const nombreArchivo = archivo.replace('.webp', '').toLowerCase().trim().replace(/ 2$/, '').replace(/ /g, '');
        const variantClean = variant.replace(/ /g, '');
        return nombreArchivo === variantClean || nombreArchivo.startsWith(variantClean + ' ');
      });

      if (archivoEncontrado) {
        return `/img/${catDir}/${archivoEncontrado}`;
      }
    }
  }

  return '/img/categorias/dildos.webp';
}

const productosConImagenes = productosData.map(producto => {
  const imagen = buscarImagen(producto.sku, producto.categoria);
  
  return {
    sku: producto.sku,
    slug: generarSlug(`${producto.nombre}-${producto.sku}`),
    nombre: producto.nombre,
    descripcion: producto.descripcion || '',
    precio_base: producto.precio_base || 0,
    precio_promo: producto.precio_promo || null,
    promo_activa: producto.promo_activa || false,
    categoria: producto.categoria,
    imagen: imagen,
    galeria: [],
    disponible: producto.disponible !== false,
    stock_nota: producto.stock_nota || 'Disponible'
  };
});

const productosPorCategoria = {};
productosConImagenes.forEach(producto => {
  if (!productosPorCategoria[producto.categoria]) {
    productosPorCategoria[producto.categoria] = [];
  }
  productosPorCategoria[producto.categoria].push(producto);
});

const resultado = {
  version: "2.0.0",
  categorias: Object.keys(productosPorCategoria).sort().map(cat => ({
    slug: cat.toLowerCase().replace(/\s+/g, '-'),
    nombre: cat,
    productos: productosPorCategoria[cat]
  }))
};

fs.writeFileSync(
  path.join(__dirname, '../data/productos.json'),
  JSON.stringify(resultado, null, 2),
  'utf8'
);

console.log('✅ Archivo productos.json generado correctamente');
console.log(`📊 Total de productos: ${productosConImagenes.length}`);
console.log(`📂 Categorías: ${Object.keys(productosPorCategoria).length}`);

Object.entries(productosPorCategoria).sort().forEach(([cat, prods]) => {
  console.log(`   - ${cat}: ${prods.length} productos`);
});

const sinImagen = productosConImagenes.filter(p => p.imagen.includes('/img/categorias/'));
if (sinImagen.length > 0) {
  console.log(`⚠️  Productos sin imagen específica: ${sinImagen.length}`);
}
