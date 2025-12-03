import type { AuthTokens } from '../types/auth'

/**
 * Build cookie header string from auth tokens
 *
 * @param tokens - Auth tokens containing access, CSRF, and refresh tokens
 * @returns Cookie header string for HTTP requests
 *
 * @example
 * ```typescript
 * const cookies = buildCookieHeader(tokens)
 * // Returns: "whop-core.access-token=xxx; __Host-whop-core.csrf-token=yyy; ..."
 * ```
 */
export function buildCookieHeader(tokens: AuthTokens): string {
	return [
		`whop-core.access-token=${tokens.accessToken}`,
		`__Host-whop-core.csrf-token=${tokens.csrfToken}`,
		`whop-core.refresh-token=${tokens.refreshToken}`,
		tokens.uidToken ? `whop-core.uid-token=${tokens.uidToken}` : '',
		tokens.ssk ? `whop-core.ssk=${tokens.ssk}` : '',
		tokens.userId ? `whop-core.user-id=${tokens.userId}` : '',
	]
		.filter(Boolean)
		.join('; ')
}
