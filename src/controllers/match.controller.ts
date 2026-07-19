import { Request, Response } from 'express';
import { GrantMatchingEngine } from '../engine/GrantMatchingEngine';
import { CompanyData, MatchResult } from '../types';

export const matchGrants = (req: Request, res: Response) => {
  try {
    const companyData: CompanyData = req.body;
    
    if (!companyData) {
      return res.status(400).json({ error: 'Company data is required' });
    }

    const engine = new GrantMatchingEngine();
    const results = engine.match(companyData);

    const eligible = results.filter(r => r.status === 'Qualified');
    const needMoreInfo = results.filter(r => r.status === 'Needs More Information');
    const notEligible = results.filter(r => r.status === 'Not Qualified');

    return res.json({
      eligible,
      needMoreInfo,
      notEligible
    });
  } catch (error: any) {
    console.error('Error matching grants:', error);
    return res.status(500).json({ error: 'Internal server error during grant matching' });
  }
};
