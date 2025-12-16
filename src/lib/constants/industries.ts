export const INDUSTRIES = {
  // Professional Design Industries
  HEALTHCARE: 'Healthcare',
  PROFESSIONAL_SERVICES: 'Professional Services',
  REAL_ESTATE: 'Real Estate',
  HOME_SERVICES: 'Home Services',
  EDUCATION: 'Education',
  CONSTRUCTION: 'Construction & Building',

  // Social Design Industries
  RESTAURANT: 'Restaurant',
  RETAIL: 'Retail',
  HOSPITALITY: 'Hospitality',
  BEAUTY_WELLNESS: 'Beauty & Wellness',
  AUTOMOTIVE: 'Automotive',
  ECOMMERCE: 'E-commerce',
  TECHNOLOGY: 'Technology',

  OTHER: 'Other',
} as const

export type Industry = typeof INDUSTRIES[keyof typeof INDUSTRIES]

export const INDUSTRY_OPTIONS = Object.values(INDUSTRIES)

/**
 * Determines which review hub design variant to use based on business industry
 * @param industry - The business industry
 * @returns 'professional' for high-stakes businesses, 'social' for consumer businesses
 */
export function getDesignVariant(industry: string | null | undefined): 'professional' | 'social' {
  if (!industry) return 'social' // Default to social if no industry

  const professionalIndustries = [
    INDUSTRIES.HEALTHCARE,
    INDUSTRIES.PROFESSIONAL_SERVICES,
    INDUSTRIES.REAL_ESTATE,
    INDUSTRIES.HOME_SERVICES,
    INDUSTRIES.EDUCATION,
    INDUSTRIES.CONSTRUCTION,
  ]

  return professionalIndustries.includes(industry as Industry) ? 'professional' : 'social'
}
