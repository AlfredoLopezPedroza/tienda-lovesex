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

    console.log('🔍 Procesando DOCX...');

    const productos = [];
    const skuSet = new Set();

    lineas.forEach((linea) => {
      if (!linea.startsWith('SKU:')) return;

      const producto = {
        id: generarUUID(),
        sku: '',
        nombre: '',
        descripcion: '',
        categoria: 'DILDOS',
        precio_base: 299,
        precio_promo: null,
        promo_activa: false,
        disponible: true,
        imagen: '/img/categorias/dildos.webp'
      };

      const skuMatch = linea.match(/SKU:\s*([A-Z0-9-]+)/);
      if (skuMatch) {
        producto.sku = skuMatch[1];
      }

      const nombreMatch = linea.match(/NOMBRE:\s*([^\n]+?)(?=\s*SLUG:)/);
      if (nombreMatch) {
        producto.nombre = nombreMatch[1].trim();
      }

      const categoriaMatch = linea.match(/CATEGORIA:\s*([^\n]+?)(?=\s*DESCRIPCION:)/);
      if (categoriaMatch) {
        let cat = categoriaMatch[1].trim().toUpperCase();
        if (cat.includes('DILDOS')) {
          cat = 'DILDOS';
        } else if (cat.includes('ANAL')) {
          cat = 'JUGUETES ANALES';
        } else if (cat.includes('FETISH') || cat.includes('FETISH')) {
          cat = 'ARNES FETISH';
        } else if (cat.includes('LUBRICANT') || cat.includes('CREMA') || cat.includes('LUBR')) {
          cat = 'CREMAS LUBRICANTES';
        } else if (cat.includes('VIBRADOR')) {
          cat = 'VIBRADORES';
        } else if (cat.includes('MASTURBADOR') || cat.includes('BOMBA')) {
          cat = 'MASTURBADORES BOMBAS';
        } else if (cat.includes('RETARDANTE')) {
          cat = 'RETARDANTES';
        } else if (cat.includes('ANILLO') || cat.includes('FUNDA')) {
          cat = 'ANILLOS FUNDAS';
        } else if (cat.includes('VIGORIZANTE')) {
          cat = 'VIGORIZANTES SEXUALES';
        } else if (cat.includes('ESTIMULANTE')) {
          cat = 'ESTIMULANTES';
        } else if (cat.includes('ACCESORIO')) {
          cat = 'ACCESORIOS';
        }
        producto.categoria = cat;
      }

      const descripcionMatch = linea.match(/DESCRIPCION:\s*([^]*?)(?:\n|$)/);
      if (descripcionMatch) {
        const desc = descripcionMatch[1].trim();
        if (desc && desc.includes('PRECIO:')) {
          producto.descripcion = desc.split('PRECIO:')[0].trim();
        } else {
          producto.descripcion = desc;
        }
      }

      const precioBaseMatch = linea.match(/PRECIO:\s*(\d+[.,]+)/);
      if (precioBaseMatch) {
        const precio = parseFloat(precioBaseMatch[1].replace('.00', '').replace(',', '.'));
        if (!isNaN(precio) && precio > 0) {
          producto.precio_base = precio;
        }
      }

      const precioPromoMatch = linea.match(/PRECIO_PROMO:\s*(\d+[.,]+)/);
      if (precioPromoMatch) {
        const precio = parseFloat(precioPromoMatch[1].replace('.00', '').replace(',', '.'));
        if (!isNaN(precio) && precio > 0) {
          producto.precio_promo = precio;
          producto.promo_activa = true;
        }
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
        'VIGORIZANTES SEXUALES': '/img/categorias/vigorizantes-sexuales.webp',
        'ESTIMULANTES': '/img/categorias/dildos.webp',
        'ACCESORIOS': '/img/categorias/dildos.webp'
      };

      producto.imagen = categoriaImagenMap[producto.categoria] || '/img/categorias/dildos.webp';

      if (!producto.descripcion || producto.descripcion.length < 10) {
        producto.descripcion = `Producto ${producto.nombre} ideal para disfrutar momentos placenteros.`;
      }

      if (producto.precio_base <= 0) {
        producto.precio_base = 299;
      }

      if (producto.sku && producto.nombre && !skuSet.has(producto.sku)) {
        skuSet.add(producto.sku);
        productos.push(producto);
      }
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
      precioCero.forEach(p => {
        console.log(`   - ${p.sku}: ${p.nombre} - $${p.precio_base}`);
      });
    }
  })
  .catch(err => {
    console.error('❌ Error procesando DOCX:', err);
  });
