/**
 * Company types
 */

export interface Company {
	id: string
	title: string
	image: CompanyImage | null
	staticImage: CompanyImage | null
}

export interface CompanyImage {
	original: string
	isVideo: boolean
}

/**
 * App types
 */

export interface App {
	id: string
	name: string
	stats: AppStats
}

export interface AppStats {
	dau: number
	wau: number
	mau: number
	timeSpentLast24HoursInSeconds: number
}

/**
 * Paginated apps response
 */
export interface AppsConnection {
	nodes: App[]
	totalCount: number
	pageInfo: PageInfo
}

export interface PageInfo {
	hasNextPage: boolean
	hasPreviousPage: boolean
	startCursor: string | null
	endCursor: string | null
}

/**
 * Options for listing apps
 */
export interface ListAppsOptions {
	/** Number of apps to fetch from the start */
	first?: number
	/** Number of apps to fetch from the end */
	last?: number
	/** Cursor to paginate forward from */
	after?: string
	/** Cursor to paginate backward from */
	before?: string
}
