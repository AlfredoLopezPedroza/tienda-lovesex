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

      const campos = linea.split(/\s+(SKU:|NOMBRE:|SLUG:|CATEGORIA:|DESCRIPCION:|PRECIO:|PRECIO_COSTO:|PRECIO_PROMO:|STOCK:|IMAGEN_PRINCIPAL:|GALERIA_MEDIA:|ML_URL:|TOP_VENTAS:)/)
        .filter(c => c.trim())
        .map(c => c.trim());

      campos.forEach(campo => {
        const [clave, ...valorParts] = campo.split(':');
        const valor = valorParts.join(':').trim();

        if (clave.toUpperCase() === 'SKU') {
          producto.sku = valor;
        } else if (clave.toUpperCase() === 'NOMBRE') {
          producto.nombre = valor;
        } else if (clave.toUpperCase() === 'CATEGORIA') {
          producto.categoria = normalizarCategoria(valor);
        } else if (clave.toUpperCase() === 'DESCRIPCION') {
          producto.descripcion = valor;
        } else if (clave.toUpperCase() === 'PRECIO' && !clave.includes('COSTO')) {
          const precio = parseFloat(valor.replace('.00', '').replace(',', '.'));
          if (!isNaN(precio) && precio > 0) {
            producto.precio_base = precio;
          }
        } else if (clave.toUpperCase() === 'PRECIO_PROMO') {
          const precio = parseFloat(valor.replace('.00', '').replace(',', '.'));
          if (!isNaN(precio) && precio > 0) {
            producto.precio_promo = precio;
            producto.promo_activa = true;
          }
        }
      });

      if (!producto.descripcion || producto.descripcion.length < 10) {
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
        'VIGORIZANTES SEXUALES': '/img/categorias/vigorizantes-sexuales.webp',
        'ACCESORIOS': '/img/categorias/dildos.webp',
        'ESTIMULANTES': '/img/categorias/dildos.webp'
      };

      producto.imagen = categoriaImagenMap[producto.categoria] || '/img/categorias/dildos.webp';

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
    'LUBRICANTES Y CREMAS': 'CREMAS LUBRICANTES',
    'LUBRICANTES': 'CREMAS LUBRICANTES',
    'FETICHE': 'ARNES FETISH',
    'MASTURBADORES Y BOMBAS': 'MASTURBADORES BOMBAS',
    'VIBORIZANTES SEXUALES': 'VIGORIZANTES SEXUALES'
  };

  return mapa[categoria] || categoria.toUpperCase();
}
