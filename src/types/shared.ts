/**
 * Shared types used across multiple resources
 */

export type PlanType = 'one_time' | 'renewal' | 'expiration'
export type Visibility = 'visible' | 'hidden' | 'archived'
export type Currency = 'USD' | 'EUR' | 'GBP' | string
export type ReleaseMethod = 'instant' | 'waitlist' | 'nft_gated'

export interface CustomFieldInput {
	name: string
	required?: boolean
	type?: string
}

export interface AttachmentInput {
	directUploadId?: string
	id?: string
}
