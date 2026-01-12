const mammoth = require('mammoth');
const fs = require('fs');
const crypto = require('crypto');

function generarUUID() {
  return crypto.randomBytes(16).toString('hex');
}

mammoth.extractRawText({path: './data/source/TODAS_LAS_CATEGORIAS.docx'})
  .then(result => {
    const text = result.value;

    const productos = [];
    const skuSet = new Set();

    const categoriaMap = {
      'DILDOS': 'DILDOS',
      'ANILLOS Y FUNDAS': 'ANILLOS FUNDAS',
      'JUGUETES ANALES': 'JUGUETES ANALES',
      'LUBRICANTES Y CREMAS': 'CREMAS LUBRICANTES',
      'CREMAS LUBRICANTES': 'CREMAS LUBRICANTES',
      'LUBRICANTES': 'CREMAS LUBRICANTES',
      'ARNES Y FETISH': 'ARNES FETISH',
      'ARNÉS Y FETISH': 'ARNES FETISH',
      'FETICHE': 'ARNES FETISH',
      'MASTURBADORES Y BOMBAS': 'MASTURBADORES BOMBAS',
      'VIBRADORES': 'VIBRADORES',
      'VIGORIZANTES SEXUALES': 'VIGORIZANTES SEXUALES',
      'RETARDANTES': 'RETARDANTES'
    };

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

    const productoRegex = /SKU:\s*([A-Z0-9-]+)\s*NOMBRE:\s*([^\n]+)\s*SLUG:[^\n]*\s*CATEGORIA:\s*([^\n]+)\s*DESCRIPCION:\s*([^\n]+?)(?:\n|$)/g;

    let match;
    while ((match = productoRegex.exec(text)) !== null) {
      const sku = match[1].trim();
      const nombre = match[2].trim();
      let categoria = match[3].trim().toUpperCase();

      if (categoriaMap[categoria]) {
        categoria = categoriaMap[categoria];
      }

      let descripcion = match[4].trim();
      descripcion = descripcion.replace(/\nPRECIO:.*/gi, '');

      const precioBaseMatch = text.match(new RegExp(`SKU:\\s*${sku}[^]*PRECIO:\\s*([\\d.,]+)`));
      let precioBase = 299;
      if (precioBaseMatch) {
        const precio = parseFloat(precioBaseMatch[1].replace('.00', '').replace(',', '.'));
        if (!isNaN(precio) && precio > 0) {
          precioBase = precio;
        }
      }

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

      if (!descripcion || descripcion.length < 10) {
        descripcion = `Producto ${nombre} ideal para disfrutar momentos placenteros.`;
      }

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
