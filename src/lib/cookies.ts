import { WhopAuthResponseError } from '@/lib/errors'
import type { AuthTokens } from '@/types/auth'

/**
 * Extract specific cookie value from Set-Cookie header
 */
function parseCookie(
	setCookieHeader: string,
): { name: string; value: string } | null {
	const [cookiePair] = setCookieHeader.split(';')
	if (!cookiePair) return null

	const separatorIndex = cookiePair.indexOf('=')
	if (separatorIndex === -1) return null

	const name = cookiePair.slice(0, separatorIndex).trim()
	const value = cookiePair.slice(separatorIndex + 1).trim()

	return { name, value }
}

/**
 * Extract auth tokens from response Set-Cookie headers
 */
export function extractAuthTokens(response: Response): AuthTokens {
	const cookies = new Map<string, string>()

	// Get Set-Cookie headers (use getSetCookie if available, fallback to parsing)
	const setCookieHeaders =
		typeof response.headers.getSetCookie === 'function'
			? response.headers.getSetCookie()
			: [] // Fallback if needed

	// Parse each Set-Cookie header
	for (const header of setCookieHeaders) {
		const cookie = parseCookie(header)
		if (cookie) {
			cookies.set(cookie.name, cookie.value)
		}
	}

	// Extract required tokens
	const accessToken = cookies.get('whop-core.access-token')
	const csrfToken = cookies.get('__Host-whop-core.csrf-token')
	const refreshToken = cookies.get('whop-core.refresh-token')

	if (!accessToken || !csrfToken || !refreshToken) {
		throw new WhopAuthResponseError(
			'Missing required auth tokens in response',
			{ received: Array.from(cookies.keys()) },
		)
	}

	return {
		accessToken,
		csrfToken,
		refreshToken,
		uidToken: cookies.get('whop-core.uid-token'),
		ssk: cookies.get('whop-core.ssk'),
		userId:
			cookies.get('whop-core.user-id') ?? decodeUserIdFromToken(accessToken),
	}
}

/**
 * Decode userId from JWT token
 */
function decodeUserIdFromToken(token: string): string | undefined {
	try {
		const parts = token.split('.')
		if (parts.length < 2 || !parts[1]) return undefined

		const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
		const padded = base64.padEnd(
			base64.length + ((4 - (base64.length % 4)) % 4),
			'=',
		)
		const payload = JSON.parse(atob(padded))

		return typeof payload?.sub === 'string' ? payload.sub : undefined
	} catch {
		return undefined
	}
}
