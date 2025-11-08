import { NextRequest, NextResponse } from 'next/server'
import { analyzeReview } from '@/lib/ai/claude'

/**
 * Test endpoint to verify Claude AI is working
 *
 * Usage: POST to /api/test-claude with:
 * {
 *   "text": "Great service, loved it!",
 *   "rating": 5
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { text, rating } = await request.json()

    console.log('[Test Claude] Testing Claude AI analysis...')
    console.log('[Test Claude] Input:', { text, rating })

    const analysis = await analyzeReview(text || 'This is a test review', rating || 5)

    console.log('[Test Claude] Success! Analysis:', analysis)

    return NextResponse.json({
      success: true,
      analysis,
      message: 'Claude AI is working correctly!',
    })
  } catch (error) {
    console.error('[Test Claude] Failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Claude AI test failed',
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST with JSON body: { "text": "review text", "rating": 5 }',
  })
}
