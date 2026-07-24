"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const PORT = process.env.PORT || 4002;
console.log('Loading Configuration...');
console.log('Loading Questions...');
console.log('Loading Grants...');
console.log('Loading ACRA JSON...');
console.log('Startup dependencies loaded successfully.');
app_1.default.listen(PORT, () => {
    console.log(`GrantMatch AI Backend is running on http://localhost:${PORT}`);
});
