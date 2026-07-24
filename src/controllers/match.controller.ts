import { Request, Response } from 'express';
import { GrantMatchingEngine } from '../engine/GrantMatchingEngine';
import { ValidationEngine } from '../engine/ValidationEngine';
import { ResultBuilder } from '../engine/ResultBuilder';
import { CompanyData } from '../types';
import fs from 'fs';
import path from 'path';

export const matchGrants = (req: Request, res: Response) => {
  try {
    const companyData: CompanyData = req.body;
    
    if (!companyData) {
      return res.status(400).json({ error: 'Company data is required' });
    }

    // Validation Phase
    const paths = [
      path.join(__dirname, '../data/questions.json'),
      path.join(__dirname, '../../src/data/questions.json'),
      path.join(process.cwd(), 'src/data/questions.json')
    ];
    let questionsFilePath = paths[0];
    for (const p of paths) {
      if (fs.existsSync(p)) {
        questionsFilePath = p;
        break;
      }
    }
    const questionsData = JSON.parse(fs.readFileSync(questionsFilePath, 'utf-8'));
    
    const validationResult = ValidationEngine.validate(companyData, questionsData);
    if (!validationResult.isValid) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationResult.errors 
      });
    }

    // Matching Phase
    const engine = new GrantMatchingEngine();
    const results = engine.match(companyData);

    const finalResponse = ResultBuilder.buildFinalResponse(results);

    return res.json(finalResponse);
  } catch (error: any) {
    console.error('Error matching grants:', error);
    return res.status(500).json({ error: 'Internal server error during grant matching' });
  }
};
