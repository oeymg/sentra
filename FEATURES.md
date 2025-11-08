# Sentra Features Documentation

## Core Features

### 1. Multi-Platform Review Aggregation

Sentra connects to 20+ review platforms to centralize all your business reviews in one dashboard.

#### Supported Platforms

**E-commerce & General**
- Google Reviews (Google My Business)
- Yelp
- Trustpilot
- Facebook Reviews
- BBB (Better Business Bureau)

**Travel & Hospitality**
- Tripadvisor
- Booking.com
- Expedia
- Hotels.com
- OpenTable
- Zomato

**App Stores**
- Apple App Store
- Google Play Store

**B2B & Professional**
- G2
- Capterra
- Glassdoor
- Product Hunt

**Home Services**
- Angi (formerly Angie's List)
- Houzz

#### How It Works
1. Connect your business accounts via API keys or OAuth
2. Sentra automatically fetches reviews on a schedule
3. Reviews are normalized and stored in your database
4. View all reviews in a unified dashboard

### 2. AI-Powered Review Analysis

Sentra uses Anthropic's Claude AI to automatically analyze every review.

#### Analysis Features

**Sentiment Detection**
- Classifies reviews as positive, neutral, or negative
- Provides a sentiment score from -1 (very negative) to +1 (very positive)
- More nuanced than simple star ratings

**Keyword Extraction**
- Identifies key terms and phrases in reviews
- Helps spot common themes across reviews
- Useful for product/service improvement

**Category Classification**
- Automatically categorizes feedback by topic
- Common categories: service, product quality, price, cleanliness, staff, etc.
- Customizable to your business needs

**Language Detection**
- Identifies the language of each review
- Supports 100+ languages
- Enables multi-language support

**Spam Detection**
- Identifies potentially fake or spam reviews
- Uses AI to detect patterns of inauthentic reviews
- Helps maintain review quality

#### API Endpoint
\`\`\`javascript
POST /api/reviews/analyze
Body: { reviewId: "uuid" }
\`\`\`

### 3. Smart Response Generation

Generate contextual, personalized responses to reviews using AI.

#### Response Features

**Multiple Tone Options**
- **Professional**: Formal, business-appropriate responses
- **Friendly**: Warm, conversational tone
- **Apologetic**: For negative reviews, shows empathy
- **Enthusiastic**: Energetic, excited responses for positive reviews

**Context-Aware**
- Considers the review rating
- References specific points mentioned in the review
- Adapts to your business name and industry

**Personalized**
- Not generic templates
- Each response is unique
- Maintains authenticity

**Bulk Generation**
- Generate multiple response options at once
- Choose the best one or edit as needed
- Save time responding to reviews

#### API Endpoint
\`\`\`javascript
POST /api/reviews/generate-response
Body: { reviewId: "uuid" }
Returns: Array of response suggestions with different tones
\`\`\`

### 4. Centralized Dashboard

A beautiful, intuitive dashboard to manage all your reviews.

#### Dashboard Sections

**Overview**
- Total review count across all platforms
- Average rating
- Response rate
- Positive review count
- Recent review trends

**Reviews**
- List all reviews in one place
- Filter by platform, rating, sentiment
- Search reviews by keyword
- Sort by date, rating, or platform
- Quick actions: analyze, respond, mark as spam

**Analytics**
- Review trends over time
- Sentiment analysis charts
- Platform comparison
- Response rate tracking
- Keyword frequency analysis

**Settings**
- Manage business information
- Connect/disconnect platforms
- Configure notification preferences
- API key management
- Team member access (future feature)

### 5. Authentication & Security

Enterprise-grade security for your business data.

#### Authentication Methods
- **Email/Password**: Traditional authentication
- **Google OAuth**: Sign in with Google
- **GitHub OAuth**: Sign in with GitHub
- More providers can be added easily

#### Security Features
- Row Level Security (RLS) in Supabase
- Encrypted API keys
- Secure token storage
- HTTPS only in production
- Rate limiting on API endpoints
- User session management

### 6. Database & Data Management

Robust PostgreSQL database via Supabase.

#### Data Models
- **Profiles**: User account information
- **Businesses**: Multi-business support per user
- **Review Platforms**: Master list of platforms
- **Business Platforms**: Platform connections per business
- **Reviews**: All reviews with full metadata
- **AI Responses**: Generated response history
- **Analytics Snapshots**: Daily aggregated data

#### Features
- Real-time data sync
- Automatic timestamps
- Soft deletes
- Foreign key constraints
- Indexed queries for performance

## Advanced Features (Planned)

### Automated Review Syncing
- Scheduled jobs to fetch new reviews
- Real-time webhooks where available
- Configurable sync frequency
- Error handling and retry logic

### Email Notifications
- New review alerts
- Negative review warnings
- Weekly summary reports
- Customizable notification preferences

### Direct Response Posting
- Post responses directly to platforms
- OAuth integration for authorized posting
- Response scheduling
- Draft management

### Advanced Analytics
- Custom date ranges
- Export reports (PDF, CSV)
- Competitor comparison
- Review trends by location
- Sentiment analysis over time
- Keyword trend tracking

### Team Collaboration
- Multi-user access
- Role-based permissions
- Response approval workflow
- Internal notes on reviews
- Assignment system

### Bulk Operations
- Bulk response generation
- Batch review import
- Mass platform connection
- Bulk status updates

### Custom AI Training
- Train AI on your brand voice
- Custom response templates
- Industry-specific categorization
- Fine-tuned sentiment analysis

### Mobile App
- iOS and Android apps
- Push notifications
- Quick response on-the-go
- Review monitoring

### Integrations
- Zapier integration
- Webhook support
- Slack notifications
- API for custom integrations
- CRM integrations

### White Label
- Custom branding
- Custom domain
- Remove Sentra branding
- Enterprise plans

## API Documentation

### Review Analysis API

**Endpoint**: \`POST /api/reviews/analyze\`

**Request**:
\`\`\`json
{
  "reviewId": "550e8400-e29b-41d4-a716-446655440000"
}
\`\`\`

**Response**:
\`\`\`json
{
  "success": true,
  "analysis": {
    "sentiment": "positive",
    "sentimentScore": 0.85,
    "keywords": ["great", "service", "friendly", "fast"],
    "categories": ["service", "staff"],
    "language": "en",
    "isSpam": false,
    "summary": "Customer had a great experience with friendly and fast service"
  }
}
\`\`\`

### Response Generation API

**Endpoint**: \`POST /api/reviews/generate-response\`

**Request**:
\`\`\`json
{
  "reviewId": "550e8400-e29b-41d4-a716-446655440000"
}
\`\`\`

**Response**:
\`\`\`json
{
  "success": true,
  "responses": [
    {
      "text": "Thank you so much for your wonderful feedback! We're thrilled to hear you had a great experience with our team. We look forward to serving you again soon!",
      "tone": "professional"
    },
    {
      "text": "Wow, thanks for the amazing review! We're so happy you loved our service. Can't wait to see you again!",
      "tone": "friendly"
    },
    {
      "text": "We're absolutely delighted by your fantastic feedback! Your kind words really made our day. Thank you for choosing us!",
      "tone": "enthusiastic"
    }
  ]
}
\`\`\`

## Usage Examples

### Analyzing a Review

\`\`\`javascript
const response = await fetch('/api/reviews/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ reviewId: 'your-review-id' })
})

const data = await response.json()
console.log(data.analysis)
\`\`\`

### Generating Responses

\`\`\`javascript
const response = await fetch('/api/reviews/generate-response', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ reviewId: 'your-review-id' })
})

const data = await response.json()
data.responses.forEach(r => {
  console.log(\`\${r.tone}: \${r.text}\`)
})
\`\`\`

### Using Supabase Client

\`\`\`javascript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// Fetch reviews
const { data: reviews } = await supabase
  .from('reviews')
  .select('*')
  .eq('business_id', businessId)
  .order('reviewed_at', { ascending: false })

// Fetch with platform info
const { data: reviewsWithPlatform } = await supabase
  .from('reviews')
  .select(\`
    *,
    review_platforms (name, slug)
  \`)
  .eq('business_id', businessId)
\`\`\`

## Best Practices

### For Review Management
1. Respond to all reviews within 24 hours
2. Personalize responses using AI suggestions as a starting point
3. Always address specific concerns in negative reviews
4. Thank customers for positive feedback
5. Monitor sentiment trends to identify issues early

### For API Usage
1. Use environment variables for all API keys
2. Implement rate limiting for public endpoints
3. Handle errors gracefully
4. Cache frequently accessed data
5. Use batch operations where possible

### For Security
1. Never expose API keys in client-side code
2. Validate all user inputs
3. Use Row Level Security (RLS) policies
4. Regularly rotate API keys
5. Monitor for suspicious activity

### For Performance
1. Index frequently queried fields
2. Use pagination for large datasets
3. Implement caching strategies
4. Optimize image sizes
5. Use CDN for static assets

---

For more information, see [README.md](README.md) and [SETUP_GUIDE.md](SETUP_GUIDE.md).
