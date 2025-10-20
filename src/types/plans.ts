/**
 * Plan types
 */

export type PlanType = 'one_time' | 'renewal' | 'expiration'
export type Visibility = 'visible' | 'hidden' | 'archived'
export type Currency = 'USD' | 'EUR' | 'GBP' | string
export type ReleaseMethod = 'instant' | 'waitlist' | 'nft_gated'
export type TaxType = string

export interface CustomFieldInput {
	name: string
	required?: boolean
	type?: string
}

export interface AffiliateSettingsInput {
	status?: string
	percentage?: number
}

export interface AttachmentInput {
	directUploadId?: string
	id?: string
}

export interface CreatePlanInput {
	/** Product/access pass ID (required) */
	productId: string
	/** Plan title (required) */
	title: string
	/** Plan type (required) */
	planType: PlanType
	/** Visibility (required) */
	visibility: Visibility
	/** Currency */
	currency?: Currency
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
	offerCancelDiscount: boolean
	cancelDiscountPercentage: number | null
	cancelDiscountIntervals: number | null
}
