# CSV Review Import Guide

## Overview
The CSV import feature allows you to bulk upload reviews to your business. Once imported, the AI Summary will automatically analyze all reviews (including the newly imported ones) to generate insights.

## How to Use

1. **Navigate to Dashboard → Reviews**
2. **Select your business** from the dropdown
3. **Click "Import CSV"** button
4. **Upload your CSV file** with the required format
5. **Review results** - you'll see how many reviews were imported and any errors

## CSV Format Requirements

### Required Columns
- `reviewer_name` - The name of the person leaving the review
- `rating` - Rating from 1-5 (integers only)
- `review_text` - The review content/text

### Optional Columns
- `reviewed_at` - Date of the review (ISO format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
- `platform` - Platform name (currently not used, defaults to "Direct")
- `review_url` - Direct URL to the review on the original platform (enables "View on Platform" button)

### Example CSV

```csv
reviewer_name,rating,review_text,reviewed_at,review_url
John Smith,5,"Amazing service! Highly recommend!",2024-01-15,https://www.google.com/maps/reviews/12345
Sarah Johnson,4,"Great experience overall.",2024-01-20,https://www.yelp.com/biz/business/review/67890
Mike Davis,5,"Best service I've received!",2024-02-01,
```

**Note**: The `review_url` is optional. If provided, the "View on Platform" button will open the direct review link.

**Note**: See `docs/sample-reviews-import.csv` for a complete example.

## Important Notes

### Validation Rules
- **Rating**: Must be between 1 and 5
- **All required fields**: Must be present and non-empty
- **File format**: Must be valid CSV with comma separators

### Error Handling
- The import process validates each row individually
- Invalid rows are skipped and reported in the error list
- Valid rows are still imported even if some rows have errors
- You'll receive a detailed report showing:
  - Number of successfully imported reviews
  - List of errors by row number

### After Import
- Reviews will appear immediately in your dashboard
- The **Sentra AI Summary** will automatically include the new reviews
- The AI analyzes up to 100 most recent reviews for the summary
- Page will reload automatically after successful import

## AI Summary Integration

Once you import reviews via CSV, the AI Summary feature will:
- ✅ Automatically fetch and analyze all your reviews
- ✅ Generate a 2-3 sentence engaging summary
- ✅ Extract 3-5 key highlights from the reviews
- ✅ Determine overall sentiment (positive/mixed/negative)
- ✅ Display insights on your public review page

The AI uses the latest 100 reviews, so your imported reviews will be immediately included in the analysis.

## Tips

1. **Export from other platforms**: If you have reviews on Google, Yelp, etc., you can export them and format as CSV
2. **Test with small batch**: Try importing 5-10 reviews first to ensure format is correct
3. **Date format**: Use ISO format (YYYY-MM-DD) for best results
4. **Quotes in text**: Review text with commas should be wrapped in quotes
5. **Character encoding**: Use UTF-8 encoding for special characters

## Security

- ✅ Only business owners can import reviews
- ✅ Authentication required via Supabase
- ✅ Business ownership verified before import
- ✅ Row-level security (RLS) policies enforced
