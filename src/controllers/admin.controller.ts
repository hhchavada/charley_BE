import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const GRANTS_PATH = path.join(__dirname, '../data/grants.json');
const QUESTIONS_PATH = path.join(__dirname, '../data/questions.json');

export const getGrants = (req: Request, res: Response) => {
  try {
    const data = fs.readFileSync(GRANTS_PATH, 'utf-8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to read grants' });
  }
};

export const updateGrants = (req: Request, res: Response) => {
  try {
    const data = req.body;
    fs.writeFileSync(GRANTS_PATH, JSON.stringify(data, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update grants' });
  }
};

export const getQuestions = (req: Request, res: Response) => {
  try {
    if (!fs.existsSync(QUESTIONS_PATH)) {
      return res.json([]);
    }
    const data = fs.readFileSync(QUESTIONS_PATH, 'utf-8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to read questions' });
  }
};

export const updateQuestions = (req: Request, res: Response) => {
  try {
    const data = req.body;
    fs.writeFileSync(QUESTIONS_PATH, JSON.stringify(data, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update questions' });
  }
};
