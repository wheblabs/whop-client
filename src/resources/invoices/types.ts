/**
 * Invoice types for the Whop client
 */

/**
 * Invoice status
 */
export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'voided' | 'overdue'

/**
 * Invoice line item
 */
export interface InvoiceLineItem {
	id: string
	description: string
	quantity: number
	unitPrice: number
	amount: number
	formattedAmount: string
}

/**
 * Invoice recipient info
 */
export interface InvoiceRecipient {
	id: string
	email: string
	name?: string
	username?: string
}

/**
 * An invoice
 */
export interface Invoice {
	id: string
	createdAt: string
	dueDate?: string
	status: InvoiceStatus
	amount: number
	formattedAmount: string
	currency: string
	memo?: string
	invoiceNumber?: string
	paidAt?: string
	voidedAt?: string
	recipient?: InvoiceRecipient
	lineItems?: InvoiceLineItem[]
	paymentUrl?: string
}

/**
 * Options for listing invoices
 */
export interface ListInvoicesOptions {
	/** Number of items per page */
	first?: number
	/** Pagination cursor */
	after?: string
	/** Filter by status */
	status?: InvoiceStatus | InvoiceStatus[]
}

/**
 * Paginated invoice list response
 */
export interface InvoiceListResponse {
	invoices: Invoice[]
	totalCount: number
	pageInfo: {
		endCursor?: string
		hasNextPage: boolean
	}
}

/**
 * Input for creating a new invoice
 */
export interface CreateInvoiceInput {
	/** Recipient user ID */
	recipientUserId: string
	/** Invoice amount in cents */
	amount: number
	/** Currency code (default: USD) */
	currency?: string
	/** Due date (ISO string) */
	dueDate?: string
	/** Invoice memo/description */
	memo?: string
	/** Line items (optional, for itemized invoices) */
	lineItems?: Array<{
		description: string
		quantity: number
		unitPrice: number
	}>
	/** Plan ID to associate the invoice with (optional) */
	planId?: string
}

/**
 * Void invoice result
 */
export interface VoidInvoiceResult {
	id: string
	voidedAt: string
	status: InvoiceStatus
}
