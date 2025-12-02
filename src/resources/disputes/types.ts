/**
 * Dispute status
 */
export type DisputeStatus =
	| 'needs_response'
	| 'under_review'
	| 'won'
	| 'lost'
	| 'charge_refunded'
	| 'warning_needs_response'
	| 'warning_under_review'
	| 'warning_closed'

/**
 * Dispute reason
 */
export type DisputeReason =
	| 'fraudulent'
	| 'duplicate'
	| 'subscription_canceled'
	| 'product_not_received'
	| 'product_unacceptable'
	| 'credit_not_processed'
	| 'general'

/**
 * Dispute user info
 */
export interface DisputeUser {
	id: string
	username: string
	email?: string
	profilePic?: string
}

/**
 * Dispute object
 */
export interface Dispute {
	id: string
	status: DisputeStatus
	reason: DisputeReason
	amount: number
	currency: string
	createdAt: string
	respondBy: string
	receiptId: string
	user: DisputeUser
	isChargeback: boolean
}

/**
 * Options for listing disputes
 */
export interface ListDisputesOptions {
	/** Company ID */
	companyId: string
	/** Number of disputes to fetch */
	first?: number
	/** Cursor for pagination */
	after?: string
	/** Filter by status */
	status?: DisputeStatus
}

/**
 * Paginated disputes response
 */
export interface DisputesConnection {
	disputes: Dispute[]
	totalCount: number
	pageInfo: {
		hasNextPage: boolean
		endCursor: string | null
	}
}

/**
 * Support case status
 */
export type CaseStatus = 'open' | 'pending' | 'resolved' | 'closed'

/**
 * Support case
 */
export interface SupportCase {
	id: string
	subject: string
	status: CaseStatus
	priority: 'low' | 'normal' | 'high' | 'urgent'
	createdAt: string
	updatedAt: string
	user: DisputeUser
	memberships: Array<{
		id: string
		plan: { title: string }
	}>
}

/**
 * Resolution center settings
 */
export interface ResolutionCenterSettings {
	autoRefundDisputes: boolean
	autoRefundLimit: number
	disputeEmailNotifications: boolean
}
