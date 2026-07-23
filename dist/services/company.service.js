"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findCompanyByUEN = exports.searchCompanies = void 0;
const Company_1 = require("../models/Company");
const searchCompanies = async (query) => {
    if (!query || query.trim().length === 0) {
        return [];
    }
    // Create a regex for case-insensitive search
    const regex = new RegExp(query.trim(), 'i');
    const companies = await Company_1.Company.find({ entityName: regex })
        .select('uen entityName entityStatusDescription entityTypeDescription -_id')
        .sort({ entityName: 1 })
        .limit(10)
        .lean();
    return companies;
};
exports.searchCompanies = searchCompanies;
const findCompanyByUEN = async (uen) => {
    if (!uen || uen.trim().length === 0) {
        return null;
    }
    const company = await Company_1.Company.findOne({ uen: uen.trim().toUpperCase() }).lean();
    return company;
};
exports.findCompanyByUEN = findCompanyByUEN;
