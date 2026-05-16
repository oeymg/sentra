export const INDUSTRIES = {
  HEALTHCARE: 'Healthcare',
  HOSPITALITY: 'Hospitality',
  PLUMBING: 'Plumbing',
  ELECTRICAL: 'Electrical',
  HVAC: 'HVAC & Air Con',
  BUILDING: 'Building & Construction',
  PAINTING: 'Painting',
  LANDSCAPING: 'Landscaping',
  CLEANING: 'Cleaning',
  OTHER: 'Other',
} as const

export type Industry = typeof INDUSTRIES[keyof typeof INDUSTRIES]

export const INDUSTRY_OPTIONS = Object.values(INDUSTRIES)

export function getDesignVariant(industry: string | null | undefined): 'professional' | 'social' {
  if (!industry) return 'social'
  const professionalIndustries: string[] = [INDUSTRIES.HEALTHCARE]
  return professionalIndustries.includes(industry) ? 'professional' : 'social'
}
