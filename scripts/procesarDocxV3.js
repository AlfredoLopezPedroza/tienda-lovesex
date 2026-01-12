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
    const productosMapeados = new Set();

    lineas.forEach((linea, index) => {
      if (!linea.startsWith('SKU:')) return;

      const productoRaw = {
        sku: '',
        nombre: '',
        categoria: '',
        descripcion: '',
        precio: 0,
        precio_promo: 0
      };

      const bloques = linea.split(/SKU:|NOMBRE:|SLUG:|CATEGORIA:|DESCRIPCION:|PRECIO:|PRECIO_COSTO:|PRECIO_PROMO:|STOCK:|IMAGEN_PRINCIPAL:|GALERIA_MEDIA:|ML_URL:|TOP_VENTAS:/)
        .map(b => b.trim())
        .filter(b => b.length > 0);

      bloques.forEach((bloque, i) => {
        if (i === 0) return; // Primer bloque es el SKU, ya capturado
        const [clave, ...valorParts] = bloque.split(':');
        const valor = valorParts.join(':').trim();

        if (clave.toUpperCase() === 'NOMBRE' || clave.toUpperCase() === 'NOMBRE') {
          productoRaw.nombre = valor;
        } else if (clave.toUpperCase() === 'CATEGORIA') {
          productoRaw.categoria = valor.toUpperCase();
        } else if (clave.toUpperCase() === 'DESCRIPCION') {
          productoRaw.descripcion = valor;
        } else if (clave.toUpperCase() === 'PRECIO') {
          const precio = parseFloat(valor.replace('.00', '').replace(',', '.'));
          if (!isNaN(precio) && precio > 0) {
            productoRaw.precio = precio;
          }
        } else if (clave.toUpperCase() === 'PRECIO_PROMO') {
          const precio = parseFloat(valor.replace('.00', '').replace(',', '.'));
          if (!isNaN(precio) && precio > 0) {
            productoRaw.precio_promo = precio;
          }
        }
      });

      if (productoRaw.sku && productoRaw.nombre && !productosMapeados.has(productoRaw.sku)) {
        productosMapeados.add(productoRaw.sku);

        const producto = {
          id: generarUUID(),
          nombre: productoRaw.nombre,
          descripcion: productoRaw.descripcion || `Producto ${productoRaw.nombre} ideal para disfrutar momentos placenteros.`,
          categoria: normalizarCategoria(productoRaw.categoria),
          sku: productoRaw.sku,
          precio_base: productoRaw.precio > 0 ? productoRaw.precio : 299,
          precio_promo: productoRaw.precio_promo > 0 ? productoRaw.precio_promo : null,
          promo_activa: productoRaw.precio_promo > 0,
          disponible: true,
          imagen: obtenerImagenPorCategoria(normalizarCategoria(productoRaw.categoria))
        };

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
    }
  })
  .catch(err => {
    console.error('❌ Error procesando DOCX:', err);
  });

function normalizarCategoria(categoria) {
  if (!categoria) return 'DILDOS';

  const mapa = {
    'ARNÉS Y FETISH': 'ARNES FETISH',
    'ARNES Y FETISH': 'ARNES FETISH',
    'CREMAS LUBRICANTES': 'CREMAS LUBRICANTES',
    'LUBRICANTES': 'CREMAS LUBRICANTES',
    'JUGUETES ANALES': 'JUGUETES ANALES',
    'MASTURBADORES Y BOMBAS': 'MASTURBADORES BOMBAS',
    'VIGORIZANTES SEXUALES': 'VIGORIZANTES SEXUALES',
    'RETARDANTES': 'RETARDANTES'
  };

  return mapa[categoria] || categoria;
}

function obtenerImagenPorCategoria(categoria) {
  const mapa = {
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

  return mapa[categoria] || '/img/categorias/dildos.webp';
}
