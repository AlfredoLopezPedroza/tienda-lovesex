const mammoth = require('mammoth');
const fs = require('fs');
const crypto = require('crypto');

function generarUUID() {
  return crypto.randomBytes(16).toString('hex');
}

mammoth.extractRawText({path: './data/source/TODAS_las_categorias.docx'})
  .then(result => {
    const text = result.value;

    const productos = [];
    const skuSet = new Set();

    // Buscar bloques de productos usando regex
    const productoRegex = /SKU:\s*([^\n]+)\s+NOMBRE:\s*([^\n]+)\s*SLUG:[^\n]*\s*CATEGORIA:\s*([^\n]+)/g;

    let match;
    while ((match = productoRegex.exec(text)) !== null) {
      const sku = match[1].trim();
      const nombre = match[2].trim();
      let categoria = match[3].trim().toUpperCase();

      // Normalizar categoría
      if (categoria === 'DILDOS' || categoria === 'DILDOS (CATEGORIAS')' || categoria.includes('CATEGORIAS')) {
        categoria = 'DILDOS';
      } else if (categoria.includes('ANAL') || categoria.includes('JUGUETES')) {
        categoria = 'JUGUETES ANALES';
      } else if (categoria.includes('FETISH')) {
        categoria = 'ARNES FETISH';
      } else if (categoria.includes('CREMA') || categoria.includes('LUBRICANTE')) {
        categoria = 'CREMAS LUBRICANTES';
      } else if (categoria.includes('VIBRADOR')) {
        categoria = 'VIBRADORES';
      } else if (categoria.includes('BOMBA')) {
        categoria = 'MASTURBADORES BOMBAS';
      } else if (categoria.includes('ESTIMULANTE')) {
        categoria = 'ESTIMULANTES';
      } else if (categoria.includes('VIGORIZANTE')) {
        categoria = 'VIGORIZANTES SEXUALES';
      } else if (categoria.includes('FUNDAS') || categoria.includes('ANILLO')) {
        categoria = 'ANILLOS FUNDAS';
      }

      // Buscar descripción
      const descripcionMatch = text.match(new RegExp(`SKU:\\s*${sku}[^]*DESCRIPCION:\\s*([^\\n]+)(?:\\n|$)`));
      const descripcion = descripcionMatch ? descripcionMatch[1].trim() : `Producto ${nombre} ideal para disfrutar momentos placenteros.`;

      // Buscar precio
      const precioMatch = text.match(new RegExp(`SKU:\\s*${sku}[^]*PRECIO:\\s*([\\d.,]+)`));
      let precioBase = 299;
      if (precioMatch) {
        const precio = parseFloat(precioMatch[1].replace('.00', '').replace(',', '.'));
        if (!isNaN(precio) && precio > 0) {
          precioBase = precio;
        }
      }

      // Buscar precio promocional
      const precioPromoMatch = text.match(new RegExp(`SKU:\\s*${sku}[^]*PRECIO_PROMO:\\s*([\\d.,]+)`));
      let precioPromo = null;
      let promoActiva = false;
      if (precioPromoMatch) {
        const precio = parseFloat(precioPromoMatch[1].replace('.00', '').replace(',', '.'));
        if (!isNaN(precio) && precio > 0) {
          precioPromo = precio;
          promoActiva = true;
        }
      }

      const categoriaImagenMap = {
        'DILDOS': '/img/categorias/dildos.webp',
        'JUGUETES ANALES': '/img/categorias/juguetes-anales.webp',
        'VIBRADORES': '/img/categorias/vibradores.webp',
        'CREMAS LUBRICANTES': '/img/categorias/lubricantes-cremas.webp',
        'ARNES FETISH': '/img/categorias/arnes-fetish.webp',
        'MASTURBADORES BOMBAS': '/img/categorias/masturbadores-bombas.webp',
        'RETARDANTES': '/img/categorias/retardantes.webp',
        'VIGORIZANTES SEXUALES': '/img/categorias/vigorizantes-sexuales.webp',
        'ANILLOS FUNDAS': '/img/categorias/anillos-fundas.webp',
        'ESTIMULANTES': '/img/categorias/dildos.webp',
        'ACCESORIOS': '/img/categorias/dildos.webp'
      };

      const producto = {
        id: generarUUID(),
        nombre: nombre,
        descripcion: descripcion,
        categoria: categoria,
        sku: sku,
        precio_base: precioBase,
        precio_promo: precioPromo,
        promo_activa: promoActiva,
        disponible: true,
        imagen: categoriaImagenMap[categoria] || '/img/categorias/dildos.webp'
      };

      if (!skuSet.has(sku)) {
        skuSet.add(sku);
        productos.push(producto);
      }
    }

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
      precioCero.forEach(p => {
        console.log(`   - ${p.sku}: ${p.nombre} - $${p.precio_base}`);
      });
    }
  })
  .catch(err => {
    console.error('❌ Error procesando DOCX:', err);
  });
