# Review Generation Campaigns - Feature Specification

## Overview
Automated campaigns to request reviews from customers via email/SMS, track responses, and generate more positive reviews.

## Core Features

### 1. Campaign Types
- **Email Campaign**: Send review requests via email
- **SMS Campaign**: Send review requests via SMS (future)
- **QR Code Campaign**: Generate QR codes for in-person review requests

### 2. Campaign Flow
```
Create Campaign → Select Customers → Choose Template → Schedule/Send → Track Results
```

### 3. Key Capabilities

**Campaign Management**:
- Create, edit, pause, resume, delete campaigns
- A/B testing with multiple templates
- Scheduled sending (immediate, scheduled, drip)
- Automated follow-ups for non-responders

**Customer Targeting**:
- Import customer list (CSV)
- Manual entry
- Segment by purchase date, amount, frequency
- Exclude customers who already reviewed

**Review Links**:
- Smart platform selection (Google, Yelp, TripAdvisor, etc.)
- Short URLs with tracking
- One-click review submission
- Mobile-optimized landing pages

**Analytics & Tracking**:
- Email open rates
- Link click rates
- Review completion rates
- Platform distribution
- Response time metrics
- ROI calculation

## Database Schema

### campaigns table
```sql
create table public.campaigns (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references public.businesses(id) on delete cascade not null,
  name text not null,
  description text,
  type text not null check (type in ('email', 'sms', 'qr_code')),
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'active', 'paused', 'completed')),

  -- Template
  subject_line text,
  email_template text,
  sms_template text,

  -- Targeting
  target_platform text, -- 'google', 'yelp', 'tripadvisor', etc.
  review_url text,

  -- Scheduling
  scheduled_at timestamp with time zone,
  send_at_time time, -- e.g., '10:00:00' for 10am sends
  timezone text default 'UTC',

  -- Settings
  enable_followup boolean default false,
  followup_delay_days integer default 3,
  max_followups integer default 2,

  -- Stats
  total_sent integer default 0,
  total_opened integer default 0,
  total_clicked integer default 0,
  total_reviewed integer default 0,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index campaigns_business_id_idx on public.campaigns(business_id);
create index campaigns_status_idx on public.campaigns(status);
```

### campaign_recipients table
```sql
create table public.campaign_recipients (
  id uuid default uuid_generate_v4() primary key,
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  business_id uuid references public.businesses(id) on delete cascade not null,

  -- Customer info
  email text not null,
  name text,
  phone text,

  -- Tracking
  status text not null default 'pending' check (status in ('pending', 'sent', 'opened', 'clicked', 'reviewed', 'bounced', 'unsubscribed')),
  sent_at timestamp with time zone,
  opened_at timestamp with time zone,
  clicked_at timestamp with time zone,
  reviewed_at timestamp with time zone,

  -- Unique tracking token
  tracking_token text unique not null,

  -- Review data
  review_id uuid references public.reviews(id),
  review_platform text,
  review_rating integer,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index campaign_recipients_campaign_id_idx on public.campaign_recipients(campaign_id);
create index campaign_recipients_tracking_token_idx on public.campaign_recipients(tracking_token);
create index campaign_recipients_status_idx on public.campaign_recipients(status);
```

### campaign_events table
```sql
create table public.campaign_events (
  id uuid default uuid_generate_v4() primary key,
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  recipient_id uuid references public.campaign_recipients(id) on delete cascade not null,

  event_type text not null check (event_type in ('sent', 'opened', 'clicked', 'reviewed', 'bounced', 'unsubscribed')),
  event_data jsonb,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index campaign_events_campaign_id_idx on public.campaign_events(campaign_id);
create index campaign_events_recipient_id_idx on public.campaign_events(recipient_id);
create index campaign_events_type_idx on public.campaign_events(event_type);
```

## API Endpoints

