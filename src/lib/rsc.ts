import type { RSCResult } from '@/types/server-actions'

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
 * Make a Next.js server action request
 * @param url Target URL (e.g., https://whop.com/login)
 * @param actionId Server action ID from extraction
 * @param fields Form fields as key-value pairs
 * @returns Raw fetch Response
 */
export async function serverActionRequest(
	url: string,
	actionId: string,
	fields: Array<[string, string]>,
): Promise<Response> {
	const boundary = `----WhopAuthBoundary${Math.random().toString(36)}`

	// Create multipart body for Next server action request
	const parts = fields.map(
		([name, value]) =>
			`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}`,
	)
	const body = `${parts.join('\r\n')}\r\n--${boundary}--`

	return fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': `multipart/form-data; boundary=${boundary}`,
			'next-action': actionId,
			'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
		},
		body,
	})
}
