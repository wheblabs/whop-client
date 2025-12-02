/**
 * Affiliate type
 */
export type AffiliateType = 'standard' | 'revshare'

/**
 * Affiliate status
 */
export type AffiliateStatus = 'active' | 'pending' | 'disabled'

/**
 * Affiliate user info
 */
export interface AffiliateUser {
	id: string
	header?: string
	username: string
	profilePic?: string
}

/**
 * Company member reference
 */
export interface AffiliateCompanyMember {
	id: string
}

/**
 * Affiliate object
 */
export interface Affiliate {
	id: string
	totalPlanCount: number
	totalOverridesCount: number
	companyMember?: AffiliateCompanyMember
	user: AffiliateUser
	status: AffiliateStatus
	affiliateType: AffiliateType
	totalReferrals: number
	totalReferralEarnings: number
	customerRetention: number
	customerRetention90Days: number
	totalRevenue: number
	mrr: number
	activeMembersCount: number
}

/**
 * Options for listing affiliates
 */
export interface ListAffiliatesOptions {
	/** Company ID */
	companyId: string
	/** Number of affiliates to fetch */
	first?: number
	/** Cursor for pagination */
	after?: string
	/** Filter by status */
	status?: AffiliateStatus
	/** Filter by type */
	affiliateType?: AffiliateType
	/** Search query */
	search?: string
}

/**
 * Paginated affiliates response
 */
export interface AffiliatesConnection {
	affiliates: Affiliate[]
	totalCount: number
}

/**
 * Input for creating a rev-share affiliate
 */
export interface CreateAffiliateInput {
	/** Company ID */
	companyId: string
	/** User ID to add as affiliate */
	userId: string
	/** Affiliate type */
	affiliateType: AffiliateType
	/** Revenue share percentage (0-100) */
	revenueSharePercent?: number
	/** Plan IDs this affiliate can promote */
	planIds?: string[]
}

/**
 * Input for updating an affiliate
 */
export interface UpdateAffiliateInput {
	/** Affiliate ID */
	id: string
	/** Revenue share percentage (0-100) */
	revenueSharePercent?: number
	/** Plan IDs this affiliate can promote */
	planIds?: string[]
	/** Status */
	status?: AffiliateStatus
}

/**
 * External link for affiliate tracking
 */
export interface ExternalLink {
	id: string
	url: string
	title?: string
	clicks: number
	conversions: number
	createdAt: string
}

/**
 * Options for listing external links
 */
export interface ListExternalLinksOptions {
	/** Company ID */
	companyId: string
	/** Number of links to fetch */
	first?: number
	/** Cursor for pagination */
	after?: string
}

/**
 * Input for creating an external link
 */
export interface CreateExternalLinkInput {
	/** Company ID */
	companyId: string
	/** Destination URL */
	url: string
	/** Link title */
	title?: string
	/** Plan ID to track conversions for */
	planId?: string
}

/**
 * Input for updating an external link
 */
export interface UpdateExternalLinkInput {
	/** Link ID */
	id: string
	/** Destination URL */
	url?: string
	/** Link title */
	title?: string
}

/**
 * Affiliate plan details
 */
export interface AffiliatePlan {
	id: string
	title: string
	revenueSharePercent: number
	accessPass: {
		id: string
		title: string
	}
}

/**
 * Rev-share partner
 */
export interface RevSharePartner {
	id: string
	user: AffiliateUser
	revenueSharePercent: number
	totalEarnings: number
	pendingEarnings: number
}