### Campaign Management
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns?businessId={id}` - List campaigns
- `GET /api/campaigns/{id}` - Get campaign details
- `PATCH /api/campaigns/{id}` - Update campaign
- `DELETE /api/campaigns/{id}` - Delete campaign
- `POST /api/campaigns/{id}/send` - Send campaign now
- `POST /api/campaigns/{id}/pause` - Pause campaign
- `POST /api/campaigns/{id}/resume` - Resume campaign

### Recipients
- `POST /api/campaigns/{id}/recipients` - Add recipients (CSV upload)
- `GET /api/campaigns/{id}/recipients` - List recipients
- `DELETE /api/campaigns/{id}/recipients/{recipientId}` - Remove recipient

### Tracking
- `GET /api/campaigns/track/{token}/open` - Track email open (pixel)
- `GET /api/campaigns/track/{token}/click` - Track link click (redirect)
- `POST /api/campaigns/track/{token}/review` - Mark as reviewed

### Analytics
- `GET /api/campaigns/{id}/analytics` - Campaign analytics
- `GET /api/campaigns/{id}/export` - Export results (CSV)

## Email Templates

### Template Variables
- `{{customer_name}}` - Customer's name
- `{{business_name}}` - Business name
- `{{review_link}}` - Tracked review link
- `{{unsubscribe_link}}` - Unsubscribe link

### Default Template
```html
Subject: We'd love your feedback, {{customer_name}}!

Hi {{customer_name}},

Thank you for choosing {{business_name}}! We hope you had a great experience.

Would you mind taking 2 minutes to share your feedback? Your review helps us improve and helps others discover us.

[Leave a Review] → {{review_link}}

Thank you for your support!

Best regards,
The {{business_name}} Team

---
Don't want these emails? {{unsubscribe_link}}
```

## UI Pages

### /dashboard/campaigns
- Campaign list (table view)
- Create new campaign button
- Filter by status (All, Active, Scheduled, Completed)
- Quick stats (Total sent, Open rate, Review rate)

### /dashboard/campaigns/new
- Campaign builder wizard:
  1. **Details**: Name, description, platform
  2. **Recipients**: Import CSV or add manually
  3. **Template**: Choose or customize email template
  4. **Schedule**: Send now or schedule
  5. **Review**: Summary before sending

### /dashboard/campaigns/{id}
- Campaign overview dashboard
- Real-time stats
- Recipients table with status
- Timeline of events
- Edit/pause/resume controls

## Implementation Phases

### Phase 1: Core Infrastructure (Day 1-2)
- [ ] Database schema and migrations
- [ ] Campaign CRUD API endpoints
- [ ] Tracking API endpoints
- [ ] Basic campaign list page

### Phase 2: Campaign Builder (Day 3-4)
- [ ] Campaign creation wizard
- [ ] CSV upload for recipients
- [ ] Email template editor
- [ ] Review link generation

### Phase 3: Sending & Tracking (Day 5-6)
- [ ] Email sending with Resend/SendGrid
- [ ] Open tracking (pixel)
- [ ] Click tracking (redirect)
- [ ] Review tracking integration

### Phase 4: Analytics & Polish (Day 7)
- [ ] Campaign analytics dashboard
- [ ] Export functionality
- [ ] A/B testing support
- [ ] Automated follow-ups

## Tech Stack

**Email Sending**:
- **Resend** (recommended) - $20/month, 3000 emails
- **SendGrid** - $20/month, 40k emails
- **AWS SES** - ~$1 per 10k emails

**SMS** (Future):
- **Twilio** - $0.0079 per SMS
- **Plivo** - Similar pricing

**URL Shortening**:
- Custom short domain (campaigns.sentra.app)
- Or use Bitly API

## Success Metrics

- **Campaign Performance**:
  - Open rate: 40-60% (industry standard: 20-30%)
  - Click rate: 15-25% (industry standard: 2-5%)
  - Review completion: 10-20%

- **Business Impact**:
  - Review volume increase: 3-5x
  - Average rating improvement
  - Platform diversification

## Compliance

- **CAN-SPAM Act**: Include unsubscribe link, business address
- **GDPR**: Get consent, allow data deletion
- **CCPA**: Honor opt-out requests
- **TCPA** (for SMS): Explicit consent required

## Future Enhancements

- SMS campaigns
- WhatsApp campaigns
- Multi-step drip campaigns
- Customer segmentation AI
- Sentiment-based follow-ups
- Incentive management (coupons for reviews)
- Integration with POS systems
- Multi-language support
