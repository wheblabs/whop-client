import {
	WhopError,
	WhopHTTPError,
	WhopNetworkError,
	WhopParseError,
	WhopServerActionError,
} from '@/lib/errors'
import type { AuthTokens } from '@/types/auth'
import type { ServerAction } from '@/types/server-actions'

/**
 * Build cookie header string from auth tokens
 */
function buildCookieHeader(tokens: AuthTokens): string {
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

export async function extractScriptUrls(
	pageUrl: string,
	tokens?: AuthTokens,
): Promise<string[]> {
	// 1. Fetch the login page HTML
	let html: string
	try {
		const headers: HeadersInit = {
			'User-Agent':
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
		}

		if (tokens) {
			headers.Cookie = buildCookieHeader(tokens)
		}

		const resp = await fetch(pageUrl, { headers })

		if (!resp.ok) {
			throw new WhopHTTPError(
				`Failed to fetch Whop login page: HTTP ${resp.status}`,
				pageUrl,
				resp.status,
				await resp.text().catch(() => undefined),
			)
		}

		html = await resp.text()
	} catch (error) {
		if (error instanceof WhopError) throw error

		throw new WhopNetworkError(
			'Network error while fetching Whop login page',
			pageUrl,
			undefined,
			error as Error,
		)
	}

	// 2. Extract script tags
	const scriptMatches = [
		...html.matchAll(/<script>(self\.__next_f\.push\(.*?\))<\/script>/gs),
	]

	if (scriptMatches.length === 0) {
		throw new WhopParseError(
			'No Next.js script tags found in login page',
			'script_tags',
			'Whop may have updated their website. Please report this issue on GitHub.',
		)
	}

	// 3. Extract script URLs from HTML
	const baseUrl = new URL(pageUrl)
	const scriptSrcRegex = /<script[^>]+src=["']([^"']+\.js[^"']*)["']/gi
	const scriptUrls: string[] = []
	let match: RegExpExecArray | null

	while (true) {
		match = scriptSrcRegex.exec(html)
		if (match === null) break

		const scriptPath = match[1]
		if (!scriptPath) continue

		// Replace \u002F with / (URL-encoded forward slashes)
		const normalizedPath = scriptPath.replace(/\\u002F/g, '/')

		try {
			let url: URL

			// Check if it's already a full URL
			if (
				normalizedPath.startsWith('http://') ||
				normalizedPath.startsWith('https://')
			) {
				url = new URL(normalizedPath)
			} else if (normalizedPath.startsWith('/')) {
				// Absolute path on same domain
				url = new URL(normalizedPath, baseUrl.origin)
			} else {
				// Relative path
				url = new URL(normalizedPath, baseUrl.origin)
			}

			scriptUrls.push(url.toString())
		} catch {}
	}

	if (scriptUrls.length === 0) {
		throw new WhopParseError(
			'No script URLs found in login page',
			'script_urls',
			'Expected to find script tags with src attributes',
		)
	}

	return scriptUrls
}

/**
 * Extracts server actions from a JavaScript bundle body
 *
 * @param bundleBody - The JavaScript code as a string
 * @param targetActions - Optional array of action names to filter for. If provided, only returns actions matching these names.
 * @returns Array of server actions found in the bundle
 */
export function extractServerActionsFromBundle(
	bundleBody: string,
	targetActions?: string[],
): ServerAction[] {
	// Early return if bundle doesn't contain createServerReference
	if (!bundleBody.includes('createServerReference')) {
		return []
	}

	// Regex to match createServerReference calls with action names
	// Pattern: createServerReference("hash",...,"actionName")
	// Matches: createServerReference("hash",...,"actionName") or createServerReference("hash",callServer,void 0,findSourceMapURL,"actionName")
	const actionRegex =
		/(?:\(\s*0\s*,\s*)?(?:[\w$]+\.)?createServerReference\)?\(\s*["'](?<id>[0-9a-f]{32,64})["'][^)]*,\s*["'](?<name>[^"']+)["']\s*\)/gi

	const actions: ServerAction[] = []

	// Search for server actions
	for (const match of bundleBody.matchAll(actionRegex)) {
		const id = match.groups?.id
		const name = match.groups?.name

		if (id && name) {
			// If targetActions is provided, only include matching actions
			if (targetActions && !targetActions.includes(name)) {
				continue
			}
			actions.push({ id, name })
		}
	}

	return actions
}

/**
 * Extract all server actions from script URLs without filtering or validation
 *
 * @param scriptUrls - Array of script URLs to fetch and parse
 * @param tokens - Optional auth tokens for authenticated requests
 * @returns Array of all server actions found (no filtering or validation)
 */
export async function extractAllServerActions(
	scriptUrls: string[],
	tokens?: AuthTokens,
): Promise<ServerAction[]> {
	const actions: ServerAction[] = []
	const foundActions = new Map<string, ServerAction>() // Use Map to deduplicate by name

	// Reverse the script URLs list to process them in reverse order
	const reversedScriptUrls = [...scriptUrls].reverse()

	for (let i = 0; i < reversedScriptUrls.length; i++) {
		const scriptUrl = reversedScriptUrls[i]
		if (!scriptUrl) continue

		let js: string
		try {
			const headers: HeadersInit = {
				'User-Agent':
					'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
			}

			if (tokens) {
				headers.Cookie = buildCookieHeader(tokens)
			}

			const resp = await fetch(scriptUrl, { headers })
			if (!resp.ok) {
				console.log(`  ⚠️  Failed to fetch: HTTP ${resp.status}`)
				continue
			}
			js = await resp.text()
		} catch (error) {
			console.log(
				`  ⚠️  Network error: ${error instanceof Error ? error.message : String(error)}`,
			)
			continue
		}

		// Extract all server actions from this bundle (no filtering)
		const bundleActions = extractServerActionsFromBundle(js)

		// Add found actions to our collection (deduplicate by name)
		for (const action of bundleActions) {
			if (!foundActions.has(action.name)) {
				foundActions.set(action.name, action)
				actions.push(action)
			}
		}
	}

	return actions
}

export async function extractServerActions(
	scriptUrls: string[],
	tokens?: AuthTokens,
): Promise<ServerAction[]> {
	// Fetch each script and search for server actions
	const targetActions = ['login', 'verifyTwoFactor', 'resendOtp']
	const actions: ServerAction[] = []
	const foundActions = new Set<string>()

	// Reverse the script URLs list to process them in reverse order
	const reversedScriptUrls = [...scriptUrls].reverse()

	for (let i = 0; i < reversedScriptUrls.length; i++) {
		const scriptUrl = reversedScriptUrls[i]
		if (!scriptUrl) continue

		if (foundActions.size === targetActions.length) {
			break
		}

		let js: string
		try {
			const headers: HeadersInit = {
				'User-Agent':
					'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
			}

			if (tokens) {
				headers.Cookie = buildCookieHeader(tokens)
			}

			const resp = await fetch(scriptUrl, { headers })
			if (!resp.ok) {
				console.log(`  ⚠️  Failed to fetch: HTTP ${resp.status}`)
				continue
			}
			js = await resp.text()
		} catch (error) {
			console.log(
				`  ⚠️  Network error: ${error instanceof Error ? error.message : String(error)}`,
			)
			continue
		}

		// Extract server actions from this bundle
		const bundleActions = extractServerActionsFromBundle(js, targetActions)

		// Add found actions to our collection
		for (const action of bundleActions) {
			if (!foundActions.has(action.name)) {
				actions.push(action)
				foundActions.add(action.name)
			}
		}
	}

	// Validate we found all required actions
	if (actions.length === 0) {
		throw new WhopServerActionError('No server actions found in any script', {
			stage: 'extraction',
			expected: `createServerReference calls for: ${targetActions.join(', ')}`,
			found: `${scriptUrls.length} scripts checked, none contained valid actions`,
		})
	}

	// Check if we found all target actions
	const missingActions = targetActions.filter(
		(action) => !foundActions.has(action),
	)
	if (missingActions.length > 0) {
		throw new WhopServerActionError(
			`Missing required server actions: ${missingActions.join(', ')}`,
			{
				stage: 'extraction',
				expected: `All actions: ${targetActions.join(', ')}`,
				found: `Found: ${actions.map((a) => a.name).join(', ')}`,
			},
		)
	}

	// Sort actions by target order for consistent output
	const sortedActions = targetActions
		.map((targetName) => actions.find((a) => a.name === targetName))
		.filter((a): a is ServerAction => a !== undefined)

	return sortedActions
}
