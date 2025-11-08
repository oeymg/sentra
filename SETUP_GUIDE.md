# Sentra Setup Guide

This guide will walk you through setting up Sentra from scratch.

## Quick Start (5 minutes)

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project"
3. Choose your organization and enter project details
4. Wait for the project to be provisioned (~2 minutes)

### 3. Set Up Database

1. In your Supabase project, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase/schema.sql`
4. Paste it into the SQL editor
5. Click "Run" to execute the schema

This will create all necessary tables, relationships, and security policies.

### 4. Configure Authentication

1. Go to **Authentication** > **Providers** in Supabase
2. **Email**: Already enabled by default
3. **Google OAuth** (optional):
   - Enable Google provider
   - Get credentials from [Google Cloud Console](https://console.cloud.google.com)
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URI: \`https://[your-project-ref].supabase.co/auth/v1/callback\`
4. **GitHub OAuth** (optional):
   - Enable GitHub provider
   - Create OAuth App at [GitHub Settings](https://github.com/settings/developers)
   - Add callback URL: \`https://[your-project-ref].supabase.co/auth/v1/callback\`

### 5. Get API Keys

#### Supabase Keys
1. Go to **Project Settings** > **API**
2. Copy the following:
   - Project URL
   - Anon/Public key
   - Service Role key (keep this secret!)

#### Anthropic Claude Key
1. Sign up at [console.anthropic.com](https://console.anthropic.com)
2. Go to **API Keys**
3. Click "Create Key"
4. Copy your API key (starts with \`sk-ant-\`)
5. Free tier includes $5 credit

### 6. Create Environment File

Create \`.env.local\` in the root directory:

\`\`\`bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Optional: Review Platform APIs (add as needed)
# GOOGLE_PLACES_API_KEY=your-key
# YELP_API_KEY=your-key
# TRUSTPILOT_API_KEY=your-key
# FACEBOOK_ACCESS_TOKEN=your-token
# TRIPADVISOR_API_KEY=your-key
\`\`\`

### 7. Run the Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Setting Up Review Platform APIs (Optional)

These are optional but required for fetching real reviews:

### Google Places API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Places API (New)**
4. Go to **Credentials** > **Create Credentials** > **API Key**
5. Restrict the key to Places API
6. Add to \`.env.local\`:
   \`\`\`
   GOOGLE_PLACES_API_KEY=your-key-here 
   \`\`\`

**Note**: For posting reviews, you'll need Google My Business API with OAuth.

### Yelp Fusion API

1. Go to [Yelp Developers](https://www.yelp.com/developers)
2. Click "Create App"
3. Fill in app details
4. Get your API Key from the dashboard
5. Add to \`.env.local\`:
   \`\`\`
   YELP_API_KEY=your-key-here
   \`\`\`

**Free tier**: 5000 API calls/day

### Trustpilot API

1. Visit [Trustpilot Developers](https://developers.trustpilot.com)
2. Apply for API access (requires business verification)
3. Once approved, get your API key and Business Unit ID
4. Add to \`.env.local\`:
   \`\`\`
   TRUSTPILOT_API_KEY=your-key-here
   \`\`\`

### Facebook Graph API

1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create a new app
3. Add **Facebook Login** product
4. Get your Page Access Token from **Graph API Explorer**
5. Add to \`.env.local\`:
   \`\`\`
   FACEBOOK_ACCESS_TOKEN=your-token-here
   \`\`\`

### TripAdvisor API

1. Visit [TripAdvisor Developers](https://www.tripadvisor.com/developers)
2. Apply for Content API access
3. Note: Requires business partnership
4. Add to \`.env.local\`:
   \`\`\`
   TRIPADVISOR_API_KEY=your-key-here
   \`\`\`

## Deploying to Vercel

### Method 1: GitHub Integration (Recommended)

1. Push your code to GitHub:
   \`\`\`bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-repo-url
   git push -u origin main
   \`\`\`

2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect Next.js settings
6. Add environment variables:
   - Click "Environment Variables"
   - Add all variables from your \`.env.local\`
   - Make sure to mark sensitive keys (like SUPABASE_SERVICE_ROLE_KEY) as sensitive
7. Click "Deploy"

### Method 2: Vercel CLI

\`\`\`bash
npm install -g vercel
vercel login
vercel
\`\`\`

Follow the prompts and add environment variables when asked.

## Verifying Your Setup

### Test Authentication
1. Go to \`/auth/signup\`
2. Create an account with email
3. Check your email for confirmation
4. Or test OAuth with Google/GitHub

### Test Database
1. After signing in, you should see the dashboard
2. The app should load without errors
3. Check Supabase Dashboard > Table Editor to see your profile created

### Test AI Features
1. You'll need to add a business first
2. Then manually add a test review via Supabase Table Editor
3. Use the API to analyze it:
   \`\`\`bash
   curl -X POST http://localhost:3000/api/reviews/analyze \\
     -H "Content-Type: application/json" \\
     -d '{"reviewId": "your-review-id"}'
   \`\`\`

## Troubleshooting

### "Unauthorized" errors
- Check that your Supabase URL and keys are correct
- Make sure you're signed in
- Verify RLS policies are enabled in Supabase

### "Failed to fetch" errors
- Check that your API keys are in \`.env.local\`
- Restart the dev server after adding env variables
- Check browser console for specific error messages

### Database errors
- Make sure you ran the schema.sql file
- Check that all tables exist in Supabase Table Editor
- Verify RLS policies are enabled

### Build errors
- Run \`npm run build\` locally to test
- Check TypeScript errors: \`npx tsc --noEmit\`
- Verify all dependencies are installed

### OAuth not working
- Check redirect URLs match exactly
- Ensure OAuth provider is enabled in Supabase
- Verify client IDs and secrets are correct

## Next Steps

1. **Add Your First Business**: Create a business profile in the dashboard
2. **Connect Platforms**: Add API keys for review platforms
3. **Import Reviews**: Use the API integrations to fetch reviews
4. **Test AI Features**: Analyze reviews and generate responses
5. **Customize**: Modify the UI, add features, or integrate more platforms

## Development Tips

### Hot Reload
The dev server supports hot reload. Changes to files will automatically refresh the browser.

### Database Changes
If you modify the schema:
1. Update \`supabase/schema.sql\`
2. Run the new SQL in Supabase SQL Editor
3. Update TypeScript types in \`src/types/database.types.ts\`

### Adding New Review Platforms
1. Create integration file in \`src/lib/integrations/platform-name.ts\`
2. Follow the pattern from existing integrations
3. Add platform to database via SQL or Supabase dashboard

### API Testing
Use tools like:
- Postman
- Thunder Client (VS Code extension)
- curl

## Support

If you encounter issues:
1. Check this guide again
2. Review the main README.md
3. Check Supabase logs
4. Check Vercel deployment logs
5. Open an issue in the repository

## Security Notes

- Never commit \`.env.local\` to git
- Keep your SUPABASE_SERVICE_ROLE_KEY secret
- Use Vercel environment variables for production
- Enable Row Level Security (RLS) in Supabase
- Regularly rotate API keys
- Use HTTPS in production (automatic with Vercel)

---

You're all set! Start building with Sentra. 🚀
