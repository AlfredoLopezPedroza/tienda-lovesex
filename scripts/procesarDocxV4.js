const mammoth = require('mammoth');
const fs = require('fs');
const crypto = require('crypto');

function generarUUID() {
  return crypto.randomBytes(16).toString('hex');
}

mammoth.extractRawText({path: './data/source/TODAS_LAS_CATEGORIAS.docx'})
  .then(result => {
    const text = result.value;
    const lineas = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    const productos = [];
    const productosSet = new Set();

    lineas.forEach((linea, index) => {
      if (!linea.startsWith('SKU:')) return;

      const skuMatch = linea.match(/SKU:\s*([^\s]+)/);
      if (!skuMatch) return;
      const sku = skuMatch[1];

      if (productosSet.has(sku)) return;
      productosSet.add(sku);

      const producto = {
        id: generarUUID(),
        sku: sku,
        nombre: '',
        descripcion: '',
        categoria: 'DILDOS',
        precio_base: 299,
        precio_promo: null,
        promo_activa: false,
        disponible: true,
        imagen: '/img/categorias/dildos.webp'
      };

      const nombreMatch = text.match(new RegExp(`SKU:\\s*${sku}[^]*NOMBRE:\\s*([^\\n]+)`));
      if (nombreMatch) {
        producto.nombre = nombreMatch[1].trim();
      }

      const categoriaMatch = text.match(new RegExp(`SKU:\\s*${sku}[^]*CATEGORIA:\\s*([^\\n]+)`));
      if (categoriaMatch) {
        producto.categoria = categoriaMatch[1].trim().toUpperCase();
      }

      const descripcionMatch = text.match(new RegExp(`SKU:\\s*${sku}[^]*DESCRIPCION:\\s*((?:(?!PRECIO:)[^\\n])+)`));
      if (descripcionMatch) {
        producto.descripcion = descripcionMatch[1].trim();
      }

      const precioMatch = text.match(new RegExp(`SKU:\\s*${sku}[^]*PRECIO:\\s*([\\d.,]+)`));
      if (precioMatch) {
        const precio = parseFloat(precioMatch[1].replace('.00', '').replace(',', '.'));
        if (!isNaN(precio) && precio > 0) {
          producto.precio_base = precio;
        }
      }

      const promoMatch = text.match(new RegExp(`SKU:\\s*${sku}[^]*PRECIO_PROMO:\\s*([\\d.,]+)`));
      if (promoMatch) {
        const precio = parseFloat(promoMatch[1].replace('.00', '').replace(',', '.'));
        if (!isNaN(precio) && precio > 0) {
          producto.precio_promo = precio;
          producto.promo_activa = true;
        }
      }

      if (!producto.descripcion) {
        producto.descripcion = `Producto ${producto.nombre} ideal para disfrutar momentos placenteros.`;
      }

      const categoriaImagenMap = {
        'ANILLOS FUNDAS': '/img/categorias/anillos-fundas.webp',
        'ARNES FETISH': '/img/categorias/arnes-fetish.webp',
        'CREMAS LUBRICANTES': '/img/categorias/lubricantes-cremas.webp',
        'DILDOS': '/img/categorias/dildos.webp',
        'JUGUETES ANALES': '/img/categorias/juguetes-anales.webp',
        'MASTURBADORES BOMBAS': '/img/categorias/masturbadores-bombas.webp',
        'RETARDANTES': '/img/categorias/retardantes.webp',
        'VIBRADORES': '/img/categorias/vibradores.webp',
        'VIGORIZANTES SEXUALES': '/img/categorias/vigorizantes-sexuales.webp'
      };

      producto.imagen = categoriaImagenMap[producto.categoria] || '/img/categorias/dildos.webp';

      productos.push(producto);
    });

    const contenido = `module.exports = ${JSON.stringify(productos, null, 2)};\n`;
    fs.writeFileSync('./data/productos.js', contenido, 'utf8');

    console.log('✅ Productos procesados correctamente');
    console.log(`📊 Total de productos: ${productos.length}`);

    const categorias = {};
    productos.forEach(p => {
      categorias[p.categoria] = (categorias[p.categoria] || 0) + 1;
    });
    console.log('📂 Productos por categoría:');
    Object.entries(categorias).sort().forEach(([cat, count]) => {
      console.log(`   - ${cat}: ${count}`);
    });

    const precioCero = productos.filter(p => p.precio_base <= 0);
    if (precioCero.length > 0) {
      console.log(`⚠️  Productos con precio <= 0: ${precioCero.length}`);
    }
  })
  .catch(err => {
    console.error('❌ Error procesando DOCX:', err);
  });
