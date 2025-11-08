import Snoowrap from 'snoowrap'
import { env } from '@/lib/env'

export interface RedditReview {
  reviewId: string
  reviewer: {
    displayName: string
  }
  rating: number // 1-5 derived from sentiment (calculated by Claude AI later)
  comment: string
  createTime: string
  updateTime: string
  sourceUrl: string
  subreddit: string
}

/**
 * Fetch Reddit posts/comments mentioning a business using Reddit's API
 *
 * Note: This requires Reddit API credentials. To set up:
 * 1. Go to https://www.reddit.com/prefs/apps
 * 2. Create an app (script type)
 * 3. Add credentials to .env.local:
 *    - REDDIT_CLIENT_ID
 *    - REDDIT_CLIENT_SECRET
 *    - REDDIT_USER_AGENT (e.g., "web:sentra:v1.0.0 (by /u/yourusername)")
 */
export async function fetchRedditReviews(
  businessName: string,
  subreddits: string[] = ['reviews', 'AskReddit'],
  limit: number = 25
): Promise<RedditReview[]> {
  // Check if Reddit API credentials are configured
  if (!env.REDDIT_CLIENT_ID || !env.REDDIT_CLIENT_SECRET || !env.REDDIT_USER_AGENT) {
    console.warn('Reddit API credentials not configured. Skipping Reddit sync.')
    return []
  }

  try {
    const reddit = new Snoowrap({
      userAgent: env.REDDIT_USER_AGENT,
      clientId: env.REDDIT_CLIENT_ID,
      clientSecret: env.REDDIT_CLIENT_SECRET,
    })

    const reviews: RedditReview[] = []
    const searchQuery = `"${businessName}"`

    // Search each subreddit for mentions
    for (const subreddit of subreddits) {
      try {
        // Search for posts mentioning the business
        const allResults = await reddit
          .getSubreddit(subreddit)
          .search({
            query: searchQuery,
            sort: 'relevance' as any,
            time: 'all' as any,
          })

        const searchResults = allResults.slice(0, Math.ceil(limit / subreddits.length))

        for (const post of searchResults) {
          // Check if post actually mentions the business
          const mentionsBusinessInTitle = post.title.toLowerCase().includes(businessName.toLowerCase())
          const mentionsBusinessInBody = post.selftext?.toLowerCase().includes(businessName.toLowerCase())

          if (mentionsBusinessInTitle || mentionsBusinessInBody) {
            reviews.push({
              reviewId: post.id,
              reviewer: {
                displayName: post.author.name,
              },
              rating: 3, // Neutral default - will be analyzed by Claude AI later
              comment: post.selftext || post.title,
              createTime: new Date(post.created_utc * 1000).toISOString(),
              updateTime: new Date(post.created_utc * 1000).toISOString(),
              sourceUrl: `https://reddit.com${post.permalink}`,
              subreddit: post.subreddit.display_name,
            })
          }

          // Also fetch top-level comments from the post
          if (post.num_comments > 0) {
            const comments = await post.comments.fetchAll({ amount: 5 })

            for (const comment of comments.slice(0, 5)) {
              // @ts-ignore - Snoowrap types can be tricky
              if (comment.body && comment.body.toLowerCase().includes(businessName.toLowerCase())) {
                reviews.push({
                  // @ts-ignore
                  reviewId: comment.id,
                  reviewer: {
                    // @ts-ignore
                    displayName: comment.author.name,
                  },
                  rating: 3, // Neutral default - will be analyzed by Claude AI later
                  // @ts-ignore
                  comment: comment.body,
                  // @ts-ignore
                  createTime: new Date(comment.created_utc * 1000).toISOString(),
                  // @ts-ignore
                  updateTime: new Date(comment.created_utc * 1000).toISOString(),
                  // @ts-ignore
                  sourceUrl: `https://reddit.com${comment.permalink}`,
                  subreddit: post.subreddit.display_name,
                })
              }
            }
          }

          if (reviews.length >= limit) break
        }

        if (reviews.length >= limit) break
      } catch (subredditError) {
        console.error(`Error searching subreddit ${subreddit}:`, subredditError)
        // Continue with other subreddits
      }
    }

    return reviews.slice(0, limit)
  } catch (error) {
    console.error('Reddit API error:', error)
    throw new Error('Failed to fetch Reddit reviews. Please check your Reddit API credentials.')
  }
}

/**
 * Normalize Reddit review to standard format for database
 */
export function normalizeRedditReview(review: RedditReview) {
  return {
    platform_review_id: review.reviewId,
    reviewer_name: review.reviewer.displayName,
    reviewer_avatar_url: null,
    rating: review.rating,
    review_text: review.comment,
    review_url: review.sourceUrl,
    reviewed_at: review.createTime,
    has_response: false,
    response_text: null,
    responded_at: null,
  }
}
