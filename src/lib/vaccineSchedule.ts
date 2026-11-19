import { VaccineRecord } from './types';

export interface VaccineMasterDefinition {
  name: string;
  code: string;
  targetDiseases: string;
  category: 'government' | 'private';
  ageDueWeeks: number;
  ageDueDisplay: string;
  isPainlessDefault?: boolean;
  suggestedBrands?: string[];
  approxCostInr?: number;
  notes?: string;
  isWestBengalUip?: boolean; // 100% free under West Bengal Swasthya Bhawan UIP
}

/**
 * Clean, non-overlapping vaccine schedule:
 * 1. GOVERNMENT: All vaccines provided 100% FREE by West Bengal Government (UIP)
 * 2. PRIVATE: ONLY vaccines NOT provided by the government, which parents must buy out-of-pocket
 */
export const MASTER_VACCINE_SCHEDULE: VaccineMasterDefinition[] = [
  // =========================================================================
  // 1. WEST BENGAL GOVERNMENT FREE UIP SCHEDULE (100% Free at Health Centres)
  // =========================================================================

  // --- AT BIRTH ---
  {
    name: "BCG (Bacillus Calmette–Guérin)",
    code: "BCG",
    targetDiseases: "Tuberculosis (TB & Tubercular Meningitis)",
    category: "government",
    ageDueWeeks: 0,
    ageDueDisplay: "At Birth",
    isWestBengalUip: true,
    suggestedBrands: ["Govt Free Supply (Serum Institute BCG)"],
    approxCostInr: 0,
    notes: "Given on left upper arm at birth. Leaves a permanent scar confirming immunity."
  },
  {
    name: "OPV 0 (Oral Polio - Birth Dose)",
    code: "OPV-0",
    targetDiseases: "Poliomyelitis (Infantile Paralysis)",
    category: "government",
    ageDueWeeks: 0,
    ageDueDisplay: "At Birth",
    isWestBengalUip: true,
    suggestedBrands: ["Govt Bivalent OPV Drops"],
    approxCostInr: 0,
    notes: "2 oral drops administered within the first 14 days of life."
  },
  {
    name: "Hepatitis B (Birth Dose)",
    code: "HepB-0",
    targetDiseases: "Hepatitis B Virus (Liver Infection)",
    category: "government",
    ageDueWeeks: 0,
    ageDueDisplay: "At Birth",
    isWestBengalUip: true,
    suggestedBrands: ["Govt Supply (GeneVac-B / Engerix-B)"],
    approxCostInr: 0,
    notes: "Intramuscular injection in thigh within 24 hours of birth to prevent mother-to-child transmission."
  },

  // --- 6 WEEKS ---
  {
    name: "Pentavalent 1 (DPT + Hep B + Hib)",
    code: "PENTA-1",
    targetDiseases: "Diphtheria, Pertussis, Tetanus, Hepatitis B, Hib (Meningitis/Pneumonia)",
    category: "government",
    ageDueWeeks: 6,
    ageDueDisplay: "6 Weeks",
    isWestBengalUip: true,
    isPainlessDefault: false,
    suggestedBrands: ["Govt Supply (Easyfive / ComBEFive)"],
    approxCostInr: 0,
    notes: "Provided free at all WB Swasthya Kendras. Standard whole-cell (DTwP) combo. (Note: Parents who prefer painless acellular DTaP combo like Hexaxim can optionally choose private clinic purchase ~₹3,800)."
  },
  {
    name: "OPV 1 (Oral Polio Dose 1)",
    code: "OPV-1",
    targetDiseases: "Poliomyelitis",
    category: "government",
    ageDueWeeks: 6,
    ageDueDisplay: "6 Weeks",
    isWestBengalUip: true,
    suggestedBrands: ["Govt Bivalent OPV"],
    approxCostInr: 0,
    notes: "Oral drops given alongside Pentavalent 1."
  },
  {
    name: "fIPV 1 (fractional Inactivated Polio 1)",
    code: "fIPV-1",
    targetDiseases: "Poliomyelitis (Injectable Protection)",
    category: "government",
    ageDueWeeks: 6,
    ageDueDisplay: "6 Weeks",
    isWestBengalUip: true,
    suggestedBrands: ["Govt Supply fIPV"],
    approxCostInr: 0,
    notes: "Given intradermally on right upper arm for robust systemic polio immunity."
  },
  {
    name: "Rotavirus Dose 1 (RVV 1)",
    code: "ROTA-1",
    targetDiseases: "Rotavirus Severe Dehydrating Diarrhea",
    category: "government",
    ageDueWeeks: 6,
    ageDueDisplay: "6 Weeks",
    isWestBengalUip: true,
    suggestedBrands: ["Govt Supply (Rotasiil / Rotavac)"],
    approxCostInr: 0,
    notes: "Oral drops administered before feeding to protect against fatal infant diarrhea."
  },
  {
    name: "PCV 1 (Pneumococcal Conjugate 1)",
    code: "PCV-1",
    targetDiseases: "Pneumococcal Pneumonia & Meningitis",
    category: "government",
    ageDueWeeks: 6,
    ageDueDisplay: "6 Weeks",
    isWestBengalUip: true,
    suggestedBrands: ["Govt Supply (Pneumosil 10-valent)"],
    approxCostInr: 0,
    notes: "Provided 100% free across all districts of West Bengal under state UIP rollout."
  },

  // --- 10 WEEKS ---
  {
    name: "Pentavalent 2 (DPT + Hep B + Hib)",
    code: "PENTA-2",
    targetDiseases: "Diphtheria, Pertussis, Tetanus, Hepatitis B, Hib",
    category: "government",
    ageDueWeeks: 10,
    ageDueDisplay: "10 Weeks",
    isWestBengalUip: true,
    isPainlessDefault: false,
    suggestedBrands: ["Govt Supply (Easyfive)"],
    approxCostInr: 0,
    notes: "Second primary dose of 5-in-1 combo at health centre."
  },
  {
    name: "OPV 2 (Oral Polio Dose 2)",
    code: "OPV-2",
    targetDiseases: "Poliomyelitis",
    category: "government",
    ageDueWeeks: 10,
    ageDueDisplay: "10 Weeks",
    isWestBengalUip: true,
    suggestedBrands: ["Govt Bivalent OPV"],
    approxCostInr: 0,
    notes: "Second dose oral polio drops."
  },
  {
    name: "Rotavirus Dose 2 (RVV 2)",
    code: "ROTA-2",
    targetDiseases: "Rotavirus Diarrhea",
    category: "government",
    ageDueWeeks: 10,
    ageDueDisplay: "10 Weeks",
    isWestBengalUip: true,
    suggestedBrands: ["Govt Supply (Rotasiil)"],
    approxCostInr: 0,
    notes: "Second dose oral drops."
  },

  // --- 14 WEEKS ---
  {
    name: "Pentavalent 3 (DPT + Hep B + Hib)",
    code: "PENTA-3",
    targetDiseases: "Diphtheria, Pertussis, Tetanus, Hepatitis B, Hib",
    category: "government",
    ageDueWeeks: 14,
    ageDueDisplay: "14 Weeks",
    isWestBengalUip: true,
    isPainlessDefault: false,
    suggestedBrands: ["Govt Supply (Easyfive)"],
    approxCostInr: 0,
    notes: "Third primary dose completing the infant Pentavalent series."
  },
  {
    name: "OPV 3 (Oral Polio Dose 3)",
    code: "OPV-3",
    targetDiseases: "Poliomyelitis",
    category: "government",
    ageDueWeeks: 14,
    ageDueDisplay: "14 Weeks",
    isWestBengalUip: true,
    suggestedBrands: ["Govt Bivalent OPV"],
    approxCostInr: 0,
    notes: "Third dose oral polio drops."
  },
  {
    name: "fIPV 2 (fractional Inactivated Polio 2)",
    code: "fIPV-2",
    targetDiseases: "Poliomyelitis",
    category: "government",
    ageDueWeeks: 14,
    ageDueDisplay: "14 Weeks",
    isWestBengalUip: true,
    suggestedBrands: ["Govt Supply fIPV"],
    approxCostInr: 0,
    notes: "Second dose fractional IPV."
  },
  {
    name: "Rotavirus Dose 3 (RVV 3)",
    code: "ROTA-3",
    targetDiseases: "Rotavirus Diarrhea",
    category: "government",
    ageDueWeeks: 14,
    ageDueDisplay: "14 Weeks",
    isWestBengalUip: true,
    suggestedBrands: ["Govt Supply (Rotasiil)"],
    approxCostInr: 0,
    notes: "Final primary dose of oral Rotavirus drops."
  },
  {
    name: "PCV 2 (Pneumococcal Conjugate 2)",
    code: "PCV-2",
    targetDiseases: "Pneumococcal Pneumonia & Meningitis",
    category: "government",
    ageDueWeeks: 14,
    ageDueDisplay: "14 Weeks",
    isWestBengalUip: true,
    suggestedBrands: ["Govt Supply (Pneumosil)"],
    approxCostInr: 0,
    notes: "Second primary dose of PCV."
  },

  // --- 9 MONTHS ---
  {
    name: "MR 1 (Measles & Rubella Dose 1)",
    code: "MR-1",
    targetDiseases: "Measles & Congenital Rubella",
    category: "government",
    ageDueWeeks: 39,
    ageDueDisplay: "9 Months",
    isWestBengalUip: true,
    suggestedBrands: ["Govt Supply MR"],
    approxCostInr: 0,
    notes: "Subcutaneous shot at 9 months. Administered with Vitamin A 1st oral dose (1 lakh IU)."
  },
  {
    name: "PCV Booster (Pneumococcal Booster)",
    code: "PCV-B",
    targetDiseases: "Pneumococcal Pneumonia & Invasive Disease",
    category: "government",
    ageDueWeeks: 39,
    ageDueDisplay: "9 Months",
    isWestBengalUip: true,
    suggestedBrands: ["Govt Supply (Pneumosil)"],
    approxCostInr: 0,
    notes: "Booster dose providing long-term pneumococcal protection."
  },
  {
    name: "fIPV 3 (fractional Inactivated Polio 3)",
    code: "fIPV-3",
    targetDiseases: "Poliomyelitis",
    category: "government",
    ageDueWeeks: 39,
    ageDueDisplay: "9 Months",
    isWestBengalUip: true,
    suggestedBrands: ["Govt Supply fIPV"],
    approxCostInr: 0,
    notes: "Third fractional IPV dose administered at 9 months per West Bengal state immunization protocol."
  },
  {
    name: "JE 1 (Japanese Encephalitis Dose 1)",
    code: "JE-1",
    targetDiseases: "Japanese Encephalitis (Brain Fever)",
    category: "government",
    ageDueWeeks: 39,
    ageDueDisplay: "9 Months",
    isWestBengalUip: true,
    suggestedBrands: ["Govt Supply (Live attenuated SA 14-14-2)"],
    approxCostInr: 0,
    notes: "Provided free by WB Government in all endemic districts (Darjeeling, Jalpaiguri, Malda, Murshidabad, Bankura, Birbhum, etc.)."
  },

  // --- 16–24 MONTHS ---
  {
    name: "MR 2 (Measles & Rubella Dose 2)",
    code: "MR-2",
    targetDiseases: "Measles & Rubella",
    category: "government",
    ageDueWeeks: 74,
    ageDueDisplay: "16–24 Months",
    isWestBengalUip: true,
    suggestedBrands: ["Govt Supply MR"],
    approxCostInr: 0,
    notes: "Second dose of MR for solid lifelong protection."
  },
  {
    name: "DPT Booster 1",
    code: "DPT-B1",
    targetDiseases: "Diphtheria, Pertussis, Tetanus",
    category: "government",
    ageDueWeeks: 74,
    ageDueDisplay: "16–24 Months",
    isWestBengalUip: true,
    isPainlessDefault: false,
    suggestedBrands: ["Govt Supply Triple Antigen (DPT)"],
    approxCostInr: 0,
    notes: "First DPT booster along with OPV booster drops."
  },
  {
    name: "OPV Booster",
    code: "OPV-B",
    targetDiseases: "Poliomyelitis",
    category: "government",
    ageDueWeeks: 74,
    ageDueDisplay: "16–24 Months",
    isWestBengalUip: true,
    suggestedBrands: ["Govt Bivalent OPV"],
    approxCostInr: 0,
    notes: "Booster dose of oral polio drops."
  },
  {
    name: "JE 2 (Japanese Encephalitis Dose 2)",
    code: "JE-2",
    targetDiseases: "Japanese Encephalitis (Brain Fever)",
    category: "government",
    ageDueWeeks: 74,
    ageDueDisplay: "16–24 Months",
    isWestBengalUip: true,
    suggestedBrands: ["Govt Supply (Live attenuated SA 14-14-2)"],
    approxCostInr: 0,
    notes: "Second dose of JE in West Bengal."
  },

  // --- 5–6 YEARS ---
  {
    name: "DPT Booster 2",
    code: "DPT-B2",
    targetDiseases: "Diphtheria, Pertussis, Tetanus",
    category: "government",
    ageDueWeeks: 260,
    ageDueDisplay: "5–6 Years",
    isWestBengalUip: true,
    isPainlessDefault: false,
    suggestedBrands: ["Govt Supply DPT"],
    approxCostInr: 0,
    notes: "School-entry booster dose provided free at all state centres."
  },

  // --- 10 & 16 YEARS ---
  {
    name: "Td (Tetanus & adult Diphtheria - 10 Yrs)",
    code: "TD-10",
    targetDiseases: "Tetanus & Diphtheria",
    category: "government",
    ageDueWeeks: 520,
    ageDueDisplay: "10 Years",
    isWestBengalUip: true,
    suggestedBrands: ["Govt Supply Td"],
    approxCostInr: 0,
    notes: "Given at 10 years of age in schools and health sub-centres."
  },
  {
    name: "Td (Tetanus & adult Diphtheria - 16 Yrs)",
    code: "TD-16",
    targetDiseases: "Tetanus & Diphtheria",
    category: "government",
    ageDueWeeks: 832,
    ageDueDisplay: "16 Years",
    isWestBengalUip: true,
    suggestedBrands: ["Govt Supply Td"],
    approxCostInr: 0,
    notes: "Adolescent booster given at 16 years."
  },

  // =========================================================================
  // 2. PRIVATE CLINIC ONLY SCHEDULE (MUST BUY - NOT GIVEN BY WB GOVERNMENT)
  // =========================================================================

  // --- 6 MONTHS ---
  {
    name: "Influenza Vaccine Dose 1 (Flu Shot - Quadrivalent)",
    code: "FLU-1",
    targetDiseases: "Seasonal Influenza (Swine Flu H1N1 & Severe Respiratory Illness)",
    category: "private",
    ageDueWeeks: 26,
    ageDueDisplay: "6 Months",
    isWestBengalUip: false,
    suggestedBrands: ["FluQuadri (Sanofi)", "Influvac Tetra (Abbott)", "Vaxigrip Tetra"],
    approxCostInr: 1950,
    notes: "NOT provided by WB Government. Recommended by IAP pediatricians. First year requires 2 primary doses 4 weeks apart."
  },

  // --- 7 MONTHS ---
  {
    name: "Influenza Vaccine Dose 2 (Flu Shot Booster)",
    code: "FLU-2",
    targetDiseases: "Seasonal Influenza",
    category: "private",
    ageDueWeeks: 30,
    ageDueDisplay: "7 Months",
    isWestBengalUip: false,
    suggestedBrands: ["FluQuadri (Sanofi)", "Influvac Tetra (Abbott)"],
    approxCostInr: 1950,
    notes: "NOT provided by WB Government. Must be given 4 weeks after FLU-1 to establish protective antibody titers."
  },

  // --- 6–9 MONTHS ---
  {
    name: "Typhoid Conjugate Vaccine (TCV)",
    code: "TCV",
    targetDiseases: "Typhoid Fever (Salmonella Typhi & Enteric Complications)",
    category: "private",
    ageDueWeeks: 35,
    ageDueDisplay: "6–9 Months",
    isWestBengalUip: false,
    suggestedBrands: ["Typbar TCV (Bharat Biotech)", "Zyvac TCV (Zydus)"],
    approxCostInr: 1800,
    notes: "NOT provided by WB Government. Single dose provides robust 5+ years protection against waterborne typhoid infection."
  },

  // --- 12 MONTHS (1 YEAR) ---
  {
    name: "Hepatitis A Dose 1",
    code: "HEPA-1",
    targetDiseases: "Hepatitis A (Food & Waterborne Jaundice / Acute Liver Infection)",
    category: "private",
    ageDueWeeks: 52,
    ageDueDisplay: "12 Months (1 Year)",
    isWestBengalUip: false,
    suggestedBrands: ["Havrix 720 (GSK)", "Avaxim 80 (Sanofi)", "Biovac-A (Live Attenuated)"],
    approxCostInr: 1600,
    notes: "NOT provided by WB Government. Critical in India due to high endemicity of food & waterborne hepatitis."
  },

  // --- 15 MONTHS ---
  {
    name: "MMR (Measles, Mumps, Rubella Booster)",
    code: "MMR-B",
    targetDiseases: "Measles, Mumps (Parotitis & Orchitis), Rubella",
    category: "private",
    ageDueWeeks: 65,
    ageDueDisplay: "15 Months",
    isWestBengalUip: false,
    suggestedBrands: ["Tresivac (Serum)", "Priorix (GSK)"],
    approxCostInr: 650,
    notes: "NOT provided by WB Government. WB Govt only provides MR (Measles-Rubella), which leaves out Mumps. Private MMR protects against painful Mumps and its complications."
  },
  {
    name: "Varicella Dose 1 (Chickenpox)",
    code: "VAR-1",
    targetDiseases: "Varicella / Chickenpox & Severe Skin Lesions",
    category: "private",
    ageDueWeeks: 65,
    ageDueDisplay: "15 Months",
    isWestBengalUip: false,
    suggestedBrands: ["Variped (MSD)", "Varilrix (GSK)"],
    approxCostInr: 2200,
    notes: "NOT provided by WB Government. Protects against chickenpox, high fever, blisters, and scarring."
  },

  // --- 18 MONTHS ---
  {
    name: "Hepatitis A Dose 2 (Lifelong Booster)",
    code: "HEPA-2",
    targetDiseases: "Hepatitis A",
    category: "private",
    ageDueWeeks: 78,
    ageDueDisplay: "18 Months",
    isWestBengalUip: false,
    suggestedBrands: ["Havrix 720", "Avaxim 80"],
    approxCostInr: 1600,
    notes: "NOT provided by WB Government. Second dose given 6 months after dose 1 confers lifelong protection (if using inactivated vaccine)."
  },
  {
    name: "Varicella Dose 2 (Chickenpox Booster)",
    code: "VAR-2",
    targetDiseases: "Varicella / Chickenpox",
    category: "private",
    ageDueWeeks: 78,
    ageDueDisplay: "18 Months",
    isWestBengalUip: false,
    suggestedBrands: ["Variped", "Varilrix"],
    approxCostInr: 2200,
    notes: "NOT provided by WB Government. Second dose gives >98% immunity against chickenpox."
  },

  // --- 2 YEARS (ANNUAL) ---
  {
    name: "Annual Influenza Booster (Pre-Monsoon)",
    code: "FLU-ANNUAL",
    targetDiseases: "Seasonal Flu (Updated yearly strains)",
    category: "private",
    ageDueWeeks: 104,
    ageDueDisplay: "2 Years",
    isWestBengalUip: false,
    suggestedBrands: ["FluQuadri", "Influvac Tetra"],
    approxCostInr: 1950,
    notes: "NOT provided by WB Government. Yearly shot recommended before rainy season in West Bengal up to age 5."
  },

  // --- 2 YEARS (OPTIONAL / TRAVEL) ---
  {
    name: "Meningococcal Conjugate (ACWY)",
    code: "MEN-ACWY",
    targetDiseases: "Meningococcal Meningitis (Serogroups A, C, W, Y)",
    category: "private",
    ageDueWeeks: 104,
    ageDueDisplay: "2 Years",
    isWestBengalUip: false,
    suggestedBrands: ["Menactra (Sanofi)", "Nimenrix (Pfizer)"],
    approxCostInr: 4500,
    notes: "NOT provided by WB Government. Recommended for high-risk children, day-care settings, or overseas travel."
  },

  // --- 9–14 YEARS (GIRLS) ---
  {
    name: "HPV Vaccine (Cervical Cancer Protection)",
    code: "HPV",
    targetDiseases: "Human Papillomavirus / Cervical Cancer & Genital Warts",
    category: "private",
    ageDueWeeks: 468,
    ageDueDisplay: "9–14 Years",
    isWestBengalUip: false,
    suggestedBrands: ["Cervavac (Serum)", "Gardasil 9 (MSD)"],
    approxCostInr: 2200,
    notes: "NOT provided by WB Government under routine free immunization. Essential cancer prevention vaccine for daughters. 2 doses at 6-month interval."
  }
];

