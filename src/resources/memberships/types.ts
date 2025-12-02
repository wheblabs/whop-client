/**
 * Membership types for the Whop client
 */

/**
 * Membership status
 */
export type MembershipStatus =
	| 'active'
	| 'canceled'
	| 'paused'
	| 'past_due'
	| 'trialing'
	| 'expired'
	| 'completed'

/**
 * Plan type
 */
export type PlanType = 'one_time' | 'renewal' | 'free'

/**
 * Most recent action on a membership
 */
export interface MembershipAction {
	name: string
	timestamp: string
}

/**
 * Plan information for a membership
 */
export interface MembershipPlan {
	id: string
	planType: PlanType
	formattedPrice: string
	free: boolean
	releaseMethod?: string
}

/**
 * Access pass information
 */
export interface AccessPass {
	id: string
	title: string
	route?: string
	name?: string
}

/**
 * Company information
 */
export interface MembershipCompany {
	id: string
	title: string
	ownerUserId?: string
	logo?: {
		sourceUrl: string
	}
}

/**
 * Member user info
 */
export interface MemberUser {
	id: string
	email?: string
	name?: string
	username?: string
	city?: string
	countryName?: string
	stateName?: string
	discord?: {
		username: string
		id: string
	}
	telegramAccount?: {
		telegramUsername: string
		telegramAccountId: string
	}
	twitterAccount?: {
		username: string
	}
}

/**
 * Company member info
 */
export interface CompanyMember {
	id: string
	joinedAt?: string
	phone?: string
	bannedAt?: string | null
	imageSrcset?: {
		original: string
		double: string
	}
	user: MemberUser
}

/**
 * A membership represents a user's subscription/access to a product
 */
export interface Membership {
	id: string
	createdAt: string
	status: MembershipStatus
	cancelAtPeriodEnd?: boolean
	renewalPeriodEnd?: string | null
	expiresAt?: string | null
	trialDaysRemaining?: number
	formattedRenewalPrice?: string
	formattedUpcomingRenewalAmount?: string
	paymentProcessor?: string
	paymentCollectionPaused?: boolean
	renewableNow?: boolean
	licenseKey?: string
	totalSpend?: number
	header?: string
	splitPayCurrentPayments?: number
	splitPayRequiredPayments?: number
	usesBillingEngine?: boolean
	mostRecentAction?: MembershipAction | null
	plan: MembershipPlan
	accessPass: AccessPass
	company?: MembershipCompany
	companyMember?: CompanyMember
	member?: {
		id: string
	}
	actions?: string[]
}

/**
 * Options for listing memberships
 */
export interface ListMembershipsOptions {
	/** Pagination: number of items per page */
	first?: number
	/** Pagination cursor */
	after?: string
	/** Filter by status */
	status?: MembershipStatus | MembershipStatus[]
	/** Filter by access pass ID */
	accessPassId?: string
	/** Search query */
	query?: string
}

/**
 * Paginated membership list response
 */
export interface MembershipListResponse {
	memberships: Membership[]
	totalCount: number
	pageInfo: {
		endCursor?: string
		hasNextPage: boolean
	}
}

/**
 * Options for pausing a membership
 */
export interface PauseMembershipOptions {
	membershipId: string
}

/**
 * Options for resuming a membership
 */
export interface ResumeMembershipOptions {
	membershipId: string
}

/**
 * Options for canceling a membership
 */
export interface CancelMembershipOptions {
	membershipId: string
	/** If true, cancel immediately. If false, cancel at period end */
	immediate?: boolean
	/** Reason for cancellation */
	reason?: string
}

/**
 * Options for transferring a membership
 */
export interface TransferMembershipOptions {
	membershipId: string
	toUserId: string
}

/**
 * Result of a pause/resume operation
 */
export interface PauseResumeResult {
	id: string
	paymentCollectionPaused: boolean
}
