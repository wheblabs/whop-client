import type { Whop } from '@/client'

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

		const { graphqlRequest } = await import('@/lib/graphql')

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
}
