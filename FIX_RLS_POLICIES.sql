-- Fix Row Level Security policies for reviews table
-- This allows authenticated users to insert/update reviews for businesses they own

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view reviews for their businesses" ON reviews;
DROP POLICY IF EXISTS "Users can insert reviews for their businesses" ON reviews;
DROP POLICY IF EXISTS "Users can update reviews for their businesses" ON reviews;
DROP POLICY IF EXISTS "Users can delete reviews for their businesses" ON reviews;

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- SELECT policy: Users can view reviews for their own businesses
CREATE POLICY "Users can view reviews for their businesses"
ON reviews FOR SELECT
USING (
  business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  )
);

-- INSERT policy: Users can insert reviews for their own businesses
CREATE POLICY "Users can insert reviews for their businesses"
ON reviews FOR INSERT
WITH CHECK (
  business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  )
);

-- UPDATE policy: Users can update reviews for their own businesses
CREATE POLICY "Users can update reviews for their businesses"
ON reviews FOR UPDATE
USING (
  business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  )
);

-- DELETE policy: Users can delete reviews for their own businesses
CREATE POLICY "Users can delete reviews for their businesses"
ON reviews FOR DELETE
USING (
  business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  )
);
