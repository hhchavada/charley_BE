# ACRA Dataset Import Guide

This document explains how to download, configure, and import the official ACRA Information on Corporate Entities dataset into the MongoDB database for our company lookup system.

## 1. Downloading Official Datasets
1. Visit the official Singapore open data portal: [data.gov.sg](https://data.gov.sg/).
2. Search for "ACRA Information on Corporate Entities".
3. Download the dataset zip file.
4. Extract the zip file, which will contain multiple CSV files (`A.csv`, `B.csv`, ..., `Z.csv`, `Others.csv`).

## 2. Directory Configuration
Create a directory to hold the dataset. By default, the system looks for the dataset at `backend/data/acra/`.

Place all the extracted `.csv` files directly into this directory:
```
data/
└── acra/
    ├── A.csv
    ├── B.csv
    ├── ...
    └── Others.csv
```

## 3. Environment Variables
You must configure the `.env` file at the root of the `backend` folder.

Add the `ACRA_DATASET_PATH` to specify where the `.csv` files are located:
```env
ACRA_DATASET_PATH=./data/acra
```
Make sure your MongoDB connection string is correctly configured (e.g. `mongodb` or `MONGODB_URI`).

## 4. Running the Import Script
Once the `.csv` files are placed and `.env` is configured, you can start the import process by running the following command from the `backend` directory:

```bash
npm run import:acra
```

### What happens during the import:
- The script automatically detects every `.csv` file in the configured directory.
- It parses the files using streams to avoid keeping large datasets in RAM, which is ideal for systems with 2 million+ records.
- Records are inserted or updated using batch operations (`bulkWrite`), making it highly performant.
- All column values, dates, and "na" missing values are properly formatted before inserting into MongoDB.

## 5. Console Output and Metrics
As the script processes the files, it prints live progress to the terminal, such as:
```text
Importing A.csv...
Imported 1000
Imported 2000
...
Finished A.csv
```

At the end of the script, it generates a comprehensive summary:
```text
Total Imported: [Number of new records]
Total Updated: [Number of updated records]
Total Skipped: [Number of skipped empty/invalid rows]
Total Time: [Time taken in seconds]
```

## 6. Managing Monthly Updates
To perform future updates when ACRA publishes a new dataset:
1. Download the new dataset zip file from `data.gov.sg`.
2. Delete the old `.csv` files from the `data/acra` folder and replace them with the newly extracted `.csv` files.
3. Run `npm run import:acra` again. 
4. The system automatically performs an *upsert*. It will update existing records (matching by UEN) and insert any new companies that were added since the last import. No duplicates will be created.
