/**
 * Plan types
 */

import type {
	AttachmentInput,
	Currency,
	CustomFieldInput,
	PlanType,
	ReleaseMethod,
	Visibility,
} from './shared'

// Re-export shared types for backward compatibility
export type {
	AttachmentInput,
	Currency,
	CustomFieldInput,
	PlanType,
	ReleaseMethod,
	Visibility,
}

export type VisibilityFilter =
	| 'all'
	| 'visible'
	| 'hidden'
	| 'archived'
	| 'not_archived'
export type TaxType = string
export type PlanOrder =
	| 'active_memberships_count'
	| 'affiliates'
	| 'created_at'
	| 'expires_at'
	| 'internal_notes'
export type Direction = 'asc' | 'desc'

export interface AffiliateSettingsInput {
	status?: string
	percentage?: number
}

export interface CreatePlanInput {
	/** Company ID (required) */
	companyId: string
	/** Product/access pass ID (required) */
	productId: string
	/** Plan title (optional) */
	title?: string
	/** Plan type (required) */
	planType: PlanType
	/** Visibility (required) */
	visibility: Visibility
	/** Base currency (e.g., 'USD') */
	baseCurrency?: Currency
	/** Recurring/one-time price */
	renewalPrice?: string
	/** Setup fee */
	initialPrice?: string
	/** Days between charges (for renewal) */
	billingPeriod?: number
	/** Days until expiration (for expiration type) */
	expirationDays?: number
	/** Free trial days */
	trialPeriodDays?: number
	/** Accept card payments */
	cardPayments?: boolean
	/** Accept ACH payments */
	achPayments?: boolean
	/** Accept PayPal */
	paypalAccepted?: boolean
	/** Accept Coinbase Commerce */
	coinbaseCommerceAccepted?: boolean
	/** Accept platform balance */
	platformBalanceAccepted?: boolean
	/** Available quantity */
	stock?: number
	/** Unlimited stock */
	unlimitedStock?: boolean
	/** Plan description */
	description?: string
	/** Custom checkout fields */
	customFields?: CustomFieldInput[]
	/** Release method */
	releaseMethod?: ReleaseMethod
}

export interface UpdatePlanInput {
	/** Plan ID to update (required) */
	id: string
	/** Plan title */
	title?: string
	/** Plan description */
	description?: string
	/** Visibility */
	visibility?: Visibility
	/** Currency */
	currency?: Currency
	/** Recurring/one-time price */
	renewalPrice?: string
	/** Setup fee */
	initialPrice?: string
	/** Days between charges */
	billingPeriod?: number
	/** Days until expiration */
	expirationDays?: number
	/** Free trial days */
	trialPeriodDays?: number
	/** Accept card payments */
	cardPayments?: boolean
	/** Accept ACH payments */
	achPayments?: boolean
	/** Accept PayPal */
	paypalAccepted?: boolean
	/** Accept Coinbase Commerce */
	coinbaseCommerceAccepted?: boolean
	/** Accept platform balance */
	platformBalanceAccepted?: boolean
	/** Available quantity */
	stock?: number
	/** Unlimited stock */
	unlimitedStock?: boolean
	/** Custom checkout fields */
	customFields?: CustomFieldInput[]
	/** Release method */
	releaseMethod?: ReleaseMethod
	/** Make this the default plan */
	setAsDefault?: boolean
	/** Allow multiple quantity purchase */
	allowMultipleQuantity?: boolean
	/** Limit to one per company */
	onePerCompany?: boolean
	/** Custom affiliate settings */
	customAffiliateSettings?: AffiliateSettingsInput
	/** Passholder affiliate settings */
	passholderAffiliateSettings?: AffiliateSettingsInput
	/** Offer cancel discount */
	offerCancelDiscount?: boolean
	/** Cancel discount percentage */
	cancelDiscountPercentage?: number
	/** Cancel discount intervals */
	cancelDiscountIntervals?: number
	/** Post-purchase redirect URL */
	redirectUrl?: string
	/** Payment link description */
	paymentLinkDescription?: string
	/** Internal notes */
	internalNotes?: string
	/** Plan image */
	image?: AttachmentInput
	/** Override tax type */
	overrideTaxType?: TaxType
	/** Short link */
	shortLink?: string
}

export interface CustomField {
	id: string
	fieldType: string
	name: string
	required: boolean
	placeholder: string | null
}

export interface PlanFilters {
	/** Filter by specific product */
	accessPassId?: string
	/** Has affiliates */
	affiliates?: boolean
	/** Has passholder affiliates */
	passholderAffiliate?: boolean
	/** Visibility filter */
	visibility?: VisibilityFilter
	/** Release method filter */
	releaseMethod?: ReleaseMethod
	/** Text search */
	query?: string
	/** What to sort by */
	order?: PlanOrder
	/** Sort direction */
	direction?: Direction
}

export interface ListPlansOptions {
	/** Filter options */
	filter?: PlanFilters
	/** Number of plans to fetch */
	first?: number
}

export interface ListAccessPassPlansOptions {
	/** Number of plans to fetch */
	first?: number
	/** Cursor for pagination */
	after?: string
}

export interface DetailedPlan {
	id: string
	name: string
	visibility: string
	createdAt: string
	directLink: string
	planType: string
	formattedPrice: string
	formattedInitialPrice: string | null
	activeMemberCount: number
	stock: number | null
	unlimitedStock: boolean
	deletable: boolean
	shortLink: string | null
	redirectUrl: string | null
	initialPrice: string | null
	totalSales: number
	releaseMethod: string
	accessPass: {
		id: string
		title: string
	}
	title: string
	baseCurrency: string
	billingPeriod: number | null
	trialPeriodDays: number | null
	renewalPrice: string | null
	expirationDays: number | null
	cancelDiscountIntervals: number | null
	cancelDiscountPercentage: number | null
	internalNotes: string | null
	description: string | null
	customFields: CustomField[]
	cardPayments: boolean
	paypalAccepted: boolean
	coinbaseCommerceAccepted: boolean
	platformBalanceAccepted: boolean
	splititAccepted: boolean
	achPayments: boolean
}

export interface AccessPassPlan {
	id: string
	initialPrice: string | null
	formattedPrice: string
	baseCurrency: string
	expirationDays: number | null
	trialPeriodDays: number | null
	visibility: string
	internalNotes: string | null
	releaseMethod: string
	planType: string
	activeMemberCount: number
}

export interface PlansConnection {
	plans: DetailedPlan[]
}

export interface AccessPassPlansConnection {
	plans: AccessPassPlan[]
	pageInfo: {
		endCursor: string | null
		startCursor?: string | null
		hasNextPage: boolean
	}
}

/**
 * Plan as returned by createPlan/updatePlan mutations
 * Matches the UpsertPlan fragment from fe-monorepo
 */
export interface Plan {
	id: string
	directLink: string
	releaseMethod: string
	visibility: string
	free: boolean
	accessPass: {
		id: string
		route: string
	}
	company: {
		id: string
	}
	initialPrice: string | null
	renewalPrice: string | null
	strikeThroughInitialPrice?: string | null
	strikeThroughRenewalPrice?: string | null
	offerCancelDiscount: boolean
	cancelDiscountPercentage: number | null
	cancelDiscountIntervals: number | null
}
