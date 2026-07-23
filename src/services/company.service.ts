import { Company, ICompany } from '../models/Company';

export const searchCompanies = async (query: string): Promise<Partial<ICompany>[]> => {
  if (!query || query.trim().length === 0) {
    return [];
  }
  
  // DB is not needed right now, returning empty array to avoid MongoDB timeout error
  return [];

  /* Original DB Logic
  const regex = new RegExp(query.trim(), 'i');
  const companies = await Company.find({ entityName: regex })
    .select('uen entityName entityStatusDescription entityTypeDescription -_id')
    .sort({ entityName: 1 })
    .limit(10)
    .lean();
  return companies;
  */
};

export const findCompanyByUEN = async (uen: string): Promise<ICompany | null> => {
  if (!uen || uen.trim().length === 0) {
    return null;
  }

  // DB is not needed right now, returning null to avoid MongoDB timeout error
  return null;

  /* Original DB Logic
  const company = await Company.findOne({ uen: uen.trim().toUpperCase() }).lean();
  return company as unknown as ICompany;
  */
};
