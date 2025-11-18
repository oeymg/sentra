-- Add unsubscribed_at column to campaign_recipients table
ALTER TABLE campaign_recipients ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;

-- Create index for faster queries on unsubscribed status
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_unsubscribed
  ON campaign_recipients(status)
  WHERE status = 'unsubscribed';

-- Add comment for documentation
COMMENT ON COLUMN campaign_recipients.unsubscribed_at IS 'Timestamp when the recipient unsubscribed from campaign emails';
