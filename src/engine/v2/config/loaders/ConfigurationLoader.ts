import { ConfigurationBundle, QuestionFlowGraph } from '../interfaces';
import { GraphBuilder } from '../services/GraphBuilder';
import { GrantRepository } from '../repositories/GrantRepository';
import { RuleGroupRepository } from '../repositories/RuleGroupRepository';
import { RuleRepository } from '../repositories/RuleRepository';
import { QuestionRepository } from '../repositories/QuestionRepository';
import { PromptRepository } from '../repositories/PromptRepository';
import { ConfigRepository } from '../repositories/ConfigRepository';
import { PromptDTO, SystemConfigDTO, QuestionFlowDTO, QuestionDTO } from '../dto';
// Note: QuestionFlowRepository not explicitly defined yet, but assuming it would exist
// We will stub its call for now since we only made QuestionRepository earlier.

export class ConfigurationLoader {
  static async loadActiveConfiguration(): Promise<ConfigurationBundle> {
    // 1. Fetch raw data from Repositories
    const [grants, ruleGroups, rules, questions, prompts, configs] = await Promise.all([
      GrantRepository.findAllActive(),
      RuleGroupRepository.findAll(),
      RuleRepository.findAll(),
      QuestionRepository.findAll(),
      PromptRepository.findAll(),
      ConfigRepository.findAll(),
    ]);

    // 2. Build the Grant Graph
    const grantGraphs = GraphBuilder.build(grants, ruleGroups, rules, questions);

    // 3. Build QuestionFlow Graph (stub since repo isn't made in this exact step, but logic is here)
    const questionFlows: QuestionFlowGraph[] = []; 
    // In reality, we would fetch flows and map questions.

    // 4. Map Prompts & Configs
    const promptTemplates = prompts.reduce((acc, p) => {
      acc[p.templateId] = p;
      return acc;
    }, {} as Record<string, PromptDTO>);

    const systemConfigs = configs.reduce((acc, c) => {
      acc[c.key] = c;
      return acc;
    }, {} as Record<string, SystemConfigDTO>);

    return {
      grants: grantGraphs,
      questionFlows,
      promptTemplates,
      systemConfigs,
    };
  }
}
