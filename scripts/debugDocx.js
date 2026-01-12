const mammoth = require('mammoth');
const fs = require('fs');

mammoth.extractRawText({path: './data/source/TODAS_LAS_CATEGORIAS.docx'})
  .then(result => {
    const text = result.value;
    const lineas = text.split('\n').filter(l => l.trim().length > 0);

    console.log('=== PRIMERAS 20 LÍNEAS ===');
    lineas.slice(0, 20).forEach((l, i) => {
      console.log(`${i + 1}: ${l}`);
    });

    console.log('\n=== BUSCANDO SKU ===');
    const skuLineas = lineas.filter(l => l.startsWith('SKU:'));
    console.log(`Encontrados ${skuLineas.length} líneas con SKU:`);
    skuLineas.slice(0, 5).forEach(l => {
      console.log(`  ${l}`);
    });
  })
  .catch(err => {
    console.error('❌ Error:', err);
  });
