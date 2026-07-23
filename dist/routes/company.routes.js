"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const company_service_1 = require("../services/company.service");
const companyAddress_1 = require("../utils/companyAddress");
const router = (0, express_1.Router)();
router.get('/company/search', async (req, res) => {
    try {
        const q = req.query.q;
        if (!q || q.trim().length === 0) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        if (q.length > 100) {
            return res.status(400).json({ error: 'Search query is too long' });
        }
        const companies = await (0, company_service_1.searchCompanies)(q);
        // Format output as requested
        const results = companies.map(c => ({
            uen: c.uen,
            entityName: c.entityName,
            entityType: c.entityTypeDescription,
            status: c.entityStatusDescription
        }));
        return res.json(results);
    }
    catch (error) {
        console.error('Error searching companies:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/company/:uen', async (req, res) => {
    try {
        const { uen } = req.params;
        if (!uen || uen.trim().length === 0) {
            return res.status(400).json({ error: 'UEN is required' });
        }
        const company = await (0, company_service_1.findCompanyByUEN)(uen);
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }
        const address = (0, companyAddress_1.buildCompanyAddress)(company);
        const result = {
            uen: company.uen,
            entityName: company.entityName,
            entityType: company.entityTypeDescription,
            status: company.entityStatusDescription,
            industry: company.primarySsicDescription,
            registrationDate: company.registrationIncorporationDate,
            address
        };
        return res.json(result);
    }
    catch (error) {
        console.error('Error retrieving company by UEN:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
