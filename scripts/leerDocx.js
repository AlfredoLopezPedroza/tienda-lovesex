const mammoth = require('mammoth');
const fs = require('fs');

// Leer el DOCX
mammoth.extractRawText({path: './data/source/TODAS_LAS_CATEGORIAS.docx'})
  .then(result => {
    const text = result.value;
    console.log(text);
  })
  .catch(err => {
    console.error('Error leyendo DOCX:', err);
  });
