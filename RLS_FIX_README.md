# Fixing Row Level Security (RLS) for Reviews

## Problem
You're seeing the error: **"Failed to save reviews"** when syncing reviews from Google or Reddit.

The root cause is Supabase **Row Level Security (RLS)** blocking review inserts.

Error code: `42501` - "new row violates row-level security policy (USING expression) for table reviews"

## Solution

Run the SQL migration in `FIX_RLS_POLICIES.sql` in your Supabase SQL Editor:

### Steps:

1. **Open Supabase Dashboard** → Go to your project

2. **Navigate to SQL Editor** → Click "SQL Editor" in the left sidebar

3. **Paste the SQL** → Copy the contents of `FIX_RLS_POLICIES.sql` and paste into the editor

4. **Run the migration** → Click "Run" button

5. **Verify** → The policies should now allow:
   - ✅ Users can INSERT reviews for businesses they own
   - ✅ Users can UPDATE reviews for businesses they own
   - ✅ Users can SELECT reviews for businesses they own
   - ✅ Users can DELETE reviews for businesses they own

## What the Fix Does

The SQL migration creates proper RLS policies that allow authenticated users to manage reviews for businesses they own:

```sql
-- INSERT policy: Users can insert reviews for their own businesses
CREATE POLICY "Users can insert reviews for their businesses"
ON reviews FOR INSERT
WITH CHECK (
  business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  )
);
```

This ensures:
- Security: Users can only access reviews for their own businesses
- Functionality: Review syncing works correctly
- Compliance: RLS remains enabled for data protection

## Testing

After running the migration:

1. Go to **Dashboard → Platforms**
2. Connect a platform (Google Reviews)
3. Sync should complete successfully
4. Check **Dashboard** to see synced reviews

## Troubleshooting

If you still see errors:

1. **Check RLS is enabled**: `ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;`
2. **Verify policies exist**: Check Supabase Dashboard → Authentication → Policies
3. **Check user authentication**: Ensure you're logged in when syncing
4. **Review logs**: Check browser console and server logs for detailed errors

## Alternative: Service Role (Not Recommended)

You could also disable RLS entirely (NOT recommended for production):

```sql
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
```

⚠️ **Warning**: This removes security protection. Only use for local development/testing.
