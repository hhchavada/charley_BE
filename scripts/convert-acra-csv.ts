import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';

const CSV_DIR = path.join(__dirname, '../../ACRAInformationonCorporateEntities');
const OUTPUT_FILE = path.join(__dirname, '../src/data/acra/corporate-entities.json');

async function processFiles() {
  const files = fs.readdirSync(CSV_DIR).filter(f => f.endsWith('.csv'));
  
  const entitiesMap = new Map<string, any>();
  let totalRows = 0;
  let duplicatesRemoved = 0;
  const discoveredColumns = new Set<string>();

  for (const file of files) {
    console.log(`Processing ${file}...`);
    const filePath = path.join(CSV_DIR, file);
    
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('headers', (headers) => {
          headers.forEach((h: string) => discoveredColumns.add(h.trim()));
        })
        .on('data', (row) => {
          totalRows++;
          
          // Trim whitespace for all fields
          const cleanedRow: any = {};
          for (const key in row) {
            cleanedRow[key.trim()] = (row[key] || '').trim();
          }

          const uen = cleanedRow['uen'];
          if (entitiesMap.has(uen)) {
            duplicatesRemoved++;
          } else {
            entitiesMap.set(uen, cleanedRow);
          }
        })
        .on('end', () => {
          resolve();
        })
        .on('error', reject);
    });
  }

  console.log(`Finished reading. Converting to array and sorting...`);
  
  const entitiesArray = Array.from(entitiesMap.values());
  entitiesArray.sort((a, b) => {
    const nameA = (a.entity_name || '').toLowerCase();
    const nameB = (b.entity_name || '').toLowerCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });

  console.log(`Writing to JSON file...`);
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  
  // Streaming write to avoid JSON.stringify memory limits on large arrays
  const writeStream = fs.createWriteStream(OUTPUT_FILE, { encoding: 'utf8' });
  writeStream.write('[\n');
  
  for (let i = 0; i < entitiesArray.length; i++) {
    const jsonStr = JSON.stringify(entitiesArray[i]);
    writeStream.write(`  ${jsonStr}${i < entitiesArray.length - 1 ? ',' : ''}\n`);
    
    if (i % 100000 === 0) {
      console.log(`Written ${i} records...`);
    }
  }
  
  writeStream.write(']\n');
  writeStream.end();

  await new Promise((resolve) => writeStream.on('finish', resolve));

  console.log(`\n--- Conversion Report ---`);
  console.log(`Total CSV files processed: ${files.length}`);
  console.log(`Total rows read: ${totalRows}`);
  console.log(`Duplicate rows removed: ${duplicatesRemoved}`);
  console.log(`Final company count: ${entitiesArray.length}`);
  console.log(`Discovered columns: ${Array.from(discoveredColumns).join(', ')}`);
}

processFiles().catch(err => {
  console.error("Error processing files:", err);
  process.exit(1);
});
