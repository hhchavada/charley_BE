import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 4002;

console.log('Loading Configuration...');
console.log('Loading Questions...');
console.log('Loading Grants...');
console.log('Loading ACRA JSON...');
console.log('Startup dependencies loaded successfully.');

app.listen(PORT, () => {
  console.log(`GrantMatch AI Backend is running on http://localhost:${PORT}`);
});
