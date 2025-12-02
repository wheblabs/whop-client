import type { Whop } from '@/client'
import { WhopAuthError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import type {
	CreateInvoiceInput,
	Invoice,
	InvoiceListResponse,
	ListInvoicesOptions,
	VoidInvoiceResult,
} from './types'

export * from './types'

/**
 * Invoices resource for managing invoices
 *
 * @remarks
 * Invoices allow you to bill customers for custom amounts outside
 * of the standard subscription flow.
 *
 * @example
 * ```typescript
 * const whop = new Whop()
 *
 * // List invoices
 * const { invoices } = await whop.invoices.list('biz_xxx')
 *
 * // Create an invoice
 * const invoice = await whop.invoices.create('biz_xxx', {
 *   recipientUserId: 'user_xxx',
 *   amount: 9999, // $99.99 in cents
 *   memo: 'Custom service fee'
 * })
 *
 * // Void an invoice
 * await whop.invoices.void('biz_xxx', 'inv_xxx')
 * ```
 */
export class Invoices {
	constructor(private readonly client: Whop) {}

	/**
	 * List invoices for a company
	 *
	 * @param companyId - Company ID
	 * @param options - List options
	 * @returns Paginated list of invoices
	 */
	async list(
		companyId: string,
		options?: ListInvoicesOptions,
	): Promise<InvoiceListResponse> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
			query fetchCompanyInvoices($id: ID!, $first: Int, $after: String, $status: [String!]) {
				company(id: $id) {
					invoices(first: $first, after: $after, status: $status) {
						nodes {
							id
							createdAt
							dueDate
							status
							formattedAmount
							currency
							memo
							invoiceNumber
							paidAt
							voidedAt
							paymentUrl
							recipient {
								id
								email
								name
								username
							}
							lineItems {
								id
								description
								quantity
								formattedAmount
							}
						}
						totalCount
						pageInfo {
							endCursor
							hasNextPage
						}
					}
				}
			}
		`

		const statusFilter = options?.status
			? Array.isArray(options.status)
				? options.status
				: [options.status]
			: undefined

		const variables = {
			id: companyId,
			first: options?.first ?? 25,
			after: options?.after,
			status: statusFilter,
		}

		const response = await graphqlRequest<{
			company: {
				invoices: {
					nodes: Invoice[]
					totalCount: number
					pageInfo: {
						endCursor?: string
						hasNextPage: boolean
					}
				}
			}
		}>(
			'fetchCompanyInvoices',
			{ query, variables, operationName: 'fetchCompanyInvoices' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		const { nodes, totalCount, pageInfo } = response.company.invoices

		return {
			invoices: nodes,
			totalCount,
			pageInfo,
		}
	}

	/**
	 * Get a specific invoice by ID
	 *
	 * @param invoiceId - Invoice ID
	 * @returns Invoice details
	 */
	async get(invoiceId: string): Promise<Invoice> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
			query fetchInvoice($id: ID!) {
				invoice(id: $id) {
					id
					createdAt
					dueDate
					status
					formattedAmount
					currency
					memo
					invoiceNumber
					paidAt
					voidedAt
					paymentUrl
					recipient {
						id
						email
						name
						username
					}
					lineItems {
						id
						description
						quantity
						formattedAmount
					}
				}
			}
		`

		const variables = { id: invoiceId }

		const response = await graphqlRequest<{
			invoice: Invoice
		}>(
			'fetchInvoice',
			{ query, variables, operationName: 'fetchInvoice' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.invoice
	}

	/**
	 * Create a new invoice
	 *
	 * @param companyId - Company ID
	 * @param input - Invoice details
	 * @returns Created invoice
	 */
	async create(companyId: string, input: CreateInvoiceInput): Promise<Invoice> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
			mutation createInvoice($input: CreateInvoiceInput!) {
				createInvoice(input: $input) {
					id
					createdAt
					dueDate
					status
					formattedAmount
					currency
					memo
					invoiceNumber
					paymentUrl
					recipient {
						id
						email
						name
						username
					}
				}
			}
		`

		const variables = {
			input: {
				companyId,
				recipientUserId: input.recipientUserId,
				amount: input.amount,
				currency: input.currency || 'USD',
				dueDate: input.dueDate,
				memo: input.memo,
				lineItems: input.lineItems,
				planId: input.planId,
			},
		}

		const response = await graphqlRequest<{
			createInvoice: Invoice
		}>(
			'createInvoice',
			{ query: mutation, variables, operationName: 'createInvoice' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.createInvoice
	}

	/**
	 * Void an invoice
	 *
	 * @param companyId - Company ID (for verification)
	 * @param invoiceId - Invoice ID to void
	 * @returns Void result
	 */
	async void(companyId: string, invoiceId: string): Promise<VoidInvoiceResult> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
			mutation voidInvoice($input: VoidInvoiceInput!) {
				voidInvoice(input: $input) {
					id
					voidedAt
					status
				}
			}
		`

		const variables = {
			input: {
				companyId,
				invoiceId,
			},
		}

		const response = await graphqlRequest<{
			voidInvoice: VoidInvoiceResult
		}>(
			'voidInvoice',
			{ query: mutation, variables, operationName: 'voidInvoice' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.voidInvoice
	}

	/**
	 * Send a reminder for an unpaid invoice
	 *
	 * @param invoiceId - Invoice ID
	 * @returns True if reminder was sent
	 */
	async sendReminder(invoiceId: string): Promise<boolean> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
			mutation sendInvoiceReminder($input: SendInvoiceReminderInput!) {
				sendInvoiceReminder(input: $input)
			}
		`

		const variables = {
			input: {
				invoiceId,
			},
		}

		const response = await graphqlRequest<{
			sendInvoiceReminder: boolean
		}>(
			'sendInvoiceReminder',
			{ query: mutation, variables, operationName: 'sendInvoiceReminder' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.sendInvoiceReminder
	}
}
