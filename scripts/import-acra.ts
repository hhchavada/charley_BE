import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Company, ICompany } from '../src/models/Company';

dotenv.config();

const parseDate = (val: string): Date | null => {
  if (!val || val.toLowerCase() === 'na') return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

const parseNum = (val: string): number | null => {
  if (!val || val.toLowerCase() === 'na') return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
};

const parseStr = (val: string): string | null => {
  if (!val || val.toLowerCase() === 'na') return null;
  return val.trim() === '' ? null : val.trim();
};

const importCsvFile = async (filePath: string): Promise<{ imported: number, updated: number, skipped: number }> => {
  return new Promise((resolve, reject) => {
    let batch: any[] = [];
    let stats = { imported: 0, updated: 0, skipped: 0 };
    let processed = 0;
    
    const stream = fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Skip completely empty rows
        if (Object.values(row).every(v => !(v as string).trim())) {
          stats.skipped++;
          return;
        }

        const uen = parseStr(row['uen'] || row['UEN']);
        if (!uen) {
          stats.skipped++;
          return;
        }

        const doc = {
          uen,
          entityName: parseStr(row['entity_name'] || row['entityName']),
          issuanceAgency: parseStr(row['issuance_agency_id'] || row['issuanceAgency']),
          entityTypeDescription: parseStr(row['entity_type_description'] || row['entityTypeDescription']),
          businessConstitutionDescription: parseStr(row['business_constitution_description'] || row['businessConstitutionDescription']),
          companyTypeDescription: parseStr(row['company_type_description'] || row['companyTypeDescription']),
          entityStatusDescription: parseStr(row['entity_status_description'] || row['entityStatusDescription']),
          registrationIncorporationDate: parseDate(row['registration_incorporation_date'] || row['registrationIncorporationDate']),
          uenIssueDate: parseDate(row['uen_issue_date'] || row['uenIssueDate']),
          addressType: parseStr(row['address_type'] || row['addressType']),
          block: parseStr(row['block']),
          streetName: parseStr(row['street_name'] || row['streetName']),
          levelNo: parseStr(row['level_no'] || row['levelNo']),
          unitNo: parseStr(row['unit_no'] || row['unitNo']),
          buildingName: parseStr(row['building_name'] || row['buildingName']),
          postalCode: parseStr(row['postal_code'] || row['postalCode']),
          primarySsicCode: parseStr(row['primary_ssic_code'] || row['primarySsicCode']),
          primarySsicDescription: parseStr(row['primary_ssic_description'] || row['primarySsicDescription']),
          primaryUserDescribedActivity: parseStr(row['primary_user_described_activity'] || row['primaryUserDescribedActivity']),
          secondarySsicCode: parseStr(row['secondary_ssic_code'] || row['secondarySsicCode']),
          secondarySsicDescription: parseStr(row['secondary_ssic_description'] || row['secondarySsicDescription']),
          secondaryUserDescribedActivity: parseStr(row['secondary_user_described_activity'] || row['secondaryUserDescribedActivity']),
          numberOfOfficers: parseNum(row['no_of_officers'] || row['numberOfOfficers'])
        };

        batch.push({
          updateOne: {
            filter: { uen: doc.uen },
            update: { $set: doc },
            upsert: true
          }
        });

        if (batch.length >= 1000) {
          stream.pause();
          Company.bulkWrite(batch).then((res) => {
            stats.imported += res.upsertedCount;
            stats.updated += res.modifiedCount;
            processed += batch.length;
            console.log(`Imported ${processed}`);
            batch = [];
            stream.resume();
          }).catch(reject);
        }
      })
      .on('end', async () => {
        if (batch.length > 0) {
          try {
            const res = await Company.bulkWrite(batch);
            stats.imported += res.upsertedCount;
            stats.updated += res.modifiedCount;
            processed += batch.length;
            console.log(`Imported ${processed}`);
          } catch (err) {
            reject(err);
            return;
          }
        }
        resolve(stats);
      })
      .on('error', reject);
  });
};

const run = async () => {
  const startTime = Date.now();
  const dbUri = process.env.mongodb || process.env.MONGODB_URI || 'mongodb://localhost:27017/nova';
  
  try {
    // Workaround for Windows DNS SRV record resolution issues
    require('dns').setServers(['8.8.8.8', '8.8.4.4']);
    await mongoose.connect(dbUri, { serverSelectionTimeoutMS: 10000 });
    console.log('Connected to MongoDB');

    const dataPath = process.env.ACRA_DATASET_PATH || path.join(__dirname, '../data/acra');
    if (!fs.existsSync(dataPath)) {
      console.warn(`Warning: Data path not found: ${dataPath}`);
      process.exit(0);
    }

    const files = fs.readdirSync(dataPath).filter(f => f.toLowerCase().endsWith('.csv'));
    
    let totalImported = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    for (const file of files) {
      console.log(`Importing ${file}...`);
      const filePath = path.join(dataPath, file);
      const stats = await importCsvFile(filePath);
      totalImported += stats.imported;
      totalUpdated += stats.updated;
      totalSkipped += stats.skipped;
      console.log(`Finished ${file}`);
    }

    console.log('Finished All Files');
    console.log('');
    console.log(`Total Imported: ${totalImported}`);
    console.log(`Total Updated: ${totalUpdated}`);
    console.log(`Total Skipped: ${totalSkipped}`);
    const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Total Time: ${timeTaken}s`);

  } catch (error) {
    console.error('Error during import:', error);
  } finally {
    await mongoose.disconnect();
  }
};

run();
