export class CompanyProfileNormalizer {
  public normalize(payload: Record<string, any>): Record<string, any> {
    if (!payload) return {};

    const normalized = { ...payload };

    // Initialize dynamicAnswers if it doesn't exist
    if (!normalized.dynamicAnswers) {
      normalized.dynamicAnswers = {};
    }
    const dynamicAnswers = normalized.dynamicAnswers;

    // Helper to safely set a value. We unconditionally assign it because ACRA is authoritative.
    const assignAuthoritative = (key: string, value: any) => {
      if (value !== undefined && value !== null && value !== 'na') {
        dynamicAnswers[key] = value;
      }
    };

    // 1. Calculate companyAgeMonths from registration_incorporation_date
    if (payload.registration_incorporation_date && payload.registration_incorporation_date !== 'na') {
      const incDate = new Date(payload.registration_incorporation_date);
      if (!isNaN(incDate.getTime())) {
        const today = new Date();
        let months = (today.getFullYear() - incDate.getFullYear()) * 12;
        months -= incDate.getMonth();
        months += today.getMonth();
        if (months < 0) months = 0;
        assignAuthoritative('companyAgeMonths', months);
      }
    }

    // 2. entityStatus to companyActive
    if (payload.entity_status_description) {
      const status = payload.entity_status_description.toLowerCase();
      const isActive = status.includes('live') || status.includes('registered') || status.includes('active');
      assignAuthoritative('companyActive', isActive);
    }

    // 3. primary_ssic_code -> industryCode
    if (payload.primary_ssic_code) {
      assignAuthoritative('industryCode', payload.primary_ssic_code);
    }

    // 4. primary_ssic_description -> industryDescription
    if (payload.primary_ssic_description) {
      assignAuthoritative('industryDescription', payload.primary_ssic_description);
    }

    // 5. entity_type_description -> entityType
    if (payload.entity_type_description) {
      assignAuthoritative('entityType', payload.entity_type_description);
    }

    // 6. business_constitution_description -> businessConstitution
    if (payload.business_constitution_description) {
      assignAuthoritative('businessConstitution', payload.business_constitution_description);
    }

    // 7. company_type_description -> companyTypeFromAcra
    if (payload.company_type_description) {
      assignAuthoritative('companyTypeFromAcra', payload.company_type_description);
    }

    // 8. no_of_officers -> numberOfOfficers
    if (payload.no_of_officers && payload.no_of_officers !== 'na') {
      const num = Number(payload.no_of_officers);
      if (!isNaN(num)) {
        assignAuthoritative('numberOfOfficers', num);
      }
    }

    // 9. postal_code -> postalCode
    if (payload.postal_code) {
      assignAuthoritative('postalCode', payload.postal_code);
    }

    // 10. block, street, building, unit -> registeredAddress
    const addrParts: string[] = [];
    if (payload.block && payload.block !== 'na') addrParts.push(`Blk ${payload.block}`);
    if (payload.street_name && payload.street_name !== 'na') addrParts.push(payload.street_name);
    if (payload.level_no && payload.level_no !== 'na' && payload.unit_no && payload.unit_no !== 'na') {
      addrParts.push(`#${payload.level_no}-${payload.unit_no}`);
    }
    if (payload.building_name && payload.building_name !== 'na') addrParts.push(payload.building_name);
    if (payload.postal_code && payload.postal_code !== 'na') addrParts.push(`Singapore ${payload.postal_code}`);

    if (addrParts.length > 0) {
      assignAuthoritative('registeredAddress', addrParts.join(', '));
    }

    // 11. Determine eligibleSector for EEG based on SSIC
    if (payload.primary_ssic_code && payload.primary_ssic_code !== 'na') {
      const ssic = payload.primary_ssic_code;
      let isEligibleSector = false;
      if (ssic.startsWith('56') || ssic.startsWith('47')) {
        isEligibleSector = true;
      } else {
        const ssicNum = parseInt(ssic.substring(0, 2), 10);
        if (ssicNum >= 10 && ssicNum <= 32) {
          isEligibleSector = true;
        }
      }
      assignAuthoritative('eligibleSector', isEligibleSector);
    }

    normalized.dynamicAnswers = dynamicAnswers;
    return normalized;
  }
}
