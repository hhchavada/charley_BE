import { ICompany } from '../models/Company';

export const buildCompanyAddress = (company: Partial<ICompany>): string => {
  const lines: string[] = [];

  // Line 1: block and streetName
  const blockStreet = [company.block, company.streetName].filter(Boolean).join(' ');
  if (blockStreet) {
    lines.push(blockStreet);
  }

  // Line 2: Level and Unit
  if (company.levelNo && company.unitNo) {
    lines.push(`#${company.levelNo}-${company.unitNo}`);
  } else if (company.levelNo) {
    lines.push(`#${company.levelNo}`);
  } else if (company.unitNo) {
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
