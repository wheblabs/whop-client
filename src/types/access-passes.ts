/**
 * Access Pass types
 */

export type Visibility = 'visible' | 'hidden' | 'archived'
export type AccessPassType =
	| 'regular'
	| 'app'
	| 'api_only'
	| 'experience_upsell'
export type BusinessType =
	| 'community'
	| 'course'
	| 'coaching'
	| 'saas'
	| 'other'
export type IndustryType = string
export type CustomCta = string
export type GlobalAffiliateStatus = string
export type Currency = 'USD' | 'EUR' | 'GBP' | string
export type PlanType = 'one_time' | 'renewal' | 'expiration'
export type ReleaseMethod = 'instant' | 'waitlist' | 'nft_gated'

export interface AttachmentInput {
	directUploadId?: string
	id?: string
}

export interface AccessPassProductHighlightInput {
	title: string
	description?: string
}

export interface CustomFieldInput {
	name: string
	required?: boolean
	type?: string
}

export interface CompanyOnboardingPlanOptions {
	/** Pricing currency */
	baseCurrency?: Currency
	/** Recurring price */
	renewalPrice?: number
	/** Setup fee or one-time charge */
	initialPrice?: number
	/** Plan type */
	planType?: PlanType
	/** Billing interval in days */
	billingPeriod?: number
	/** Visibility */
	visibility?: Visibility
	/** Release method */
	releaseMethod?: ReleaseMethod
	/** Custom checkout fields */
	customFields?: CustomFieldInput[]
}

export interface CreateAccessPassInput {
	/** Product title (required) */
	title: string
	/** Company ID (required) */
	companyId: string
	/** URL slug (auto-generated from title if not provided) */
	route?: string
	/** Visibility */
	visibility?: Visibility
	/** Subtitle/tagline */
	headline?: string
	/** Full description */
	description?: string
	/** Pitch to customers */
	creatorPitch?: string
	/** Product logo */
	logo?: AttachmentInput
	/** Banner image */
	bannerImage?: AttachmentInput
	/** Additional image URLs */
	imageUrls?: string[]
	/** Access pass type */
	accessPassType?: AccessPassType
	/** Business type */
	businessType?: BusinessType
	/** Industry type */
	industryType?: IndustryType
	/** Marketplace category ID */
	marketplaceCategoryId?: string
	/** Experiences to include */
	experienceIds?: string[]
	/** Apps to auto-install */
	installAppInternalIdentifiers?: string[]
	/** External checkout URL */
	redirectPurchaseUrl?: string
	/** Custom call-to-action */
	customCta?: CustomCta
	/** CTA URL */
	customCtaUrl?: string
	/** Collect shipping at checkout */
	collectShippingAddress?: boolean
	/** Card statement text (5-22 chars) */
	customStatementDescriptor?: string
	/** Show member count */
	showMemberCount?: boolean
	/** Show reviews */
	showReviewsDtc?: boolean
	/** Global affiliate status */
	globalAffiliateStatus?: GlobalAffiliateStatus
	/** Global affiliate percentage */
	globalAffiliatePercentage?: number
	/** Member affiliate status */
	memberAffiliateStatus?: GlobalAffiliateStatus
	/** Member affiliate percentage */
	memberAffiliatePercentage?: number
	/** Auto-generate a plan */
	planOptions?: CompanyOnboardingPlanOptions
	/** Custom metadata */
	metadata?: Record<string, unknown>
	/** Tax code override */
	productTaxCodeId?: string
	/** Feature highlights */
	productHighlights?: AccessPassProductHighlightInput[]
	/** Is this an app product? */
	asApp?: boolean
	/** If api_only type, the app ID */
	generatedByAppId?: string
}

export interface UpdateAccessPassInput {
	/** Access pass ID to update (required) */
	id: string
	/** Product title */
	title?: string
	/** URL slug */
	route?: string
	/** Visibility */
	visibility?: Visibility
	/** Subtitle */
	headline?: string
	/** Full description */
	description?: string
	/** Pitch to customers */
	creatorPitch?: string
	/** Product logo */
	logo?: AttachmentInput
	/** Banner image */
	bannerImage?: AttachmentInput
	/** Business type */
	businessType?: BusinessType
	/** Industry type */
	industryType?: IndustryType
	/** External checkout URL */
	redirectPurchaseUrl?: string
	/** Custom call-to-action */
	customCta?: CustomCta
	/** CTA URL */
	customCtaUrl?: string
	/** Collect shipping at checkout */
	collectShippingAddress?: boolean
	/** Card statement text (5-22 chars) */
	customStatementDescriptor?: string
	/** Show member count */
	showMemberCount?: boolean
	/** Show offers */
	showOffers?: boolean
	/** Show reviews */
	showReviewsDtc?: boolean
	/** Global affiliate status */
	globalAffiliateStatus?: GlobalAffiliateStatus
	/** Global affiliate percentage */
	globalAffiliatePercentage?: number
	/** Member affiliate status */
	memberAffiliateStatus?: GlobalAffiliateStatus
	/** Member affiliate percentage */
	memberAffiliatePercentage?: number
	/** Tax code override */
	productTaxCodeId?: string
	/** Ordering within company */
	position?: number
}

export interface UpdatedAccessPass {
	id: string
	name: string
	visibility: string
	customCta: string | null
	customCtaUrl: string | null
	redirectPurchaseUrl: string | null
	showMemberCount: boolean
	route: string
}

export interface CreatedAccessPass {
	id: string
	route: string
	title: string
	visibility: string
	createdAt: string
	activeMembersCount: number
	defaultPlan: {
		formattedPrice: string
	} | null
}

export interface AccessPass {
	id: string
	title: string
	activeMembersCount: number
	defaultPlan: {
		formattedPrice: string
	} | null
}

/**
 * Paginated access passes response
 */
export interface AccessPassesConnection {
	accessPasses: AccessPass[]
	pageInfo: {
		hasNextPage: boolean
		hasPreviousPage: boolean
		startCursor: string | null
		endCursor: string | null
	}
	totalCount: number
}

/**
 * Options for listing access passes
 */
export interface ListAccessPassesOptions {
	/** Number of items to fetch from start */
	first?: number
	/** Cursor for forward pagination */
	after?: string
	/** Cursor for backward pagination */
	before?: string
}
