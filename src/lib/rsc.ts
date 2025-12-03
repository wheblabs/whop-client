import type { AuthTokens } from '@/types/auth'
import type { RSCResult } from '@/types/server-actions'
import { buildCookieHeader } from './cookies-builder'

/** Default request timeout in milliseconds (30 seconds) */
const DEFAULT_TIMEOUT_MS = 30_000

/**
 * Parse Next.js RSC (React Server Component) response
 * @param text Raw response text from server action
 * @returns Parsed result or error
 */
export function parseRSCResponse<T>(text: string): RSCResult<T> {
	const match = text.match(/^1:(.+)$/m)

	if (match?.[1]) {
		try {
			const parsed = JSON.parse(match[1]) as T
			return { success: true, data: parsed }
		} catch (e) {
			if (e instanceof Error) {
				return { success: false, error: e.message }
			}
			return { success: false, error: 'Unknown error' }
		}
	}

	return { success: false, error: 'No RSC match found in response' }
}

/**
 * Options for server action requests
 */
export interface ServerActionRequestOptions {
	/** Auth tokens for authenticated requests */
	tokens?: AuthTokens
	/** Request timeout in milliseconds (default: 30000) */
	timeout?: number
}

/**
 * Make a Next.js server action request
 * @param url Target URL (e.g., https://whop.com/login)
 * @param actionId Server action ID from extraction
 * @param fieldsOrBody Form fields as key-value pairs, or raw body string/object
 * @param tokensOrOptions Optional auth tokens or options object (backwards compatible)
 * @returns Raw fetch Response
 */
export async function serverActionRequest(
	url: string,
	actionId: string,
	fieldsOrBody: Array<[string, string]> | string | object,
	tokensOrOptions?: AuthTokens | ServerActionRequestOptions,
): Promise<Response> {
	// Backwards compatibility: accept either tokens directly or options object
	let tokens: AuthTokens | undefined
	let timeout = DEFAULT_TIMEOUT_MS

	if (tokensOrOptions) {
		// Check if it's a tokens object (has accessToken) or options object
		if ('accessToken' in tokensOrOptions) {
			tokens = tokensOrOptions
		} else {
			tokens = tokensOrOptions.tokens
			timeout = tokensOrOptions.timeout ?? DEFAULT_TIMEOUT_MS
		}
	}

	const headers: HeadersInit = {
		'next-action': actionId,
		'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
	}

	let body: string

	// Check if fieldsOrBody is an array (multipart form data)
	if (Array.isArray(fieldsOrBody)) {
		const boundary = `----WhopAuthBoundary${Math.random().toString(36)}`

		// Create multipart body for Next server action request
		const parts = fieldsOrBody.map(
			([name, value]) =>
				`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}`,
		)
		body = `${parts.join('\r\n')}\r\n--${boundary}--`
		headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`
	} else {
		// Raw body (string or object)
		if (typeof fieldsOrBody === 'object') {
			body = JSON.stringify(fieldsOrBody)
			headers['Content-Type'] = 'application/json'
		} else {
			body = fieldsOrBody
			// If it's a string, check if it looks like JSON
			if (
				fieldsOrBody.trim().startsWith('[') ||
				fieldsOrBody.trim().startsWith('{')
			) {
				headers['Content-Type'] = 'application/json'
			}
		}
	}

	if (tokens) {
		headers.Cookie = buildCookieHeader(tokens)
	}

	// Create AbortController for timeout
	const controller = new AbortController()
	const timeoutId = setTimeout(() => controller.abort(), timeout)

	try {
		return await fetch(url, {
			method: 'POST',
			headers,
			body,
			signal: controller.signal,
		})
	} finally {
		clearTimeout(timeoutId)
	}
}
