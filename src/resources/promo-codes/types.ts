/**
 * Promo code type
 */
export type PromoType = 'percent' | 'fixed_amount' | 'free_trial'

/**
 * Promo code status
 */
export type PromoCodeStatus = 'active' | 'expired' | 'disabled'

/**
 * Affiliate attached to promo code
 */
export interface PromoCodeAffiliate {
	user: {
		username: string
		profilePic?: string
	}
}

/**
 * Access pass reference for promo code
 */
export interface PromoCodeAccessPass {
	title: string
}

/**
 * Plan reference for promo code
 */
export interface PromoCodePlan {
	accessPass: PromoCodeAccessPass
}

/**
 * Promo code object
 */
export interface PromoCode {
	id: string
	code: string
	numberOfIntervals?: number
	uses: number
	stock?: number
	status: PromoCodeStatus
	expirationDatetime?: string
	createdAt: string
	newUsersOnly: boolean
	unlimitedStock: boolean
	onePerCustomer: boolean
	existingMembershipsOnly: boolean
	amountOff?: string
	promoType: PromoType
	baseCurrency: string
	affiliate?: PromoCodeAffiliate
	plans?: {
		nodes: PromoCodePlan[]
		totalCount: number
	}
}

/**
 * Options for listing promo codes
 */
export interface ListPromoCodesOptions {
	/** Company ID */
	companyId: string
	/** Number of promo codes to fetch */
	first?: number
	/** Cursor for pagination */
	after?: string
	/** Filter by status */
	status?: PromoCodeStatus
	/** Search by code */
	search?: string
}

/**
 * Paginated promo codes response
 */
export interface PromoCodesConnection {
	promoCodes: PromoCode[]
	totalCount: number
	pageInfo: {
		hasNextPage: boolean
		endCursor: string | null
	}
}

/**
 * Input for creating a promo code
 */
export interface CreatePromoCodeInput {
	/** Company ID */
	companyId: string
	/** Promo code string (auto-generated if not provided) */
	code?: string
	/** Type of promo */
	promoType: PromoType
	/** Amount off (for percent or fixed_amount types) */
	amountOff?: number
	/** Number of billing intervals the discount applies */
	numberOfIntervals?: number
	/** Plan IDs to apply this promo to */
	planIds: string[]
	/** Maximum uses (null for unlimited) */
	stock?: number
	/** Expiration date/time */
	expirationDatetime?: string
	/** Only for new users */
	newUsersOnly?: boolean
	/** Unlimited stock */
	unlimitedStock?: boolean
	/** One use per customer */
	onePerCustomer?: boolean
	/** Only for existing memberships */
	existingMembershipsOnly?: boolean
	/** Currency for fixed_amount type */
	baseCurrency?: string
	/** Affiliate ID to attribute */
	affiliateId?: string
}

/**
 * Input for updating a promo code
 */
export interface UpdatePromoCodeInput {
	/** Promo code ID */
	id: string
	/** Promo code string */
	code?: string
	/** Amount off (for percent or fixed_amount types) */
	amountOff?: number
	/** Number of billing intervals the discount applies */
	numberOfIntervals?: number
	/** Maximum uses */
	stock?: number
	/** Expiration date/time */
	expirationDatetime?: string
	/** Only for new users */
	newUsersOnly?: boolean
	/** Unlimited stock */
	unlimitedStock?: boolean
	/** One use per customer */
	onePerCustomer?: boolean
	/** Only for existing memberships */
	existingMembershipsOnly?: boolean
	/** Enable or disable */
	status?: PromoCodeStatus
}

/**
 * Plan option for promo code creation
 */
export interface PromoCodePlanOption {
	id: string
	formattedPrice: string
	accessPass: {
		id: string
		title: string
	}
}
