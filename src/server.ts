import app from './app';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 4002;
const MONGODB_URI = process.env.mongodb || process.env.MONGODB_URI;

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB successfully'))
    .catch(() => console.warn('⚠️ MongoDB connection failed (Database not running locally). Application will continue without DB.'));
} else {
  console.warn('WARNING: No MongoDB URI found in environment variables.');
}

app.listen(PORT, () => {
  console.log(`GrantMatch AI Backend is running on http://localhost:${PORT}`);
});
