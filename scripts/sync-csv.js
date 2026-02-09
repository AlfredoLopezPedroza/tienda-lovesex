const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, '../base-de-datos/inventario_maestro_lovesex.csv');
const JSON_OUTPUT_PATH = path.join(__dirname, '../data/productos.json');
const IMG_BASE_PATH = path.join(__dirname, '../public/img/productos');

function slugify(text) {
    return text.toString().toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

function getCategorySlug(categoria) {
    let slug = categoria.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, '-');

    // Specific mappings for established directory names
    if (slug.includes('lubricantes') || slug.includes('cremas')) {
        return 'lubricantes-cremas';
    }
    if (slug.includes('masturbadores') || slug.includes('bombas')) {
        return 'masturbadores-bombas';
    }
    if (slug.includes('arnes') || slug.includes('fetish')) {
        return 'arnes-fetish';
    }
    if (slug.includes('retardantes')) {
        return 'retardantes-sexuales';
    }
    if (slug.includes('vigorizantes') || slug.includes('estimulantes')) {
        return 'vigorizantes-sexuales';
    }
    if (slug.includes('juguetes-anales') || slug.includes('anal')) {
        return 'juguetes-anales';
    }
    if (slug.includes('fundas') || slug.includes('anillos')) {
        return 'fundas-anillos';
    }

    return slug.replace(/-y-/g, '-');
}

function parseCSV(csvText) {
    const lines = csvText.split(/\r?\n/);
    const headers = lines[0].split(',');
    const products = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Handle CSV with quotes and commas
        const values = [];
        let current = '';
        let inQuotes = false;
        for (let char of line) {
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current);

        const sku = values[0]?.trim();
        if (!sku) continue;

        const productName = values[1]?.trim();
        const categoria = values[2]?.trim();
        const precioBase = parseFloat(values[3]) || 0;
        const precioPromo = parseFloat(values[4]);
        const descripcionComercial = values[5]?.trim() || '';
        const beneficioPrincipal = values[6]?.trim() || '';
        const fichaTecnica = values[7]?.trim() || '';

        if (!productName || !categoria) continue;

        products.push({
            sku,
            nombre: productName,
            categoria,
            precio_base: precioBase,
            precio_promo: !isNaN(precioPromo) && precioPromo < precioBase ? precioPromo : null,
            promo_activa: !isNaN(precioPromo) && precioPromo < precioBase,
            descripcion: descripcionComercial,
            beneficio: beneficioPrincipal,
            ficha: fichaTecnica,
            disponible: values[9]?.trim().toLowerCase() === 'activo'
        });
    }
    return products;
}

function mapImages(products) {
    const categories = fs.readdirSync(IMG_BASE_PATH).filter(f => fs.statSync(path.join(IMG_BASE_PATH, f)).isDirectory());

    // Create a map of all files in all category directories
    const allImages = {};
    categories.forEach(cat => {
        const catPath = path.join(IMG_BASE_PATH, cat);
        allImages[cat] = fs.readdirSync(catPath);
    });

    return products.map(p => {
        const catSlug = getCategorySlug(p.categoria);
        const catFiles = allImages[catSlug] || [];

        // Find all images starting with SKU
        // Regex to match SKU followed by optional -X and any extension
        const skuRegex = new RegExp(`^${p.sku}(?:-\\d+)?\\.(?:webp|jpg|jpeg|png)$`, 'i');

        const matchingFiles = catFiles.filter(f => skuRegex.test(f))
            .sort((a, b) => {
                // Sort by number: sku.webp first, then sku-1.webp, sku-2.webp
                const aMatch = a.match(/-(\d+)\./);
                const bMatch = b.match(/-(\d+)\./);
                if (!aMatch && !bMatch) return a.localeCompare(b);
                if (!aMatch) return -1;
                if (!bMatch) return 1;
                return parseInt(aMatch[1]) - parseInt(bMatch[1]);
            });

        const mainImage = matchingFiles.length > 0
            ? `${catSlug}/${matchingFiles[0]}`
            : 'pendiente.webp';

        const gallery = matchingFiles.map(f => `${catSlug}/${f}`);

        return {
            ...p,
            slug: `${slugify(p.nombre)}-${p.sku.toLowerCase()}`,
            imagen: mainImage,
            galeria: gallery,
            stock_nota: p.disponible ? "Disponible" : "Agotado"
        };
    });
}

function main() {
    console.log('🚀 Starting CSV Synchronization...');

    if (!fs.existsSync(CSV_PATH)) {
        console.error('❌ CSV file not found:', CSV_PATH);
        process.exit(1);
    }

    const csvText = fs.readFileSync(CSV_PATH, 'utf8');
    let products = parseCSV(csvText);
    console.log(`📊 Parsed ${products.length} products from CSV.`);

    products = mapImages(products);
    console.log('📸 Mapped images to products.');

    // Extract categories
    const categoriesSet = new Set();
    products.forEach(p => categoriesSet.add(p.categoria));

    const categories = Array.from(categoriesSet).map(c => ({
        slug: getCategorySlug(c),
        nombre: c.toUpperCase()
    }));

    const output = {
        categorias: categories,
        productos: products
    };

    fs.writeFileSync(JSON_OUTPUT_PATH, JSON.stringify(output, null, 2));
    console.log(`✅ Successfully updated ${JSON_OUTPUT_PATH}`);
}

main();
