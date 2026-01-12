const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, 'data', 'productos.json');
const IMG_PROD_PATH = path.join(__dirname, 'public', 'img', 'productos');

const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

// Mappings for categories to folder names
const categoryToFolder = {
  'Anillos Fundas': 'anillos-fundas',
    'Arnes Fetish': 'arnes-fetish',
    'Cremas Lubricantes': 'cremas-lubricantes',
    'Dildos': 'dildos',
    'Juguetes Anales': 'juguetes-anales',
    'Masturbadores Bombas': 'masturbadores-bombas',
    'Retardantes': 'retardantes',
    'Vibradores': 'vibradores',
    'Vigorizantes Sexuales': 'vigorizantes-sexuales',
    // Fallbacks
    'LUBRICANTES': 'cremas-lubricantes',
    'ARNÉS Y FETISH': 'arnes-fetish',
    'MASTURBADORES': 'masturbadores-bombas',
    'ESTIMULANTES': 'vigorizantes-sexuales'
};

let updatedCount = 0;
let missedCount = 0;

data.productos.forEach(producto => {
    const sku = producto.sku.toLowerCase();
    const folder = categoryToFolder[producto.categoria] || producto.categoria.toLowerCase().replace(/ /g, '-');
    const fileName = `${sku}.webp`;
    const fullPath = path.join(IMG_PROD_PATH, folder, fileName);

    if (fs.existsSync(fullPath)) {
        producto.imagen = `${folder}/${fileName}`;
        updatedCount++;
    } else {
        // Broad search in case it's in a different folder
        let found = false;
        const subfolders = fs.readdirSync(IMG_PROD_PATH);
        for (const sub of subfolders) {
            if (fs.statSync(path.join(IMG_PROD_PATH, sub)).isDirectory()) {
                if (fs.existsSync(path.join(IMG_PROD_PATH, sub, fileName))) {
                    producto.imagen = `${sub}/${fileName}`;
                    updatedCount++;
                    found = true;
                    break;
                }
            }
        }
        if (!found) {
            missedCount++;
        }
    }
});

fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2));

console.log(`--- PRODUCTOS ACTUALIZADOS ---`);
console.log(`Actualizados: ${updatedCount}`);
console.log(`Sin imagen (pendientes): ${missedCount}`);
