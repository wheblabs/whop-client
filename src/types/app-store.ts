/**
 * App Store types for fetching public apps
 */

export interface PublicApp {
	id: string
	internalIdentifier: string | null
	name: string
	description: string | null
	usingDefaultIcon: boolean
	icon: {
		source: {
			url: string
		}
	} | null
	totalInstalls: number
	totalInstallsLast30Days: number
	stats: {
		dau: number
		timeSpentLast24HoursInSeconds: number
	}
	status: 'live' | 'unlisted' | 'hidden'
	discoverableAt: number
	creator: {
		id: string
		name: string
		username: string
		roles: string[]
		profilePicture: {
			source: {
				url: string
			}
		} | null
	}
}

export interface AppStoreResponse {
	nodes: PublicApp[]
	totalCount: number
	pageInfo: {
		hasNextPage: boolean
		endCursor: string | null
	}
}

export type AppOrder =
	| 'total_installs_last_30_days'
	| 'time_spent_last_24_hours'
	| 'discoverable_at'
	| 'daily_active_users'

export type AppViewType =
	| 'hub'
	| 'dashboard'
	| 'discover'
	| 'analytics'
	| 'dash'

export interface QueryAppStoreOptions {
	/** Number of apps to fetch per page (default: 20) */
	first?: number
	/** Cursor for pagination (from pageInfo.endCursor) */
	after?: string
	/** Sort order */
	orderBy?: AppOrder
	/** Marketplace category route ID (e.g., 'ai', 'community', 'business-productivity') */
	category?: string
	/** Search query string */
	query?: string
	/** View type context */
	viewType?: AppViewType
}
