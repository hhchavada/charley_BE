"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCompanyAddress = void 0;
const buildCompanyAddress = (company) => {
    const lines = [];
    // Line 1: block and streetName
    const blockStreet = [company.block, company.streetName].filter(Boolean).join(' ');
    if (blockStreet) {
        lines.push(blockStreet);
    }
    // Line 2: Level and Unit
    if (company.levelNo && company.unitNo) {
        lines.push(`#${company.levelNo}-${company.unitNo}`);
    }
    else if (company.levelNo) {
        lines.push(`#${company.levelNo}`);
    }
    else if (company.unitNo) {
        lines.push(`#${company.unitNo}`);
    }
    // Line 3: Building Name
    if (company.buildingName) {
        lines.push(company.buildingName);
    }
    // Line 4: Postal Code
    if (company.postalCode) {
        lines.push(`Singapore ${company.postalCode}`);
    }
    return lines.join('\n');
};
exports.buildCompanyAddress = buildCompanyAddress;
