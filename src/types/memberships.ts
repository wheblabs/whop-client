/**
 * Membership types
 */

export interface CompanyMember {
	id: string
	joinedAt: string
	phone: string | null
	bannedAt: string | null
	imageSrcset: {
		original: string
		double: string
	} | null
	user: {
		id: string
		email: string
		city: string | null
		name: string | null
		username: string
		countryName: string | null
		stateName: string | null
		discord: {
			username: string
			id: string
		} | null
		telegramAccount: {
			telegramUsername: string
			telegramAccountId: string
		} | null
		tradingViewUsername: string | null
		twitterAccount: {
			username: string
		} | null
		disputesAcrossWhop: number
		reviewsAcrossWhop: number
		usdSpendAcrossWhop: number
		resolutionsAcrossWhop: number
	}
}

export interface MembershipPlan {
	id: string
	planType: string
	formattedPrice: string
}

export interface MembershipAccessPass {
	id: string
	title: string
}

export interface MostRecentAction {
	timestamp: string
	name: string
}

export interface Membership {
	id: string
	createdAt: string
	header: string
	splitPayCurrentPayments: number
	splitPayRequiredPayments: number
	plan: MembershipPlan
	accessPass: MembershipAccessPass
	totalSpend: number
	actions: string[]
	licenseKey: string | null
	renewalPeriodEnd: string | null
	expiresAt: string | null
	companyMember: CompanyMember
	mostRecentAction: MostRecentAction | null
}

export interface MembershipsConnection {
	nodes: Membership[]
	totalCount: number
}

export interface ListMembershipsOptions {
	/** Filters in JSON format */
	filters?: Record<string, unknown>
	/** Number of memberships to fetch */
	first?: number
	/** Cursor for pagination */
	after?: string
}
