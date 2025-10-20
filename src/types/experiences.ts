/**
 * Experience types
 */

export interface ExperienceImageSrcset {
	sourceUrl: string
}

export interface ExperienceApp {
	id: string
	name: string
	icon: {
		sourceUrl: string
	} | null
}

export interface Experience {
	id: string
	name: string
	description: string | null
	logo: ExperienceImageSrcset | null
	app: ExperienceApp
}

/**
 * Paginated experiences response
 */
export interface ExperiencesConnection {
	experiences: Experience[]
	pageInfo: {
		hasNextPage: boolean
		endCursor: string | null
	}
	totalCount: number
}

/**
 * Options for listing experiences
 */
export interface ListExperiencesOptions {
	/** Filter by app ID */
	appId?: string
	/** Filter by access pass ID */
	accessPassId?: string
	/** Filter experiences on access pass */
	onAccessPass?: boolean
	/** Number of experiences to fetch */
	first?: number
	/** Cursor for pagination */
	after?: string
}
