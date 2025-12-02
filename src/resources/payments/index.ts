import type { Whop } from '@/client'
import { WhopAuthError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'

/**
 * Response type for createCheckoutSession
 */
export interface CreateCheckoutSessionResponse {
	id: string
	url: string
}

/**
 * Options for creating a checkout session
 */
export interface CreateCheckoutSessionOptions {
	planId: string
	metadata?: Record<string, string>
	// Server-side options (required for server-side operations)
	apiKey?: string
	companyId?: string
	onBehalfOfUserId?: string
}

/**
 * Payment status type
 */
export type PaymentStatus =
	| 'paid'
	| 'pending'
	| 'failed'
	| 'refunded'
	| 'voided'
	| 'disputed'

/**
 * Payment/Receipt details
 */
export interface Payment {
	id: string
	createdAt: string
	status: PaymentStatus
	amount: number
	formattedAmount: string
	paymentMethod?: string
	currency?: string
	refundedAt?: string
	voidedAt?: string
	disputedAt?: string
	user?: {
		id: string
		email?: string
		username?: string
		name?: string
	}
	membership?: {
		id: string
		status: string
	}
	plan?: {
		id: string
		title?: string
		planType?: string
	}
	accessPass?: {
		id: string
		title: string
	}
	company?: {
		id: string
		title: string
	}
	shipment?: {
		id: string
		status: string
		trackingUrl?: string
	}
}

/**
 * Options for listing payments
 */
export interface ListPaymentsOptions {
	/** Number of items per page */
	first?: number
	/** Pagination cursor */
	after?: string
	/** Filter by status */
	status?: PaymentStatus | PaymentStatus[]
	/** Search query */
	query?: string
	/** Filter by plan ID */
	planId?: string
	/** Filter by access pass ID */
	accessPassId?: string
	/** Only show refunded payments */
	refunded?: boolean
}

/**
 * Paginated payment list response
 */
export interface PaymentListResponse {
	payments: Payment[]
	totalCount: number
	pageInfo: {
		endCursor?: string
		hasNextPage: boolean
	}
}

/**
 * Receipt (alias for payment in user context)
 */
export interface Receipt {
	id: string
	createdAt: string
	status: string
	amount: number
	formattedAmount: string
	plan?: {
		id: string
		title?: string
	}
	accessPass?: {
		id: string
		title: string
	}
	company?: {
		id: string
		title: string
	}
}

/**
 * Refund result
 */
export interface RefundResult {
	id: string
	refundedAt: string
	status: PaymentStatus
}

/**
 * Retry result
 */
export interface RetryResult {
	id: string
	status: PaymentStatus
}

/**
 * Payments resource for creating checkout sessions
 *
 * For server-side operations, provide apiKey, companyId, and onBehalfOfUserId.
 * For client-side operations, authenticate with user tokens first.
 */
export class Payments {
	constructor(private readonly client: Whop) {}

	/**
	 * Create a checkout session for a plan
	 *
	 * @param options - Checkout session options
	 * @param options.planId - The plan ID to create checkout for
	 * @param options.metadata - Optional metadata to attach to the checkout session
	 * @param options.apiKey - API key for server-side operations (required for server-side)
	 * @param options.companyId - Company ID (required with apiKey)
	 * @param options.onBehalfOfUserId - User ID to act on behalf of (required with apiKey)
	 * @returns Checkout session with URL and ID
	 *
	 * @example
	 * **Server-side (with API key):**
	 * ```typescript
	 * const whop = new Whop()
	 * const session = await whop.payments.createCheckoutSession({
	 *   planId: 'plan_xxx',
	 *   metadata: { userId: '123', tier: 'pro' },
	 *   apiKey: process.env.WHOP_API_KEY,
	 *   companyId: process.env.WHOP_COMPANY_ID,
	 *   onBehalfOfUserId: process.env.WHOP_AGENT_USER_ID
	 * })
	 * ```
	 *
	 * @example
	 * **Client-side (with user tokens):**
	 * ```typescript
	 * const whop = new Whop()
	 * await whop.auth.verify({ code, ticket })
	 *
	 * const session = await whop.payments.createCheckoutSession({
	 *   planId: 'plan_xxx',
	 *   metadata: { userId: '123', tier: 'pro' }
	 * })
	 * ```
	 */
	async createCheckoutSession(
		options: CreateCheckoutSessionOptions,
	): Promise<CreateCheckoutSessionResponse> {
		// Server-side: Use API key authentication with REST API
		if (options.apiKey) {
			if (!options.companyId || !options.onBehalfOfUserId) {
				throw new Error(
					'companyId and onBehalfOfUserId are required when using apiKey for server-side operations',
				)
			}

			// Use REST API endpoint (matching @whop/api SDK behavior)
			const requestBody = {
				plan_id: options.planId,
				metadata: options.metadata || {},
			}

			console.log('[payments] Creating checkout session:', {
				url: 'https://api.whop.com/api/v2/checkout_sessions',
				companyId: options.companyId,
				onBehalfOfUserId: options.onBehalfOfUserId,
				planId: options.planId,
				hasApiKey: !!options.apiKey,
			})

			const response = await fetch(
				'https://api.whop.com/api/v2/checkout_sessions',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${options.apiKey}`,
						'X-Company-Id': options.companyId,
						'X-On-Behalf-Of-User-Id': options.onBehalfOfUserId,
					},
					body: JSON.stringify(requestBody),
				},
			)

			if (!response.ok) {
				const errorText = await response.text()
				let errorMessage = `Failed to create checkout session: ${response.status} ${response.statusText}`
				try {
					const errorData = JSON.parse(errorText)
					console.error(
						'[payments] API error response:',
						JSON.stringify(errorData, null, 2),
					)
					if (errorData.message) {
						errorMessage = errorData.message
					} else if (errorData.error) {
						if (typeof errorData.error === 'string') {
							errorMessage = errorData.error
						} else if (errorData.error.message) {
							errorMessage = errorData.error.message
						} else {
							errorMessage = JSON.stringify(errorData.error)
						}
					} else if (errorData.detail) {
						errorMessage = errorData.detail
					} else {
						errorMessage += ` - ${JSON.stringify(errorData)}`
					}
				} catch (_parseError) {
					console.error('[payments] Failed to parse error response:', errorText)
					if (errorText) {
						errorMessage += ` - ${errorText.substring(0, 200)}`
					}
				}
				throw new Error(errorMessage)
			}

			const data = await response.json()

			// Handle different response formats
			if (data.checkout_session) {
				return {
					id: data.checkout_session.id,
					url: data.checkout_session.url,
				}
			}
			if (data.id && data.url) {
				return {
					id: data.id,
					url: data.url,
				}
			}
			// Handle format: { id, purchase_url, ... }
			if (data.id && data.purchase_url) {
				return {
					id: data.id,
					url: data.purchase_url,
				}
			}
			// Handle format: { id, redirect_url, ... }
			if (data.id && data.redirect_url) {
				return {
					id: data.id,
					url: data.redirect_url,
				}
			}
			// If we have an id but no URL, try to construct one or use the id
			if (data.id) {
				console.warn(
					'[payments] Response has id but no URL field. Available fields:',
					Object.keys(data),
				)
				// Try to construct URL from plan_id if available
				if (data.plan_id) {
					return {
						id: data.id,
						url: `https://whop.com/checkout/${data.plan_id}/?session=${data.id}`,
					}
				}
				// Fallback: return id and let caller handle URL construction
				return {
					id: data.id,
					url: `https://whop.com/checkout/?session=${data.id}`,
				}
			}

			throw new Error(`Unexpected response format: ${JSON.stringify(data)}`)
		}

		// Client-side: Use user token authentication
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new Error(
				'Not authenticated. Either call auth.verify() first or provide apiKey for server-side operations.',
			)
		}

		const mutation = `
			mutation createCheckoutSession($input: CreateCheckoutSessionInput!) {
				createCheckoutSession(input: $input) {
					id
					url
				}
			}
		`

		const variables = {
			input: {
				planId: options.planId,
				metadata: options.metadata || {},
			},
		}

		const response = await graphqlRequest<{
			createCheckoutSession: CreateCheckoutSessionResponse
		}>(
			'createCheckoutSession',
			{
				query: mutation,
				variables,
				operationName: 'createCheckoutSession',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.createCheckoutSession
	}

	/**
	 * List payments/receipts for a company
	 *
	 * @param companyId - Company ID
	 * @param options - List options
	 * @returns Paginated list of payments
	 *
	 * @example
	 * ```typescript
	 * const { payments } = await whop.payments.list('biz_xxx')
	 *
	 * // With filters
	 * const { payments } = await whop.payments.list('biz_xxx', {
	 *   status: 'paid',
	 *   first: 50
	 * })
	 * ```
	 */
	async list(
		companyId: string,
		options?: ListPaymentsOptions,
	): Promise<PaymentListResponse> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
			query fetchCompanyPayments($id: ID!, $filters: JSON!, $first: Int, $after: String) {
				company(id: $id) {
					creatorDashboardTable(tableFilters: $filters) {
						receipts(first: $first, after: $after) {
							nodes {
								id
								createdAt
								formattedPrice
								chargebackAt
								refundedAt
								paymentMethod
								mostRecentAction {
									name
									timestamp
								}
								member {
									id
									email
									name
									username
								}
								plan {
									id
									title
									planType
								}
								accessPass {
									id
									title
								}
								shipment {
									id
									status
									labelTrackingUrl
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
			}
		`

		// Build filters object
		const filters: Record<string, unknown> = {}
		if (options?.status) {
			filters.status = Array.isArray(options.status)
				? options.status
				: [options.status]
		}
		if (options?.query) {
			filters.query = options.query
		}
		if (options?.planId) {
			filters.planId = options.planId
		}
		if (options?.accessPassId) {
			filters.accessPassId = options.accessPassId
		}
		if (options?.refunded !== undefined) {
			filters.refunded = options.refunded
		}

		const variables = {
			id: companyId,
			filters,
			first: options?.first ?? 25,
			after: options?.after,
		}

		const response = await graphqlRequest<{
			company: {
				creatorDashboardTable: {
					receipts: {
						nodes: Array<{
							id: string
							createdAt: string
							formattedPrice: string
							chargebackAt?: string
							refundedAt?: string
							paymentMethod?: string
							mostRecentAction?: {
								name: string
								timestamp: string
							}
							member?: {
								id: string
								email?: string
								name?: string
								username?: string
							}
							plan?: {
								id: string
								title?: string
								planType?: string
							}
							accessPass?: {
								id: string
								title: string
							}
							shipment?: {
								id: string
								status: string
								labelTrackingUrl?: string
							}
						}>
						totalCount: number
						pageInfo: {
							endCursor?: string
							hasNextPage: boolean
						}
					}
				}
			}
		}>(
			'fetchCompanyPayments',
			{ query, variables, operationName: 'fetchCompanyPayments' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		const { nodes, totalCount, pageInfo } =
			response.company.creatorDashboardTable.receipts

		// Transform nodes to Payment type
		const payments: Payment[] = nodes.map((node) => ({
			id: node.id,
			createdAt: node.createdAt,
			status: node.refundedAt
				? 'refunded'
				: node.chargebackAt
					? 'disputed'
					: ('paid' as PaymentStatus),
			amount: 0, // Amount would need parsing from formattedPrice
			formattedAmount: node.formattedPrice,
			paymentMethod: node.paymentMethod,
			refundedAt: node.refundedAt,
			disputedAt: node.chargebackAt,
			user: node.member
				? {
						id: node.member.id,
						email: node.member.email,
						username: node.member.username,
						name: node.member.name,
					}
				: undefined,
			plan: node.plan,
			accessPass: node.accessPass,
			shipment: node.shipment
				? {
						id: node.shipment.id,
						status: node.shipment.status,
						trackingUrl: node.shipment.labelTrackingUrl,
					}
				: undefined,
		}))

		return {
			payments,
			totalCount,
			pageInfo,
		}
	}

	/**
	 * Get a specific payment/receipt by ID
	 *
	 * @param receiptId - Receipt ID
	 * @returns Payment details
	 */
	async get(receiptId: string): Promise<Payment> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
			query fetchReceipt($id: ID!) {
				receipt(id: $id) {
					id
					createdAt
					formattedPrice
					chargebackAt
					refundedAt
					voidedAt
					paymentMethod
					currency
					member {
						id
						email
						name
						username
					}
					membership {
						id
						status
					}
					plan {
						id
						title
						planType
					}
					accessPass {
						id
						title
					}
					company {
						id
						title
					}
					shipment {
						id
						status
						labelTrackingUrl
					}
				}
			}
		`

		const variables = { id: receiptId }

		const response = await graphqlRequest<{
			receipt: {
				id: string
				createdAt: string
				formattedPrice: string
				chargebackAt?: string
				refundedAt?: string
				voidedAt?: string
				paymentMethod?: string
				currency?: string
				member?: {
					id: string
					email?: string
					name?: string
					username?: string
				}
				membership?: {
					id: string
					status: string
				}
				plan?: {
					id: string
					title?: string
					planType?: string
				}
				accessPass?: {
					id: string
					title: string
				}
				company?: {
					id: string
					title: string
				}
				shipment?: {
					id: string
					status: string
					labelTrackingUrl?: string
				}
			}
		}>(
			'fetchReceipt',
			{ query, variables, operationName: 'fetchReceipt' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		const r = response.receipt
		let status: PaymentStatus = 'paid'
		if (r.voidedAt) status = 'voided'
		else if (r.refundedAt) status = 'refunded'
		else if (r.chargebackAt) status = 'disputed'

		return {
			id: r.id,
			createdAt: r.createdAt,
			status,
			amount: 0,
			formattedAmount: r.formattedPrice,
			paymentMethod: r.paymentMethod,
			currency: r.currency,
			refundedAt: r.refundedAt,
			voidedAt: r.voidedAt,
			disputedAt: r.chargebackAt,
			user: r.member
				? {
						id: r.member.id,
						email: r.member.email,
						username: r.member.username,
						name: r.member.name,
					}
				: undefined,
			membership: r.membership,
			plan: r.plan,
			accessPass: r.accessPass,
			company: r.company,
			shipment: r.shipment
				? {
						id: r.shipment.id,
						status: r.shipment.status,
						trackingUrl: r.shipment.labelTrackingUrl,
					}
				: undefined,
		}
	}

	/**
	 * Refund a payment
	 *
	 * @param receiptId - Receipt ID to refund
	 * @param amount - Optional partial refund amount (cents). If not provided, full refund.
	 * @returns Refund result
	 */
	async refund(receiptId: string, amount?: number): Promise<RefundResult> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
			mutation refundReceipt($input: RefundReceiptInput!) {
				refundReceipt(input: $input) {
					id
					refundedAt
				}
			}
		`

		const variables = {
			input: {
				receiptId,
				...(amount !== undefined && { amount }),
			},
		}

		const response = await graphqlRequest<{
			refundReceipt: {
				id: string
				refundedAt: string
			}
		}>(
			'refundReceipt',
			{ query: mutation, variables, operationName: 'refundReceipt' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return {
			id: response.refundReceipt.id,
			refundedAt: response.refundReceipt.refundedAt,
			status: 'refunded',
		}
	}

	/**
	 * Retry a failed payment
	 *
	 * @param receiptId - Receipt ID to retry
	 * @returns Retry result
	 */
	async retry(receiptId: string): Promise<RetryResult> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
			mutation retryPayment($input: RetryPaymentInput!) {
				retryPayment(input: $input) {
					id
					status
				}
			}
		`

		const variables = {
			input: {
				receiptId,
			},
		}

		const response = await graphqlRequest<{
			retryPayment: {
				id: string
				status: PaymentStatus
			}
		}>(
			'retryPayment',
			{ query: mutation, variables, operationName: 'retryPayment' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.retryPayment
	}

	/**
	 * Void a payment (cancel before processing)
	 *
	 * @param receiptId - Receipt ID to void
	 * @returns Updated payment with voided status
	 */
	async void(receiptId: string): Promise<Payment> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
			mutation voidReceipt($input: VoidReceiptInput!) {
				voidReceipt(input: $input) {
					id
					voidedAt
				}
			}
		`

		const variables = {
			input: {
				receiptId,
			},
		}

		const response = await graphqlRequest<{
			voidReceipt: {
				id: string
				voidedAt: string
			}
		}>(
			'voidReceipt',
			{ query: mutation, variables, operationName: 'voidReceipt' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return {
			id: response.voidReceipt.id,
			createdAt: '',
			status: 'voided',
			amount: 0,
			formattedAmount: '',
			voidedAt: response.voidReceipt.voidedAt,
		}
	}

	/**
	 * List receipts for the current user
	 *
	 * @param options - List options
	 * @returns User's receipts
	 */
	async listReceipts(options?: {
		first?: number
		after?: string
		companyId?: string
		excludeFree?: boolean
	}): Promise<{ receipts: Receipt[]; totalCount: number }> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
			query fetchMyReceipts($companyId: ID, $first: Int, $after: String, $excludeFree: Boolean) {
				viewer {
					user {
						receipts(companyId: $companyId, first: $first, after: $after, excludeFree: $excludeFree) {
							nodes {
								id
								createdAt
								formattedPrice
								plan {
									id
									title
								}
								accessPass {
									id
									title
								}
								company {
									id
									title
								}
							}
							totalCount
						}
					}
				}
			}
		`

		const variables = {
			first: options?.first ?? 25,
			after: options?.after,
			companyId: options?.companyId,
			excludeFree: options?.excludeFree ?? true,
		}

		const response = await graphqlRequest<{
			viewer: {
				user: {
					receipts: {
						nodes: Array<{
							id: string
							createdAt: string
							formattedPrice: string
							plan?: {
								id: string
								title?: string
							}
							accessPass?: {
								id: string
								title: string
							}
							company?: {
								id: string
								title: string
							}
						}>
						totalCount: number
					}
				}
			}
		}>(
			'fetchMyReceipts',
			{ query, variables, operationName: 'fetchMyReceipts' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		const { nodes, totalCount } = response.viewer.user.receipts

		const receipts: Receipt[] = nodes.map((node) => ({
			id: node.id,
			createdAt: node.createdAt,
			status: 'paid',
			amount: 0,
			formattedAmount: node.formattedPrice,
			plan: node.plan,
			accessPass: node.accessPass,
			company: node.company,
		}))

		return { receipts, totalCount }
	}
}
