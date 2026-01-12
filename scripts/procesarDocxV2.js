const mammoth = require('mammoth');
const fs = require('fs');
const crypto = require('crypto');

function generarUUID() {
  return crypto.randomBytes(16).toString('hex');
}

mammoth.extractRawText({path: './data/source/TODAS_LAS_CATEGORIAS.docx'})
  .then(result => {
    const text = result.value;

    // Mapeo de categorías según el DOCX
    const categoriasDocx = {
      'CATEGORIAS DILDOS': 'DILDOS',
      'JUGUETES ANALES': 'JUGUETES ANALES',
      'VIBRADORES': 'VIBRADORES',
      'LUBRICANTES Y CREMAS': 'CREMAS LUBRICANTES',
      'LUBRICANTES': 'CREMAS LUBRICANTES',
      'ARNÉS Y FETISH': 'ARNES FETISH',
      'FETICHE': 'ARNES FETISH',
      'MASTURBADORES Y BOMBAS': 'MASTURBADORES BOMBAS',
      'VIGORIZANTES SEXUALES': 'VIGORIZANTES SEXUALES',
      'ANILLOS Y FUNDAS': 'ANILLOS FUNDAS',
      'RETARDANTES': 'RETARDANTES'
    };

    const productos = [];
    const productoRegex = /SKU:\s*([^\n]+)\nNOMBRE:\s*([^\n]+)\nSLUG:[^\n]*\nCATEGORIA:\s*([^\n]+)\nDESCRIPCION:\s*([^\n]+(?:\n[^:])*)/g;

    let match;
    while ((match = productoRegex.exec(text)) !== null) {
      const sku = match[1].trim();
      const nombre = match[2].trim();
      let categoria = match[3].trim().toUpperCase();

      // Normalizar categoría
      if (categoriasDocx[categoria]) {
        categoria = categoriasDocx[categoria];
      }

      const descripcion = match[4].trim().split('PRECIO:')[0].trim();

      // Extraer precio
      const precioMatch = text.match(new RegExp(`SKU:\\s*${sku}[^]*PRECIO:\\s*([\\d.,]+)`));
      let precio_base = 299;
      if (precioMatch) {
        const precio = parseFloat(precioMatch[1].replace('.00', '').replace(',', '.'));
        if (!isNaN(precio) && precio > 0) {
          precio_base = precio;
        }
      }

      // Extraer precio promocional
      const promoMatch = text.match(new RegExp(`SKU:\\s*${sku}[^]*PRECIO_PROMO:\\s*([\\d.,]+)`));
      let precio_promo = null;
      let promo_activa = false;
      if (promoMatch) {
        const promo = parseFloat(promoMatch[1].replace('.00', '').replace(',', '.'));
        if (!isNaN(promo) && promo > 0) {
          precio_promo = promo;
          promo_activa = true;
        }
      }

      // Mapeo de imágenes por categoría
      const categoriaImagenMap = {
        'DILDOS': '/img/categorias/dildos.webp',
        'JUGUETES ANALES': '/img/categorias/juguetes-anales.webp',
        'VIBRADORES': '/img/categorias/vibradores.webp',
        'CREMAS LUBRICANTES': '/img/categorias/lubricantes-cremas.webp',
        'ARNES FETISH': '/img/categorias/arnes-fetish.webp',
        'MASTURBADORES BOMBAS': '/img/categorias/masturbadores-bombas.webp',
        'VIGORIZANTES SEXUALES': '/img/categorias/vigorizantes-sexuales.webp',
        'ANILLOS FUNDAS': '/img/categorias/anillos-fundas.webp',
        'RETARDANTES': '/img/categorias/retardantes.webp'
      };

      const producto = {
        id: generarUUID(),
        nombre: nombre,
        descripcion: descripcion || `Producto ${nombre} ideal para disfrutar momentos placenteros.`,
        categoria: categoria,
        sku: sku,
        precio_base: precio_base,
        precio_promo: precio_promo,
        promo_activa: promo_activa,
        disponible: true,
        imagen: categoriaImagenMap[categoria] || '/img/categorias/dildos.webp'
      };

      productos.push(producto);
    }

    // Generar archivo JS
    const contenido = `module.exports = ${JSON.stringify(productos, null, 2)};\n`;
    fs.writeFileSync('./data/productos.js', contenido, 'utf8');

    console.log('✅ Productos procesados correctamente');
    console.log(`📊 Total de productos: ${productos.length}`);

    // Contar por categoría
    const categorias = {};
    productos.forEach(p => {
      categorias[p.categoria] = (categorias[p.categoria] || 0) + 1;
    });
    console.log('📂 Productos por categoría:');
    Object.entries(categorias).sort().forEach(([cat, count]) => {
      console.log(`   - ${cat}: ${count}`);
    });

    // Validaciones
    const precioCero = productos.filter(p => p.precio_base <= 0);
    if (precioCero.length > 0) {
      console.log(`⚠️  Productos con precio <= 0: ${precioCero.length}`);
    }
  })
  .catch(err => {
    console.error('❌ Error procesando DOCX:', err);
  });
