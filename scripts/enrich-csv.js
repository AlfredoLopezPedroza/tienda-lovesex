const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, '../base-de-datos/inventario_maestro_lovesex.csv');
const LOG_PATH = path.join(__dirname, '../log_enriquecimiento.md');
const EXTRACTED_PATH = path.join(__dirname, '../base-de-datos/extracted_content.txt');

function parseLog() {
    const content = fs.readFileSync(LOG_PATH, 'utf8');
    const descriptions = {};
    // Extract SKU and Estado Actual from the markdown table
    // Format: | SKU | Estado Anterior | Estado Actual |
    const lines = content.split('\n');
    for (const line of lines) {
        if (line.startsWith('|') && !line.includes('SKU | Estado')) {
            const parts = line.split('|').map(p => p.trim());
            if (parts.length >= 4) {
                const sku = parts[1].toUpperCase();
                const desc = parts[3];
                if (sku && desc) {
                    descriptions[sku] = desc;
                    // Also store variant with 'DP-' if it's 'DL-'
                    if (sku.startsWith('DL-')) {
                        descriptions[sku.replace('DL-', 'DP-')] = desc;
                    }
                }
            }
        }
    }
    return descriptions;
}

function parseExtracted() {
    const content = fs.readFileSync(EXTRACTED_PATH, 'utf8');
    const techData = {};
    // Extract SKU and DESCRIPCION from extracted_content.txt
    // Format: SKU: XXX NAME: YYY ... DESCRIPCION: ZZZ PRECIO: ...
    const lines = content.split('\n');
    for (const line of lines) {
        const skuMatch = line.match(/SKU:\s*([^\s]+)/i);
        const descMatch = line.match(/DESCRIPCION:\s*(.*?)PRECIO:/i);
        if (skuMatch && descMatch) {
            const sku = skuMatch[1].trim().toUpperCase();
            const tech = descMatch[1].trim();
            techData[sku] = tech;
            if (sku.startsWith('DL-')) {
                techData[sku.replace('DL-', 'DP-')] = tech;
            } else if (sku.startsWith('DP-')) {
                techData[sku.replace('DP-', 'DL-')] = tech;
            }
        }
    }
    return techData;
}

function main() {
    console.log('🔍 Starting Enrichment Process...');
    const logDescriptions = parseLog();
    const techDataMap = parseExtracted();

    console.log(`📦 Loaded ${Object.keys(logDescriptions).length} descriptions from log.`);
    console.log(`🛠️ Loaded ${Object.keys(techDataMap).length} tech specs from extracted content.`);

    const csvText = fs.readFileSync(CSV_PATH, 'utf8');
    const lines = csvText.split(/\r?\n/);
    const updatedLines = [];

    // Keep header
    updatedLines.push(lines[0]);

    let updatedCount = 0;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) {
            updatedLines.push(line);
            continue;
        }

        // Parse CSV line (handle quotes)
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

        const sku = values[0]?.trim().toUpperCase();
        if (sku) {
            let modified = false;

            // 1. Update Descripcion comercial (Column 5 index)
            const newDesc = logDescriptions[sku];
            if (newDesc) {
                values[5] = newDesc;
                modified = true;
            }

            // 2. Update Ficha tecnica (Column 7 index)
            const newTech = techDataMap[sku];
            if (newTech) {
                values[7] = newTech;
                modified = true;
            }

            if (modified) {
                updatedCount++;
                // Re-assemble line with quotes where necessary
                const escapedValues = values.map(v => {
                    const str = v.toString();
                    if (str.includes(',') || str.includes('"')) {
                        return `"${str.replace(/"/g, '""')}"`;
                    }
                    return str;
                });
                updatedLines.push(escapedValues.join(','));
                continue;
            }
        }
        updatedLines.push(line);
    }

    fs.writeFileSync(CSV_PATH, updatedLines.join('\n'));
    console.log(`✅ Enrichment complete! Updated ${updatedCount} products in CSV.`);
}

main();
