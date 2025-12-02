/**
 * Transfer types for the Whop client
 */

/**
 * Transfer status
 */
export type TransferStatus =
	| 'pending'
	| 'processing'
	| 'completed'
	| 'failed'
	| 'canceled'

/**
 * Transfer method (how the payout is sent)
 */
export type TransferMethod = 'stripe' | 'paypal' | 'bank' | 'crypto'

/**
 * A transfer/payout
 */
export interface Transfer {
	id: string
	createdAt: string
	completedAt?: string
	status: TransferStatus
	amount: number
	formattedAmount: string
	fee?: number
	formattedFee?: string
	netAmount?: number
	formattedNetAmount?: string
	currency: string
	method?: TransferMethod
	destination?: string
	reference?: string
	periodStart?: string
	periodEnd?: string
	failureReason?: string
}

/**
 * Options for listing transfers
 */
export interface ListTransfersOptions {
	/** Number of items per page */
	first?: number
	/** Pagination cursor */
	after?: string
	/** Filter by status */
	status?: TransferStatus | TransferStatus[]
}

/**
 * Paginated transfer list response
 */
export interface TransferListResponse {
	transfers: Transfer[]
	totalCount: number
	pageInfo: {
		endCursor?: string
		hasNextPage: boolean
	}
}

/**
 * Input for creating a transfer request
 */
export interface CreateTransferInput {
	/** Amount in cents */
	amount: number
	/** Currency code (default: USD) */
	currency?: string
	/** Transfer method */
	method?: TransferMethod
	/** Reference/memo for the transfer */
	reference?: string
}
