import mongoose, { Schema, Document } from 'mongoose';

export interface ICompany extends Document {
  uen: string;
  entityName: string | null;
  issuanceAgency: string | null;
  entityTypeDescription: string | null;
  businessConstitutionDescription: string | null;
  companyTypeDescription: string | null;
  entityStatusDescription: string | null;
  registrationIncorporationDate: Date | null;
  uenIssueDate: Date | null;
  addressType: string | null;
  block: string | null;
  streetName: string | null;
  levelNo: string | null;
  unitNo: string | null;
  buildingName: string | null;
  postalCode: string | null;
  primarySsicCode: string | null;
  primarySsicDescription: string | null;
  primaryUserDescribedActivity: string | null;
  secondarySsicCode: string | null;
  secondarySsicDescription: string | null;
  secondaryUserDescribedActivity: string | null;
  numberOfOfficers: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema: Schema = new Schema(
  {
    uen: { type: String, required: true, unique: true },
    entityName: { type: String, default: null },
    issuanceAgency: { type: String, default: null },
    entityTypeDescription: { type: String, default: null },
    businessConstitutionDescription: { type: String, default: null },
    companyTypeDescription: { type: String, default: null },
    entityStatusDescription: { type: String, default: null },
    registrationIncorporationDate: { type: Date, default: null },
    uenIssueDate: { type: Date, default: null },
    addressType: { type: String, default: null },
    block: { type: String, default: null },
    streetName: { type: String, default: null },
    levelNo: { type: String, default: null },
    unitNo: { type: String, default: null },
    buildingName: { type: String, default: null },
    postalCode: { type: String, default: null },
    primarySsicCode: { type: String, default: null },
    primarySsicDescription: { type: String, default: null },
    primaryUserDescribedActivity: { type: String, default: null },
    secondarySsicCode: { type: String, default: null },
    secondarySsicDescription: { type: String, default: null },
    secondaryUserDescribedActivity: { type: String, default: null },
    numberOfOfficers: { type: Number, default: null },
  },
  {
    timestamps: true,
  }
);

// Regular indexes
CompanySchema.index({ entityName: 1 });
CompanySchema.index({ primarySsicCode: 1 });
CompanySchema.index({ entityStatusDescription: 1 });

// Text index for search
CompanySchema.index(
  {
    entityName: 'text',
    primarySsicDescription: 'text',
  },
  {
    weights: {
      entityName: 10,
      primarySsicDescription: 5,
    },
    name: 'TextSearchIndex',
  }
);

export const Company = mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);
