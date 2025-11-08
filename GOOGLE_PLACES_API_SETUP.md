# Google Places API (New) v1 - Setup Guide

## Overview
Sentra uses the **New Google Places API (v1)** to fetch reviews from Google.

---

## API Endpoint Template

```javascript
const PLACE_ID = 'YOUR_PLACE_ID_HERE'
const API_KEY = 'YOUR_API_KEY_HERE'

const response = await fetch(
  `https://places.googleapis.com/v1/places/${PLACE_ID}`,
  {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'reviews.name,reviews.rating,reviews.text,reviews.publishTime,reviews.authorAttribution',
    },
  }
)

const data = await response.json()
console.log(data.reviews)
```

---

## Required Setup Steps

### 1. Enable the Places API (New)
**This is required!** The new API is separate from the old Places API.

**Enable here:** https://console.cloud.google.com/apis/library/places-backend.googleapis.com

Or search for "Places API (New)" in the Google Cloud Console API Library.

### 2. Create/Configure API Key
- Go to: https://console.cloud.google.com/apis/credentials
- Create a new API key OR use existing one
- **Restrict the API key:**
  - Click "Edit" on your API key
  - Under "API restrictions", select "Restrict key"
  - Check: **Places API (New)**
  - Save

### 3. Add to Environment Variables
```bash
# .env.local
GOOGLE_PLACES_API_KEY=your_api_key_here
NEXT_PUBLIC_GOOGLE_PLACE_ID=your_place_id_here
```

---

## How to Find Your Place ID

### Option 1: Place ID Finder Tool
https://developers.google.com/maps/documentation/places/web-service/place-id

### Option 2: Google Maps
1. Find your business on Google Maps
2. Share the location
3. The Place ID is in the URL or data

### Option 3: Places API Search
```javascript
const response = await fetch(
  `https://places.googleapis.com/v1/places:searchText`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': 'YOUR_API_KEY',
      'X-Goog-FieldMask': 'places.id,places.displayName',
    },
    body: JSON.stringify({
      textQuery: 'Your Business Name, City, State'
    })
  }
)

const data = await response.json()
console.log(data.places[0].id) // Your Place ID
```

---

## Response Structure (New API)

```typescript
{
  reviews: [
    {
      name: "places/ChIJ.../reviews/xyz",
      rating: 5,
      text: {
        text: "Great service!",
        languageCode: "en"
      },
      publishTime: "2025-11-05T10:30:00Z",
      relativePublishTimeDescription: "2 days ago",
      authorAttribution: {
        displayName: "John Doe",
        uri: "https://www.google.com/maps/contrib/...",
        photoUri: "https://lh3.googleusercontent.com/..."
      }
    }
  ]
}
```

---

## Available Field Masks for Reviews

When setting `X-Goog-FieldMask`, you can request:

- `reviews` - Basic review info
- `reviews.name` - Review ID
- `reviews.rating` - Star rating (1-5)
- `reviews.text` - Review text content
- `reviews.publishTime` - When review was posted
- `reviews.relativePublishTimeDescription` - "2 days ago"
- `reviews.authorAttribution` - Reviewer name, photo, profile
- `reviews.originalText` - For translated reviews

**Example:**
```
X-Goog-FieldMask: reviews.name,reviews.rating,reviews.text,reviews.publishTime,reviews.authorAttribution
```

---

## Common Errors

### 403 PERMISSION_DENIED
**Cause:** Places API (New) not enabled
**Fix:** Enable the API at https://console.cloud.google.com/apis/library/places-backend.googleapis.com

### 400 INVALID_ARGUMENT
**Cause:** Invalid Place ID or missing field mask
**Fix:**
- Verify your Place ID is correct
- Make sure `X-Goog-FieldMask` header is set

### 403 API_KEY_INVALID
**Cause:** API key not configured or restricted
**Fix:**
- Check API key is correct
- Make sure "Places API (New)" is enabled for this key

---

## Differences: Old vs New API

| Feature | Old API | New API (v1) |
|---------|---------|--------------|
| Endpoint | `/maps/api/place/details/json` | `/v1/places/{placeId}` |
| Auth | `?key=XXX` query param | `X-Goog-Api-Key` header |
| Fields | `?fields=reviews` | `X-Goog-FieldMask` header |
| Review Structure | `reviews[]` | `reviews[].text.text` |
| Author | `author_name` | `authorAttribution.displayName` |
| Rating | `rating` (number) | `rating` (number 1-5) |

---

## Testing Your Setup

Run this in your terminal to test:

```bash
curl -H "Content-Type: application/json" \
  -H "X-Goog-Api-Key: YOUR_API_KEY" \
  -H "X-Goog-FieldMask: reviews.name,reviews.rating,reviews.text,reviews.authorAttribution" \
  "https://places.googleapis.com/v1/places/YOUR_PLACE_ID"
```

Or test in Sentra:
```bash
curl "http://localhost:3000/api/google-reviews?placeId=YOUR_PLACE_ID"
```

---

## Current Implementation in Sentra

- **Integration file:** `src/lib/integrations/google-reviews.ts`
- **API route:** `src/app/api/google-reviews/route.ts`
- **Frontend:** `src/app/dashboard/reviews/page.tsx`
- **Environment:** `.env.local`

---

## Pricing

The New Places API has usage quotas:
- **Free tier:** First $200/month free
- **Cost:** $0.017 per Place Details request
- **Quota:** Up to ~11,700 free requests/month

**Tip:** Cache reviews in your database to minimize API calls!

---

## Next Steps

1. ✅ Enable Places API (New) in Google Cloud Console
2. ✅ Configure API key restrictions
3. ✅ Add environment variables
4. ✅ Test the API endpoint
5. ⚠️ Consider caching reviews in Supabase
6. ⚠️ Implement OAuth for posting replies (requires Google My Business API)

---

## Documentation Links

- Places API (New) Docs: https://developers.google.com/maps/documentation/places/web-service/place-details
- API Key Setup: https://developers.google.com/maps/documentation/places/web-service/get-api-key
- Place ID Finder: https://developers.google.com/maps/documentation/places/web-service/place-id
- Pricing: https://mapsplatform.google.com/pricing/
