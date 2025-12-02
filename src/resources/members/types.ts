/**
 * Member types for the Whop client
 */

/**
 * Discord account info
 */
export interface DiscordAccount {
	username: string
	id: string
}

/**
 * Telegram account info
 */
export interface TelegramAccount {
	telegramUsername: string
	telegramAccountId: string
}

/**
 * Twitter account info
 */
export interface TwitterAccount {
	username: string
}

/**
 * Image srcset for profile images
 */
export interface ImageSrcset {
	original: string
	double: string
}

/**
 * Member user info
 */
export interface MemberUser {
	id: string
	email?: string
	name?: string
	username?: string
	profilePicUrl?: string
	city?: string
	countryName?: string
	stateName?: string
	discord?: DiscordAccount
	telegramAccount?: TelegramAccount
	twitterAccount?: TwitterAccount
}

/**
 * A company member (user who has/had access to a company)
 */
export interface Member {
	id: string
	joinedAt: string
	phone?: string
	bannedAt?: string | null
	imageSrcset?: ImageSrcset
	user: MemberUser
	membershipCount?: number
	totalSpend?: number
	activeAccessPasses?: string[]
}

/**
 * Options for listing members
 */
export interface ListMembersOptions {
	/** Number of items per page */
	first?: number
	/** Pagination cursor */
	after?: string
	/** Search query (email, name, username) */
	query?: string
	/** Only show banned members */
	banned?: boolean
	/** Filter by access pass ID */
	accessPassId?: string
}

/**
 * Paginated member list response
 */
export interface MemberListResponse {
	members: Member[]
	totalCount: number
	pageInfo: {
		endCursor?: string
		hasNextPage: boolean
	}
}

/**
 * Ban result
 */
export interface BanResult {
	id: string
	bannedAt: string
}

/**
 * Unban result
 */
export interface UnbanResult {
	id: string
	bannedAt: null
}
