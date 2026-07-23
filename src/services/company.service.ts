import { Company, ICompany } from '../models/Company';

export const searchCompanies = async (query: string): Promise<Partial<ICompany>[]> => {
  if (!query || query.trim().length === 0) {
    return [];
  }
  
  // Create a regex for case-insensitive search
  const regex = new RegExp(query.trim(), 'i');

  const companies = await Company.find({ entityName: regex })
    .select('uen entityName entityStatusDescription entityTypeDescription -_id')
    .sort({ entityName: 1 })
    .limit(10)
    .lean();

  return companies;
};

export const findCompanyByUEN = async (uen: string): Promise<ICompany | null> => {
  if (!uen || uen.trim().length === 0) {
    return null;
  }

  const company = await Company.findOne({ uen: uen.trim().toUpperCase() }).lean();
  return company as unknown as ICompany;
};
