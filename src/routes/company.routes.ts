import { Router } from 'express';
import { searchCompanies, findCompanyByUEN } from '../services/company.service';
import { buildCompanyAddress } from '../utils/companyAddress';

const router = Router();

router.get('/company/search', async (req, res) => {
  try {
    const q = req.query.q as string;
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    if (q.length > 100) {
      return res.status(400).json({ error: 'Search query is too long' });
    }

    const companies = await searchCompanies(q);
    
    // Format output as requested
    const results = companies.map(c => ({
      uen: c.uen,
      entityName: c.entityName,
      entityType: c.entityTypeDescription,
      status: c.entityStatusDescription
    }));

    return res.json(results);
  } catch (error) {
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

    const company = await findCompanyByUEN(uen);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const address = buildCompanyAddress(company);

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
  } catch (error) {
    console.error('Error retrieving company by UEN:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
