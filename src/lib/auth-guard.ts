import type { Whop } from '@/client'
import type { AuthTokens } from '@/types/auth'
import { WhopAuthError } from './errors'

/**
 * Ensure the client is authenticated and return tokens
 *
 * @param client - Whop client instance
 * @returns Auth tokens (guaranteed to be defined)
 * @throws {WhopAuthError} If not authenticated
 *
 * @example
 * ```typescript
 * // In a resource method
 * async function list() {
 *   const tokens = requireAuth(this.client)
 *   // tokens is guaranteed to be defined here
 *   return graphqlRequest('query', {}, tokens)
 * }
 * ```
 */
export function requireAuth(client: Whop): AuthTokens {
	const tokens = client.getTokens()
	if (!tokens) {
		throw new WhopAuthError(
			'Not authenticated. Call auth.verify() first.',
			'NOT_AUTHENTICATED',
		)
	}
	return tokens
}

/**
 * Type guard to check if tokens are present
 *
 * @param tokens - Tokens to check
 * @returns True if tokens are defined
 *
 * @example
 * ```typescript
 * const tokens = client.getTokens()
 * if (hasTokens(tokens)) {
 *   // tokens is AuthTokens here
 * }
 * ```
 */
export function hasTokens(
	tokens: AuthTokens | undefined,
): tokens is AuthTokens {
	return tokens !== undefined && !!tokens.accessToken
}
