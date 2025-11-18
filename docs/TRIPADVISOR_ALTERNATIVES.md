# TripAdvisor Integration Alternatives

## Current Issue
TripAdvisor has strong anti-scraping measures (403 Forbidden errors). Direct server-side scraping is unreliable and may violate their Terms of Service.

## Recommended Solutions

### 1. **TripAdvisor Content API** (Official - Best)
- **Status**: Requires business partnership
- **Pros**:
  - Official, legal, reliable
  - Full data access
  - No rate limiting issues
- **Cons**:
  - Requires approval process
  - May have costs
- **How to apply**: https://www.tripadvisor.com/developers

### 2. **Manual CSV Import** (Easiest - Immediate)
- **Status**: Can implement today
- **Pros**:
  - Simple, no API issues
  - Business owners can export from TripAdvisor Management Center
  - No scraping concerns
- **Cons**:
  - Manual process
  - Not real-time
- **Implementation**: Add CSV upload feature in Settings page

### 3. **Third-Party Scraping Service** (Reliable)
Options:
- **ScraperAPI** (https://www.scraperapi.com/)
  - $49/month for 100k requests
  - Handles proxies, CAPTCHAs, headers

- **Bright Data** (https://brightdata.com/)
  - Premium service
  - Residential proxies

- **Apify** (https://apify.com/)
  - Pre-built TripAdvisor scrapers
  - $49/month starter

**Example with ScraperAPI**:
```typescript
const response = await fetch(
  `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(tripAdvisorUrl)}`,
  {
    headers: {
      'User-Agent': 'Mozilla/5.0 ...',
    }
  }
)
```

### 4. **Client-Side Fetching** (Experimental)
- Fetch from user's browser instead of server
- Uses user's IP, less likely to be blocked
- Still violates ToS

## Current Implementation Status

✅ **What works now**:
- Settings page has TripAdvisor URL input
- Auto-sync on save
- Claude AI parsing of HTML

⚠️ **What's blocked**:
- Direct server-side fetching (403 Forbidden)
- TripAdvisor detects server requests

## Recommended Next Steps

### Short Term (This Week)
1. **Add CSV Import Feature**
   - Easiest immediate solution
   - Business owners can export reviews from TripAdvisor
   - Upload in Settings page

### Long Term (Production)
1. **Apply for TripAdvisor Content API**
   - Official partnership
   - Most reliable long-term solution

2. **OR use ScraperAPI**
   - $49/month
   - Handles all anti-bot measures
   - Simple integration

## CSV Import Implementation

### 1. Add CSV Upload in Settings
```typescript
<input
  type="file"
  accept=".csv"
  onChange={handleCsvUpload}
  className="..."
/>
```

### 2. Parse CSV
```typescript
const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  const text = await file.text()
  const rows = text.split('\n').map(row => row.split(','))

  // Parse and upload reviews
  const reviews = parseTripadvisorCsv(rows)
  await uploadReviews(reviews)
}
```

### 3. Expected CSV Format
```csv
rating,title,review_text,author,date,response_text,response_date
5,Great experience,Amazing food and service,John D.,2024-01-15,Thank you!,2024-01-16
4,Good but pricey,Food was good but expensive,Jane S.,2024-01-14,,
```

## Legal Considerations

⚠️ **Important**: Web scraping TripAdvisor may violate their Terms of Service:
- TripAdvisor ToS Section 9: "You may not... use any robot, spider, scraper..."
- Could result in IP bans or legal action
- Official API or manual import are safer alternatives

## Decision Matrix

| Solution | Cost | Reliability | Legal | Time to Implement |
|----------|------|-------------|-------|-------------------|
| Official API | Varies | ⭐⭐⭐⭐⭐ | ✅ | 2-4 weeks |
| CSV Import | Free | ⭐⭐⭐⭐ | ✅ | 1 day |
| ScraperAPI | $49/mo | ⭐⭐⭐⭐ | ⚠️ | 1 hour |
| Direct Scraping | Free | ⭐ | ❌ | Done (broken) |

**Recommendation**: Start with **CSV Import** today, apply for **Official API** for long-term.
