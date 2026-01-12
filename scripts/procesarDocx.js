const mammoth = require('mammoth');
const fs = require('fs');
const crypto = require('crypto');

function generarUUID() {
  return crypto.randomBytes(16).toString('hex');
}

mammoth.extractRawText({path: './data/source/TODAS_LAS_CATEGORIAS.docx'})
  .then(result => {
    const text = result.value;
    const lineas = text.split('\n').filter(linea => linea.trim());

    const productos = [];
    let categoriaActual = '';

    lineas.forEach(linea => {
      linea = linea.trim();

      // Detectar categoría (línea que solo contiene categoría)
      if (linea.match(/^[A-ZÁÉÍÓÚÑ\s&]+$/) && !linea.includes(':')) {
        categoriaActual = linea.toUpperCase();
        return;
      }

      // Detectar producto
      if (linea.startsWith('SKU:')) {
        const producto = {
          id: generarUUID(),
          nombre: '',
          descripcion: '',
          categoria: categoriaActual,
          sku: '',
          precio_base: 0,
          precio_promo: null,
          promo_activa: false,
          disponible: true,
          imagen: '/img/categorias/dildos.webp'
        };

        const campos = linea.split(/SKU:|NOMBRE:|CATEGORIA:|DESCRIPCION:|PRECIO:|PRECIO_COSTO:|PRECIO_PROMO:|STOCK:|IMAGEN_PRINCIPAL:|GALERIA_MEDIA:|ML_URL:|TOP_VENTAS:/)
          .filter(c => c.trim())
          .map(c => c.trim());

        campos.forEach(campo => {
          if (campo.startsWith('SKU:')) {
            producto.sku = campo.replace('SKU:', '').trim();
          } else if (campo.startsWith('NOMBRE:')) {
            producto.nombre = campo.replace('NOMBRE:', '').trim();
          } else if (campo.startsWith('CATEGORIA:')) {
            producto.categoria = campo.replace('CATEGORIA:', '').trim().toUpperCase();
          } else if (campo.startsWith('DESCRIPCION:')) {
            producto.descripcion = campo.replace('DESCRIPCION:', '').trim();
          } else if (campo.startsWith('PRECIO:')) {
            const precio = parseFloat(campo.replace('PRECIO:', '').replace('.00', '').replace(',', '.'));
            if (!isNaN(precio) && precio > 0) {
              producto.precio_base = precio;
            }
          } else if (campo.startsWith('PRECIO_PROMO:')) {
            const precioPromo = parseFloat(campo.replace('PRECIO_PROMO:', '').replace('.00', '').replace(',', '.'));
            if (!isNaN(precioPromo) && precioPromo > 0) {
              producto.precio_promo = precioPromo;
              producto.promo_activa = true;
            }
          }
        });

        // Generar SKU si no existe
        if (!producto.sku && producto.nombre) {
          const categoriaCodigo = producto.categoria.toUpperCase()
            .replace(/[^A-Z]/g, '')
            .substring(0, 3);
          const nombreCodigo = producto.nombre.toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .substring(0, 6);
          producto.sku = `LS-${categoriaCodigo}-${nombreCodigo}`;
        }

        // Generar descripción si no existe
        if (!producto.descripcion && producto.nombre) {
          producto.descripcion = `Producto ${producto.nombre} ideal para disfrutar momentos placenteros.`;
        }

        // Asignar imagen según categoría
        const categoriaImagenMap = {
          'DILDOS': '/img/categorias/dildos.webp',
          'JUGUETES ANALES': '/img/categorias/juguetes-anales.webp',
          'VIBRADORES': '/img/categorias/vibradores.webp',
          'LUBRICANTES': '/img/categorias/lubricantes-cremas.webp',
          'ARNÉS Y FETISH': '/img/categorias/arnes-fetish.webp',
          'FETICHE': '/img/categorias/arnes-fetish.webp',
          'MASTURBADORES': '/img/categorias/masturbadores-bombas.webp'
        };

        producto.imagen = categoriaImagenMap[producto.categoria] || '/img/categorias/dildos.webp';

        // Validar precio
        if (producto.precio_base <= 0) {
          producto.precio_base = 299;
        }

        productos.push(producto);
      }
    });

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
  })
  .catch(err => {
    console.error('❌ Error procesando DOCX:', err);
  });
