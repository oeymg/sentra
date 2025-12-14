# Implementation Plan: Top 5 Social Features for Review Hub

## Overview
Implementing 5 high-impact social media-inspired features to maximize engagement and review conversion:

1. **Photo/Video Upload** - Let users upload media with reviews
2. **Instagram Stories Viewer** - Full-screen swipeable review experience
3. **Social Login** (Google OAuth) - One-click review submission
4. **Share to Stories** - Viral loop for Instagram/social sharing
5. **Double-Tap to Like** - Instagram-style interaction

---

## Current Architecture Analysis

### Existing Infrastructure
- **Supabase**: PostgreSQL + Auth + Storage (not yet configured)
- **Auth**: Supabase Auth (email/password currently)
- **File Storage**: None configured (need to set up Supabase Storage)
- **Reviews Table**: Has fields for video_url, but no media upload support
- **Dependencies**: No OAuth library, no file upload library, no HTML-to-image library

### Database Schema Current State
```sql
-- Reviews table already has some video fields (from previous migration):
has_video boolean default false,
video_url text,
video_platform text,
video_embed_url text,
video_thumbnail_url text

-- Missing: photo/image fields for reviews
```

---

## Feature 1: Photo/Video Upload

### Requirements
- Users can upload photos (JPG/PNG/WEBP) and videos (MP4/MOV) with reviews
- Max file size: 10MB for photos, 50MB for videos
- Display media in Instagram-style gallery
- Store in Supabase Storage

### Implementation Plan

#### Step 1.1: Set Up Supabase Storage Bucket
**File**: Supabase Dashboard (manual step)
- Create bucket: `review-media`
- Set public access policies
- Configure file size limits (10MB photos, 50MB videos)

#### Step 1.2: Database Schema Migration
**File**: `supabase/migrations/20250124_add_review_media.sql`
```sql
-- Add media fields to reviews table
alter table public.reviews
  add column if not exists media_urls text[], -- Array of media URLs
  add column if not exists media_types text[], -- Array of types (image/video)
  add column if not exists has_media boolean default false;

-- Create index for media queries
create index idx_reviews_has_media on public.reviews(has_media) where has_media = true;

-- Storage policies for review media
insert into storage.buckets (id, name, public)
values ('review-media', 'review-media', true);

create policy "Anyone can view review media"
  on storage.objects for select
  using (bucket_id = 'review-media');

create policy "Authenticated users can upload review media"
  on storage.objects for insert
  with check (
    bucket_id = 'review-media'
    and auth.role() = 'authenticated'
  );
```

#### Step 1.3: Install Dependencies
**File**: `package.json`
```bash
npm install react-dropzone @supabase/storage-js
```

#### Step 1.4: Create File Upload Component
**File**: `src/components/review-hub/MediaUploader.tsx`
- React Dropzone for drag-and-drop
- Preview thumbnails
- Upload progress bar
- Multiple file support (up to 5)
- Compression for large images (use browser canvas API)

#### Step 1.5: Create Media Upload API Route
**File**: `src/app/api/reviews/upload-media/route.ts`
```typescript
// Handle file uploads to Supabase Storage
// Return public URLs
// Validate file types and sizes
```

#### Step 1.6: Update Review Submission API
**File**: `src/app/api/reviews/submit/route.ts`
- Accept `mediaUrls` and `mediaTypes` arrays
- Store in database with review

#### Step 1.7: Create Media Gallery Component
**File**: `src/components/review-hub/MediaGallery.tsx`
- Instagram-style grid layout
- Lightbox for full-screen view
- Video player with controls
- Lazy loading for performance

#### Step 1.8: Update Review Hub Page
**File**: `src/app/review/[businessId]/page.tsx`
- Add MediaUploader to review modal
- Display MediaGallery for reviews with media
- Show media count badge on reviews

---

## Feature 2: Instagram Stories Viewer

### Requirements
- Full-screen modal showing reviews as stories
- Swipe left/right to navigate
- Tap to pause, hold to see more
- Progress bars at top
- Auto-advance after 5 seconds

### Implementation Plan

#### Step 2.1: Install Dependencies
**File**: `package.json`
```bash
npm install swiper react-spring use-gesture
```

#### Step 2.2: Create Stories Viewer Component
**File**: `src/components/review-hub/StoriesViewer.tsx`
```typescript
// Full-screen modal (z-50, fixed inset-0)
// Swiper for horizontal navigation
// Touch gestures (swipe, tap, hold)
// Progress bars (animated)
// Auto-advance timer
// Review content display (name, rating, text, media)
// Close button (X top-right)
```

