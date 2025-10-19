import type { AuthTokens } from '../types/auth'
import { extractAuthTokens } from './cookies'
import { WhopHTTPError, WhopNetworkError } from './errors'

/**
 * GraphQL request options
 */
export interface GraphQLRequestOptions {
	query: string
	variables?: Record<string, unknown>
	operationName?: string
}

/**
 * GraphQL response wrapper
 */
export interface GraphQLResponse<T> {
	data?: T
	errors?: Array<{
		message: string
		locations?: Array<{ line: number; column: number }>
		path?: string[]
	}>
}

/**
 * Callback to update tokens when they're refreshed
 */
export type TokenUpdateCallback = (newTokens: AuthTokens) => void

/**
 * Make a GraphQL request to Whop's API
 *
 * @param operationName - GraphQL operation name (used in URL)
 * @param options - Query, variables, etc.
 * @param tokens - Auth tokens for authentication
 * @param onTokenRefresh - Optional callback when tokens are refreshed
 * @returns Parsed GraphQL response
 * @throws {WhopNetworkError} On network failures
 * @throws {WhopHTTPError} On HTTP errors
 */
export async function graphqlRequest<T>(
	operationName: string,
	options: GraphQLRequestOptions,
	tokens: AuthTokens,
	onTokenRefresh?: TokenUpdateCallback,
): Promise<T> {
	const url = `https://whop.com/api/graphql/${operationName}/`

	let response: Response
	try {
		// Build cookie string from tokens (like browser does)
		const cookieString = [
			`whop-core.access-token=${tokens.accessToken}`,
			`__Host-whop-core.csrf-token=${tokens.csrfToken}`,
			`whop-core.refresh-token=${tokens.refreshToken}`,
			tokens.uidToken ? `whop-core.uid-token=${tokens.uidToken}` : '',
			tokens.ssk ? `whop-core.ssk=${tokens.ssk}` : '',
			tokens.userId ? `whop-core.user-id=${tokens.userId}` : '',
		]
			.filter(Boolean)
			.join('; ')

		response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: cookieString,
				'User-Agent':
					'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
				Origin: 'https://whop.com',
				Referer: 'https://whop.com/dashboard/',
			},
			body: JSON.stringify({
				query: options.query,
				variables: options.variables || {},
				operationName: options.operationName,
			}),
		})
	} catch (error) {
		throw new WhopNetworkError(
			`Network error during GraphQL request to ${operationName}`,
			url,
			undefined,
			error as Error,
		)
	}

	// Check for refreshed tokens in Set-Cookie headers
	try {
		const refreshedTokens = extractAuthTokens(response)
		if (refreshedTokens && onTokenRefresh) {
			onTokenRefresh(refreshedTokens)
		}
	} catch {
		// Ignore extraction errors - not all responses will have new tokens
	}

	// Check HTTP status
	if (!response.ok) {
		const body = await response.text()
		throw new WhopHTTPError(
			`GraphQL request failed with HTTP ${response.status}`,
			url,
			response.status,
			body,
		)
	}

	// Parse JSON response
	let data: GraphQLResponse<T>
	try {
		data = await response.json()
	} catch (_error) {
		throw new WhopHTTPError(
			'Failed to parse GraphQL response as JSON',
			url,
			response.status,
			await response.text(),
		)
	}

	// Check for GraphQL errors
	if (data.errors && data.errors.length > 0) {
		const errorMessages = data.errors.map((e) => e.message).join(', ')
		throw new WhopHTTPError(
			`GraphQL errors: ${errorMessages}`,
			url,
			response.status,
			JSON.stringify(data.errors),
		)
	}

	// Return data (GraphQL always wraps in "data" field)
	if (!data.data) {
		throw new WhopHTTPError(
			'GraphQL response missing data field',
			url,
			response.status,
			JSON.stringify(data),
		)
	}

	return data.data
}
