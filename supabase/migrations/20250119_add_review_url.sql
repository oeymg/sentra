-- Add review_url column to reviews table
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS review_url text;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS reviews_review_url_idx ON public.reviews(review_url);

-- Add comment
COMMENT ON COLUMN public.reviews.review_url IS 'Direct URL to the review on the original platform (Google, Yelp, etc.)';