#### Step 2.3: Add Stories Entry Point
**File**: `src/app/review/[businessId]/page.tsx`
- Make story highlights clickable
- Open StoriesViewer at clicked index
- Keyboard navigation (arrow keys, ESC)

---

## Feature 3: Social Login (Google OAuth)

### Requirements
- "Sign in with Google" button
- Auto-fill name, email, profile picture
- Seamless review submission
- Profile picture from Google account

### Implementation Plan

#### Step 3.1: Configure Google OAuth in Supabase
**File**: Supabase Dashboard (manual step)
- Enable Google provider
- Configure OAuth credentials (Google Cloud Console)
- Set redirect URLs

#### Step 3.2: Install Dependencies
**File**: `package.json`
```bash
npm install @supabase/auth-ui-react @supabase/auth-ui-shared
```

#### Step 3.3: Create Social Auth Component
**File**: `src/components/review-hub/SocialAuth.tsx`
```typescript
// Google sign-in button
// Handle OAuth flow
// Return user data (name, email, avatar)
```

#### Step 3.4: Update Review Modal
**File**: `src/app/review/[businessId]/page.tsx`
- Add "Sign in with Google" option
- Auto-fill form fields from OAuth data
- Show profile picture preview
- Option to edit pre-filled data

#### Step 3.5: Update Database Schema
**File**: Migration already handles this via profiles table
- profiles.avatar_url will store Google profile picture

---

## Feature 4: Share to Stories

### Requirements
- Generate beautiful shareable image from review
- Download or copy to clipboard
- Pre-designed templates (Instagram story size: 1080x1920)
- Include business info, review text, rating, QR code
- Trackable UTM links

### Implementation Plan

#### Step 4.1: Install Dependencies
**File**: `package.json`
```bash
npm install html-to-image qrcode
```

#### Step 4.2: Create Story Template Component
**File**: `src/components/review-hub/StoryTemplate.tsx`
```typescript
// Instagram story dimensions (1080x1920)
// Gradient background matching brand
// Business logo
// Review content (name, rating, text snippet)
// QR code to review page
// "Tap to share your review" CTA
```

#### Step 4.3: Create Share API Route
**File**: `src/app/api/reviews/generate-story/route.ts`
```typescript
// Generate QR code with UTM tracking
// Render StoryTemplate to image
// Return base64 image
```

#### Step 4.4: Add Share Button to Reviews
**File**: `src/app/review/[businessId]/page.tsx`
- "Share" button on each review
- Modal showing preview
- Download button (saves PNG)
- Copy to clipboard option
- Share prompt: "Share on Instagram Stories!"

---

## Feature 5: Double-Tap to Like

### Requirements
- Double-tap anywhere on review card to like
- Animated heart pops up in center
- Haptic feedback on mobile
- Heart fills red when liked
- Like counter updates

### Implementation Plan

#### Step 5.1: Add Double-Tap Handler
**File**: `src/app/review/[businessId]/page.tsx`
```typescript
// Detect double-tap (two taps within 300ms)
// Trigger like animation
// Update like state
// Haptic feedback (navigator.vibrate)
```

#### Step 5.2: Create Heart Animation Component
**File**: `src/components/review-hub/LikeAnimation.tsx`
```typescript
// Large heart icon (80px)
// Fade in + scale up animation
// Auto-remove after 1 second
// Position: absolute center of card
```

#### Step 5.3: Update Review Card
**File**: `src/app/review/[businessId]/page.tsx`
- Wrap review content in double-tap detector
- Show LikeAnimation on double-tap
- Prevent text selection on double-tap

---

## Implementation Order & Timeline

### Phase 1: Foundation (Day 1-2)
1. **Supabase Storage Setup** - Configure bucket and policies
2. **Database Migration** - Add media fields
3. **Install Dependencies** - All required packages

### Phase 2: Core Features (Day 3-5)
4. **Photo/Video Upload** - Components + API + UI
5. **Double-Tap to Like** - Quick win, high engagement

### Phase 3: Advanced Features (Day 6-8)
6. **Instagram Stories Viewer** - Full-screen experience
7. **Social Login** - Google OAuth integration

### Phase 4: Viral Loop (Day 9-10)
8. **Share to Stories** - Template generation + sharing

---

## Technical Considerations

