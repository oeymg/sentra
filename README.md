# Sentra - Centralized Review Management Platform

AI-powered review aggregation, analysis, and response generation for SMEs. Manage reviews from 20+ platforms including Google, Yelp, Trustpilot, Facebook, and more in one centralized dashboard.

## Features

- **Multi-Platform Review Aggregation**: Collect reviews from Google, Yelp, Trustpilot, Facebook, Tripadvisor, and 15+ other platforms
- **AI-Powered Analysis**: Sentiment analysis, keyword extraction, and automatic categorization using Claude AI
- **Smart Response Generation**: Generate context-aware, personalized responses with multiple tone options
- **Real-time Dashboard**: Monitor all your reviews, ratings, and analytics in one place
- **OAuth Authentication**: Secure sign-in with Google and GitHub
- **Analytics & Insights**: Track review trends, sentiment over time, and response rates

## Tech Stack

- **Frontend**: Next.js 14+ with TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with OAuth
- **AI**: Anthropic Claude (Claude 3.5 Sonnet)
- **Deployment**: Vercel
- **UI Libraries**: Recharts, Lucide Icons, date-fns

## Supported Review Platforms

- Google Reviews (My Business)
- Yelp
- Trustpilot
- Facebook
- Tripadvisor
- Amazon
- Apple App Store
- Google Play Store
- BBB (Better Business Bureau)
- Glassdoor
- G2
- Capterra
- Product Hunt
- Angi
- Houzz
- OpenTable
- Zomato
- Booking.com
- Expedia
- Hotels.com

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier available)
- An Anthropic API key (for Claude AI)
- API keys for review platforms you want to integrate

### 1. Clone and Install

\`\`\`bash
git clone <your-repo-url>
cd sentra
npm install
\`\`\`

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API to get your credentials
3. Go to SQL Editor and run the schema from \`supabase/schema.sql\`
4. Enable authentication providers:
   - Go to Authentication > Providers
   - Enable Email and configure OAuth providers (Google, GitHub)

### 3. Configure Environment Variables

Copy \`.env.example\` to \`.env.local\`:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Fill in your environment variables:

\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Anthropic Claude
ANTHROPIC_API_KEY=your_anthropic_api_key

# Review Platform APIs (add as needed)
GOOGLE_PLACES_API_KEY=your_google_places_api_key
YELP_API_KEY=your_yelp_api_key
TRUSTPILOT_API_KEY=your_trustpilot_api_key
FACEBOOK_ACCESS_TOKEN=your_facebook_access_token
TRIPADVISOR_API_KEY=your_tripadvisor_api_key
\`\`\`

### 4. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Project Structure

\`\`\`
sentra/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/                # API routes
│   │   │   └── reviews/        # Review-related endpoints
│   │   ├── auth/               # Authentication pages
│   │   ├── dashboard/          # Dashboard pages
│   │   └── page.tsx            # Landing page
│   ├── components/             # React components
│   │   └── dashboard/          # Dashboard components
│   ├── lib/                    # Utilities and configurations
│   │   ├── ai/                 # Claude AI integration
│   │   ├── integrations/       # Review platform integrations
│   │   └── supabase/           # Supabase client configs
│   └── types/                  # TypeScript type definitions
├── supabase/
│   └── schema.sql              # Database schema
└── public/                     # Static assets
\`\`\`

## Database Schema

The database includes the following main tables:

- \`profiles\`: User profiles
- \`businesses\`: User's businesses
- \`review_platforms\`: Available review platforms
- \`business_platforms\`: Connected platforms per business
- \`reviews\`: All reviews with AI analysis
- \`ai_responses\`: Generated response suggestions
- \`analytics_snapshots\`: Daily analytics data

## API Routes

### Review Analysis
\`POST /api/reviews/analyze\`
- Analyzes a review using Claude AI
- Returns sentiment, keywords, categories, language detection

### Response Generation
\`POST /api/reviews/generate-response\`
- Generates multiple AI response suggestions
- Returns responses in different tones (professional, friendly, apologetic, enthusiastic)

## Obtaining API Keys

### Anthropic Claude
1. Sign up at [console.anthropic.com](https://console.anthropic.com)
2. Navigate to API Keys
3. Create a new API key
4. Free tier includes $5 credit

### Google Places API
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable Places API (New)
3. Create credentials (API Key)
4. Note: Google My Business API requires OAuth for reviews

### Yelp Fusion API
1. Create an app at [Yelp Developers](https://www.yelp.com/developers)
2. Get your API key from the app dashboard
3. Free tier: 5000 API calls/day

### Trustpilot API
1. Apply for API access at [Trustpilot Developers](https://developers.trustpilot.com)
2. Requires business account verification

### Facebook Graph API
1. Create an app at [Facebook Developers](https://developers.facebook.com)
2. Add Facebook Login product
3. Generate Page Access Token for your business page

## Deployment to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add environment variables in Vercel project settings
4. Deploy!

Vercel will automatically:
- Build your Next.js app
- Set up continuous deployment
- Provide a production URL
- Handle serverless functions

## Features Roadmap

- [ ] Automated review syncing (scheduled jobs)
- [ ] Email notifications for new reviews
- [ ] Review response posting directly to platforms
- [ ] Advanced analytics and reporting
- [ ] Team collaboration features
- [ ] Bulk review operations
- [ ] Custom AI response training
- [ ] Mobile app
- [ ] White-label options
- [ ] Zapier/webhook integrations

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues and questions:
- Create an issue in this repository
- Check existing documentation
- Review platform API documentation for integration issues

## Acknowledgments

- Built with [Next.js](https://nextjs.org)
- Powered by [Anthropic Claude](https://www.anthropic.com)
- Database by [Supabase](https://supabase.com)
- Deployed on [Vercel](https://vercel.com)
# sentra