/**
 * Generates the personalized vaccine records calculated exactly from the baby's DOB
 */
export function generateVaccineSchedule(childDob: string, childId: string): VaccineRecord[] {
  const birthDate = new Date(childDob);
  const now = new Date();

  return MASTER_VACCINE_SCHEDULE.map((master, idx) => {
    const dueTime = new Date(birthDate.getTime() + master.ageDueWeeks * 7 * 24 * 60 * 60 * 1000);
    const isPast = dueTime.getTime() < now.getTime();
    
    // Default initial status: Birth vaccines are already given!
    const isBirthVaccine = master.ageDueWeeks === 0;

    return {
      id: `vax_${childId}_${idx + 1}_${master.code}`,
      childId,
      name: master.name,
      code: master.code,
      targetDiseases: master.targetDiseases,
      category: master.category,
      ageDueWeeks: master.ageDueWeeks,
      ageDueDisplay: master.ageDueDisplay,
      dueDate: dueTime.toISOString(),
      status: isBirthVaccine ? 'given' : (isPast ? 'overdue' : 'upcoming'),
      dateAdministered: isBirthVaccine ? birthDate.toISOString().split('T')[0] : undefined,
      isPainless: master.isPainlessDefault,
      brandName: master.suggestedBrands?.[0],
      costInr: master.category === 'private' ? master.approxCostInr : 0,
      clinicName: isBirthVaccine ? "Hospital of Birth" : undefined,
      notes: master.notes,
    };
  });
}
