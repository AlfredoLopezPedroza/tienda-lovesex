const mammoth = require('mammoth');

mammoth.extractRawText({path: './data/source/TODAS_LAS_CATEGORIAS.docx'})
  .then(result => {
    const text = result.value;
    const lineas = text.split('\n').filter(l => l.trim());

    console.log('=== PRIMERAS 10 LÍNEAS ===');
    lineas.slice(0, 10).forEach((l, i) => {
      console.log(`${i + 1}: [${l}]`);
    });

    const skuLineas = lineas.filter(l => l.startsWith('SKU:'));
    console.log(`\n=== LÍNEAS CON SKU (${skuLineas.length} total) ===`);
    skuLineas.slice(0, 3).forEach((l, i) => {
      console.log(`\n${i + 1}: ${l.substring(0, 100)}...`);
    });
  })
  .catch(err => {
    console.error('Error:', err);
  });
