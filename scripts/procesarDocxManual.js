const mammoth = require('mammoth');
const fs = require('fs');
const crypto = require('crypto');

function generarUUID() {
  return crypto.randomBytes(16).toString('hex');
}

mammoth.extractRawText({path: './data/source/TODAS_LAS_CATEGORIAS.docx'})
  .then(result => {
    const text = result.value;

    console.log('📄 Longitud del texto:', text.length);
    console.log('🔍 Buscando productos...');

    const productos = [];
    const skuSet = new Set();
    let productoActual = null;

    const lineas = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

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

    lineas.forEach((linea, index) => {
      if (linea.startsWith('SKU:')) {
        if (productoActual && productoActual.nombre) {
          if (!skuSet.has(productoActual.sku)) {
            skuSet.add(productoActual.sku);
            productos.push({...productoActual});
          }
        }

        const sku = linea.replace('SKU:', '').trim();

        productoActual = {
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
      } else if (productoActual) {
        if (linea.startsWith('NOMBRE:')) {
          productoActual.nombre = linea.replace('NOMBRE:', '').trim();
        } else if (linea.startsWith('CATEGORIA:')) {
          let cat = linea.replace('CATEGORIA:', '').trim().toUpperCase();
          if (cat.includes('DILDOS')) {
            cat = 'DILDOS';
          } else if (cat.includes('ANAL')) {
            cat = 'JUGUETES ANALES';
          } else if (cat.includes('FETISH') || cat.includes('FETISH')) {
            cat = 'ARNES FETISH';
          } else if (cat.includes('LUBRICANT') || cat.includes('CREMAS')) {
            cat = 'CREMAS LUBRICANTES';
          } else if (cat.includes('VIBRADOR')) {
            cat = 'VIBRADORES';
          } else if (cat.includes('MASTURBADOR') || cat.includes('BOMBA')) {
            cat = 'MASTURBADORES BOMBAS';
          } else if (cat.includes('VIGORIZANTE')) {
            cat = 'VIGORIZANTES SEXUALES';
          } else if (cat.includes('RETARDANTE')) {
            cat = 'RETARDANTES';
          } else if (cat.includes('ACCESORIO')) {
            cat = 'ACCESORIOS';
          } else if (cat.includes('ESTIMULANTE')) {
            cat = 'ESTIMULANTES';
          }
          productoActual.categoria = cat;
        } else if (linea.startsWith('DESCRIPCION:')) {
          const desc = linea.replace('DESCRIPCION:', '').trim();
          if (desc.includes('PRECIO:')) {
            productoActual.descripcion = desc.split('PRECIO:')[0].trim();
          } else {
            productoActual.descripcion = desc;
          }
        } else if (linea.startsWith('PRECIO:') && !linea.includes('PRECIO_COSTO') && !linea.includes('PRECIO_PROMO')) {
          const precio = parseFloat(linea.replace('PRECIO:', '').replace('.00', '').replace(',', '.'));
          if (!isNaN(precio) && precio > 0) {
            productoActual.precio_base = precio;
          }
        } else if (linea.startsWith('PRECIO_PROMO:')) {
          const precio = parseFloat(linea.replace('PRECIO_PROMO:', '').replace('.00', '').replace(',', '.'));
          if (!isNaN(precio) && precio > 0) {
            productoActual.precio_promo = precio;
            productoActual.promo_activa = true;
          }
        }
      }
    });

    if (productoActual && productoActual.nombre) {
      if (!skuSet.has(productoActual.sku)) {
        skuSet.add(productoActual.sku);
        productos.push(productoActual);
      }
    }

    productos.forEach(p => {
      if (!p.descripcion || p.descripcion.length < 10) {
        p.descripcion = `Producto ${p.nombre} ideal para disfrutar momentos placenteros.`;
      }

      p.imagen = categoriaImagenMap[p.categoria] || '/img/categorias/dildos.webp';

      if (p.precio_base <= 0) {
        p.precio_base = 299;
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
