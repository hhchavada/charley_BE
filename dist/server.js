"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const PORT = process.env.PORT || 4002;
const MONGODB_URI = process.env.mongodb || process.env.MONGODB_URI;
if (MONGODB_URI) {
    mongoose_1.default.connect(MONGODB_URI)
        .then(() => console.log('Connected to MongoDB successfully'))
        .catch((err) => console.error('MongoDB connection error:', err));
}
else {
    console.warn('WARNING: No MongoDB URI found in environment variables.');
}
app_1.default.listen(PORT, () => {
    console.log(`GrantMatch AI Backend is running on http://localhost:${PORT}`);
});
