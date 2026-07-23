import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import { SystemConfig } from '../../models/v2/SystemConfig';
import { PromptTemplate } from '../../models/v2/PromptTemplate';
import { Question } from '../../models/v2/Question';
import { Rule } from '../../models/v2/Rule';
import { RuleGroup } from '../../models/v2/RuleGroup';
import { Grant } from '../../models/v2/Grant';

import { SEED_SYSTEM_CONFIGS, SEED_PROMPTS, SEED_QUESTIONS, SEED_RULES } from './data';

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/grant_matching_engine';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  try {
    // 1. Seed Configs
    for (const config of SEED_SYSTEM_CONFIGS) {
      await SystemConfig.findOneAndUpdate({ key: config.key }, { $set: config }, { upsert: true });
    }
    console.log('Seeded System Configs');

    // 2. Seed Prompts
    for (const prompt of SEED_PROMPTS) {
      await PromptTemplate.findOneAndUpdate({ templateId: prompt.templateId }, { $set: prompt }, { upsert: true });
    }
    console.log('Seeded Prompts');

    // 3. Seed Questions
    const questionIdMap = new Map<string, mongoose.Types.ObjectId>();
    for (const q of SEED_QUESTIONS) {
      const doc = await Question.findOneAndUpdate(
        { questionId: q.questionId },
        { $set: q },
        { upsert: true, new: true }
      );
      questionIdMap.set(q.questionId, doc._id as mongoose.Types.ObjectId);
    }
    console.log('Seeded Questions');

    // 4. Seed Rules
    const ruleIdMap = new Map<string, mongoose.Types.ObjectId>();
    for (const r of SEED_RULES) {
      const qMongoId = questionIdMap.get(r.questionId);
      const doc = await Rule.findOneAndUpdate(
        { ruleId: r.ruleId },
        { $set: { ...r, questionId: qMongoId } },
        { upsert: true, new: true }
      );
      ruleIdMap.set(r.ruleId, doc._id as mongoose.Types.ObjectId);
    }
    console.log('Seeded Rules');

    // 5. Seed Rule Groups
    const groupDoc = await RuleGroup.findOneAndUpdate(
      { groupId: 'rg_sme_base' },
      {
        $set: {
          groupId: 'rg_sme_base',
          logic: 'AND',
          rules: Array.from(ruleIdMap.values()),
          nestedGroups: []
        }
      },
      { upsert: true, new: true }
    );
    console.log('Seeded Rule Groups');

    // 6. Seed Grants
    await Grant.findOneAndUpdate(
      { grantId: 'g_sme_base' },
      {
        $set: {
          grantId: 'g_sme_base',
          name: 'Base SME Grant',
          description: 'Basic grant for all SMEs',
          agency: 'EnterpriseSG',
          category: 'General',
          priority: 1,
          status: 'DRAFT',
          version: 1,
          ruleGroupId: groupDoc._id
        }
      },
      { upsert: true }
    );
    console.log('Seeded Grants');

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  seed();
}