### Performance
- **Image Optimization**: Compress uploads using browser Canvas API
- **Lazy Loading**: Load media only when visible (Intersection Observer)
- **CDN**: Supabase Storage is CDN-backed by default
- **Video Thumbnails**: Generate on upload for instant display

### Security
- **File Type Validation**: Server-side MIME type checking
- **Size Limits**: Enforce 10MB photos, 50MB videos
- **Sanitization**: Strip EXIF data from photos
- **Rate Limiting**: Max 5 uploads per review

### UX Improvements
- **Upload Progress**: Show percentage during upload
- **Error Handling**: Clear messages for failed uploads
- **Preview**: Show thumbnails before submission
- **Cropping**: Allow users to crop photos (optional)

### Mobile Optimization
- **Touch Gestures**: Swipe, tap, hold all work smoothly
- **Responsive Images**: Serve appropriate sizes
- **Offline Support**: Queue uploads for retry
- **Haptic Feedback**: Vibrate on interactions

---

## Dependencies Required

```json
{
  "dependencies": {
    // File Upload
    "react-dropzone": "^14.2.3",

    // Stories/Swiper
    "swiper": "^11.0.5",
    "react-spring": "^9.7.3",
    "use-gesture": "^10.3.0",

    // Social Auth (Supabase handles most of it)
    "@supabase/auth-ui-react": "^0.4.7",
    "@supabase/auth-ui-shared": "^0.1.8",

    // Share to Stories
    "html-to-image": "^1.11.11",
    "qrcode": "^1.5.3"
  }
}
```

---

## Testing Plan

### Manual Testing Checklist
- [ ] Upload photo (JPG, PNG, WEBP) - max 10MB
- [ ] Upload video (MP4, MOV) - max 50MB
- [ ] Upload multiple files (up to 5)
- [ ] View media in gallery
- [ ] Open stories viewer from highlights
- [ ] Swipe through stories
- [ ] Sign in with Google
- [ ] Auto-fill review form
- [ ] Generate shareable story image
- [ ] Download story image
- [ ] Double-tap to like review
- [ ] See like animation
- [ ] Like counter updates

### Edge Cases
- [ ] Network failure during upload
- [ ] Invalid file types
- [ ] Files exceeding size limit
- [ ] OAuth failure/cancellation
- [ ] Story generation timeout
- [ ] Mobile touch gesture conflicts

---

## Migration Path

### Existing Data
- Reviews without media: No changes needed
- Video reviews: Will continue to work (separate table)
- New reviews: Can optionally include media

### Backwards Compatibility
- All features are additive (no breaking changes)
- Old reviews display normally
- New media fields are optional

---

## Success Metrics

### Engagement
- **Review submission rate**: +200% (social login reduces friction)
- **Media attachment rate**: 40% of reviews include photos/videos
- **Story shares**: 15% of reviewers share to Instagram
- **Double-tap likes**: 3x more engagement than button clicks

### Technical
- **Upload success rate**: >98%
- **Page load time**: <2s (with lazy loading)
- **Mobile performance**: 60fps animations

---

## Risk Mitigation

### Risks
1. **Storage Costs**: Media uploads increase Supabase storage usage
2. **Abuse**: Spam uploads, inappropriate content
3. **OAuth Issues**: Google login might fail or be blocked
4. **Performance**: Large media files slow page load

### Mitigation
1. **Compression**: Auto-compress on client before upload
2. **Moderation**: Manual review for businesses on Free plan
3. **Fallback**: Keep email/name form as backup
4. **Lazy Loading**: Load media only when visible

---

## Future Enhancements

After initial implementation, consider:
- **AI Image Moderation**: Auto-detect inappropriate content
- **Video Compression**: Server-side video optimization
- **Instagram OAuth**: Direct Instagram login
- **Auto-Import**: Pull Instagram posts as reviews
- **Filters**: Snapchat-style fun filters for photos
- **Remix**: Create video montages from reviews

---

## Questions for User

Before implementation, clarify:
1. **Storage Budget**: What's acceptable monthly cost for Supabase Storage?
2. **Moderation**: Manual review or auto-approve media?
3. **Instagram OAuth**: Have Instagram Business account for API access?
4. **Priority**: Which feature should ship first if timeline is tight?

---

## Ready to Implement

This plan is comprehensive and actionable. Each feature is broken down into:
✅ Specific files to create/modify
✅ Code patterns to follow
✅ Dependencies to install
✅ Testing criteria

**Estimated Total Time**: 8-10 development days for all 5 features

**Recommended Start**: Photo/Video Upload + Double-Tap to Like (highest ROI, fastest implementation)
