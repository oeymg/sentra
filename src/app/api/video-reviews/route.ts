import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET - Fetch video reviews for a business
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: videoReviews, error } = await supabase
      .from('video_reviews')
      .select('*')
      .eq('business_id', businessId)
      .order('posted_at', { ascending: false })

    if (error) {
      console.error('Error fetching video reviews:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ videoReviews })
  } catch (error: any) {
    console.error('Error in video-reviews GET:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST - Add a new video review
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      businessId,
      platform,
      videoUrl,
      creatorName,
      creatorHandle,
      rating,
      title,
      description,
      isFeatured = false,
    } = body

    // Validate required fields
    if (!businessId || !platform || !videoUrl || !creatorName) {
      return NextResponse.json(
        { error: 'businessId, platform, videoUrl, and creatorName are required' },
        { status: 400 }
      )
    }

    // Verify user owns this business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .eq('user_id', user.id)
      .single()

    if (businessError || !business) {
      return NextResponse.json({ error: 'Business not found or unauthorized' }, { status: 403 })
    }

    // Parse the video URL to get embed URL
    const embedData = parseVideoUrl(videoUrl, platform)

    // Insert video review
    const { data: videoReview, error: insertError } = await supabase
      .from('video_reviews')
      .insert({
        business_id: businessId,
        platform,
        video_url: videoUrl,
        embed_url: embedData.embedUrl,
        thumbnail_url: embedData.thumbnailUrl,
        creator_name: creatorName,
        creator_handle: creatorHandle || null,
        rating: rating || null,
        title: title || null,
        description: description || null,
        is_featured: isFeatured,
        posted_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting video review:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ videoReview }, { status: 201 })
  } catch (error: any) {
    console.error('Error in video-reviews POST:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// Helper function to parse video URLs and extract embed URLs
function parseVideoUrl(url: string, platform: string): { embedUrl: string | null; thumbnailUrl: string | null } {
  let embedUrl: string | null = null
  let thumbnailUrl: string | null = null

  try {
    const urlObj = new URL(url)

    switch (platform) {
      case 'youtube': {
        // YouTube URL formats:
        // - https://www.youtube.com/watch?v=VIDEO_ID
        // - https://youtu.be/VIDEO_ID
        // - https://www.youtube.com/embed/VIDEO_ID
        let videoId: string | null = null

        if (urlObj.hostname === 'youtu.be') {
          videoId = urlObj.pathname.slice(1)
        } else if (urlObj.hostname.includes('youtube.com')) {
          videoId = urlObj.searchParams.get('v') || urlObj.pathname.split('/').pop() || null
        }

        if (videoId) {
          embedUrl = `https://www.youtube.com/embed/${videoId}`
          thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        }
        break
      }

      case 'tiktok': {
        // TikTok URL format: https://www.tiktok.com/@username/video/VIDEO_ID
        const videoId = url.match(/\/video\/(\d+)/)?.[1]
        if (videoId) {
          embedUrl = `https://www.tiktok.com/embed/v2/${videoId}`
        }
        break
      }

      case 'instagram': {
        // Instagram URL formats:
        // - https://www.instagram.com/p/POST_ID/
        // - https://www.instagram.com/reel/REEL_ID/
        const postId = url.match(/\/(p|reel)\/([A-Za-z0-9_-]+)/)?.[2]
        if (postId) {
          embedUrl = `https://www.instagram.com/p/${postId}/embed`
        }
        break
      }

      case 'vimeo': {
        // Vimeo URL format: https://vimeo.com/VIDEO_ID
        const videoId = urlObj.pathname.split('/').filter(Boolean)[0]
        if (videoId) {
          embedUrl = `https://player.vimeo.com/video/${videoId}`
        }
        break
      }

      case 'twitter': {
        // Twitter/X embeds require the full tweet URL
        // We'll use the oEmbed API approach or just use the URL as-is
        embedUrl = url
        break
      }

      case 'facebook': {
        // Facebook video embeds
        embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`
        break
      }

      default:
        embedUrl = url
    }
  } catch (error) {
    console.error('Error parsing video URL:', error)
  }

  return { embedUrl, thumbnailUrl }
}
