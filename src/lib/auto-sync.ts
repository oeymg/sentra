/**
 * Auto-sync utility for seamlessly syncing reviews from connected platforms
 * Triggers background syncs when businesses are added or switched
 */

export interface SyncStatus {
  platform: string
  status: 'pending' | 'syncing' | 'success' | 'error'
  message?: string
  reviewCount?: number
}

export interface AutoSyncResult {
  businessId: string
  businessName: string
  syncs: SyncStatus[]
  totalReviews: number
  success: boolean
}

/**
 * Automatically sync all connected platforms for a business
 * Runs syncs in parallel for better performance
 */
export async function autoSyncBusiness(
  businessId: string,
  onProgress?: (status: SyncStatus) => void
): Promise<AutoSyncResult> {
  const result: AutoSyncResult = {
    businessId,
    businessName: '',
    syncs: [],
    totalReviews: 0,
    success: false,
  }

  try {
    // Fetch business details and connected platforms
    const [businessRes, platformsRes] = await Promise.all([
      fetch(`/api/businesses/${businessId}`),
      fetch(`/api/businesses/${businessId}/platforms`),
    ])

    if (!businessRes.ok || !platformsRes.ok) {
      throw new Error('Failed to fetch business details')
    }

    const business = await businessRes.json()
    const platforms = await platformsRes.json()

    result.businessName = business.name

    // Check if any platforms are connected
    if (!platforms || platforms.length === 0) {
      console.log('[AutoSync] No platforms connected for business:', businessId)
      result.success = true
      return result
    }

    console.log(`[AutoSync] Starting sync for ${platforms.length} platform(s)`)

    // Prepare sync tasks for each platform
    const syncTasks = platforms.map(async (platform: any) => {
      const platformName = platform.platform_name || platform.name
      const platformSlug = platform.platform_slug || platform.slug

      const syncStatus: SyncStatus = {
        platform: platformName,
        status: 'pending',
      }

      result.syncs.push(syncStatus)
      onProgress?.(syncStatus)

      try {
        syncStatus.status = 'syncing'
        syncStatus.message = `Syncing ${platformName} reviews...`
        onProgress?.(syncStatus)

        let response: Response | null = null

        // Determine which sync endpoint to use
        if (platformSlug === 'google') {
          response = await fetch('/api/google-reviews/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ businessId }),
          })
        } else if (platformSlug === 'reddit') {
          response = await fetch('/api/reddit-reviews/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ businessId }),
          })
        } else {
          // Platform not supported yet
          syncStatus.status = 'error'
          syncStatus.message = `${platformName} sync not implemented yet`
          onProgress?.(syncStatus)
          return
        }

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || `${platformName} sync failed`)
        }

        const data = await response.json()
        syncStatus.status = 'success'
        const reviewCount = data.reviewCount || data.reviews?.length || 0
        syncStatus.reviewCount = reviewCount
        syncStatus.message = `Synced ${reviewCount} review(s) from ${platformName}`
        result.totalReviews += reviewCount

        console.log(`[AutoSync] ${platformName}: ${syncStatus.reviewCount} reviews synced`)
        onProgress?.(syncStatus)
      } catch (error) {
        syncStatus.status = 'error'
        syncStatus.message = error instanceof Error ? error.message : `${platformName} sync failed`
        console.error(`[AutoSync] ${platformName} error:`, error)
        onProgress?.(syncStatus)
      }
    })

    // Run all syncs in parallel
    await Promise.all(syncTasks)

    result.success = result.syncs.some((s) => s.status === 'success')
    console.log(`[AutoSync] Complete: ${result.totalReviews} total reviews synced`)

    return result
  } catch (error) {
    console.error('[AutoSync] Failed:', error)
    result.success = false
    return result
  }
}

/**
 * Check if a business needs syncing (hasn't been synced in the last 5 minutes)
 * Uses localStorage to track last sync time per business
 */
export function shouldAutoSync(businessId: string, forceSync = false): boolean {
  if (forceSync) return true

  const lastSyncKey = `last-sync-${businessId}`
  const lastSync = localStorage.getItem(lastSyncKey)

  if (!lastSync) return true

  const lastSyncTime = new Date(lastSync).getTime()
  const now = Date.now()
  const fiveMinutes = 5 * 60 * 1000

  return now - lastSyncTime > fiveMinutes
}

/**
 * Mark a business as synced
 * Updates localStorage with current timestamp
 */
export function markAsSynced(businessId: string): void {
  const lastSyncKey = `last-sync-${businessId}`
  localStorage.setItem(lastSyncKey, new Date().toISOString())
}

/**
 * Convenience function to auto-sync with smart checking
 * Only syncs if needed (hasn't been synced recently)
 */
export async function smartAutoSync(
  businessId: string,
  forceSync = false,
  onProgress?: (status: SyncStatus) => void
): Promise<AutoSyncResult | null> {
  if (!shouldAutoSync(businessId, forceSync)) {
    console.log('[AutoSync] Skipping - synced recently')
    return null
  }

  const result = await autoSyncBusiness(businessId, onProgress)

  if (result.success) {
    markAsSynced(businessId)
  }

  return result
}
