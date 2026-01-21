const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Paths
const EXCEL_PATH = path.resolve('UAT Demo 8.xlsx');
const IMAGES_DIR = path.resolve('LLL (22112025)');
const OUTPUT_DIR = path.resolve('Sorted_Images');

console.log(`Reading Excel: ${EXCEL_PATH}`);

if (!fs.existsSync(EXCEL_PATH)) {
    console.error('Excel file not found!');
    process.exit(1);
}

// Read Excel
const workbook = XLSX.readFile(EXCEL_PATH);
console.log('Sheet Names:', workbook.SheetNames);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

// Build Map: Prefix (Col B) -> Barcode (Col A)
// Assuming output of sheet_to_json with header:1 is an array of arrays: [[A1, B1], [A2, B2], ...]
// We need to skip header row if it exists. Let's inspect the first few rows.
console.log('First 3 rows of data:', data.slice(0, 3));

const prefixMap = new Map();
// Simple heuristic: Iterate all rows.
// Be careful about header. If Row 0 is "Barcode", "Identifier", etc.
for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;

    const barcode = String(row[0]).trim();
    const prefix = String(row[1]).trim();

    // Skip likely headers
    if (barcode.toLowerCase().includes('barcode') || prefix.toLowerCase().includes('identifier')) continue;

    if (prefix && barcode) {
        prefixMap.set(prefix, barcode);
    }
}

console.log(`Loaded ${prefixMap.size} mappings.`);

// Prepare Output Dir
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}

// Process Images
if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`Images directory not found: ${IMAGES_DIR}`);
    process.exit(1);
}

const files = fs.readdirSync(IMAGES_DIR);
let movedCount = 0;
let noMatchCount = 0;

console.log(`Found ${files.length} files in images directory.`);


fs.writeFileSync('debug_keys.txt', Array.from(prefixMap.keys()).join('\n'));
fs.writeFileSync('debug_files.txt', files.join('\n'));
console.log('Dumped debug_keys.txt and debug_files.txt');

files.forEach(file => {
    // Basic filter for images
    if (!pluginMatches(file)) return;

    let matched = false;
    for (const [prefix, barcode] of prefixMap.entries()) {
        // Debug one specific likely match if possible, or just exact check
        // console.log(`Checking ${file} against ${prefix}`); 
        if (file.startsWith(prefix)) {
            // Match found!
            const targetFolder = path.join(OUTPUT_DIR, barcode);

            if (!fs.existsSync(targetFolder)) {
                fs.mkdirSync(targetFolder, { recursive: true });
            }

            const srcPath = path.join(IMAGES_DIR, file);
            const destPath = path.join(targetFolder, file);

            // ACTION: Move (Rename) or Copy. 
            // The user said "folder up", usually implies moving.
            // Using Copy for safety during test.
            try {
                fs.copyFileSync(srcPath, destPath);
                // console.log(`Copied ${file} -> ${barcode}/`);
                movedCount++;
            } catch (err) {
                console.error(`Error moving ${file}:`, err);
            }

            matched = true;
            break; // Stop checking other prefixes for this file
        }
    }

    if (!matched) {
        // console.log(`No match for: ${file}`);
        noMatchCount++;
    }
});

function pluginMatches(filename) {
    const ext = path.extname(filename).toLowerCase();
    return ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tif', '.tiff'].includes(ext);
}

console.log('------------------------------------------------');
console.log(`Processing Complete.`);
console.log(`Moved/Copied: ${movedCount}`);
console.log(`No Match:     ${noMatchCount}`);
console.log(`Check folders in: ${OUTPUT_DIR}`);
