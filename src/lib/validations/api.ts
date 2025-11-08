import { z } from 'zod'

// Google Reviews API schemas
export const googleReviewsLookupSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  location: z.string().min(1, 'Location is required'),
})

export const googleReviewsSyncSchema = z.object({
  businessId: z.string().uuid('Invalid business ID'),
})

// Reddit Reviews API schemas
export const redditReviewsSyncSchema = z.object({
  businessId: z.string().uuid('Invalid business ID'),
  subreddits: z.array(z.string()).optional(),
})

// Review Analysis API schemas
export const reviewAnalyzeSchema = z.object({
  reviewId: z.string().uuid('Invalid review ID'),
})

// Response Generation API schemas
export const responseGenerateSchema = z.object({
  reviewId: z.string().uuid('Invalid review ID'),
  tone: z.enum(['professional', 'friendly', 'apologetic', 'enthusiastic']).optional(),
})

/**
 * Helper function to validate request body with Zod
 * Returns parsed data or throws with a user-friendly error message
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json()
    return schema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      throw new Error(firstError.message)
    }
    throw new Error('Invalid request body')
  }
}
