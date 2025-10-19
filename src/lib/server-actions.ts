import {
	WhopError,
	WhopHTTPError,
	WhopNetworkError,
	WhopParseError,
	WhopServerActionError,
} from '@/lib/errors'
import type { ServerAction } from '@/types/server-actions'

export async function extractServerActions(
	pageUrl: string,
): Promise<ServerAction[]> {
	// 1. Fetch the login page HTML
	let html: string
	try {
		const resp = await fetch(pageUrl)

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

	// 3. Extract JS paths
	const jsPaths = new Set<string>()
	for (const [_, pushCall] of scriptMatches) {
		const paths = pushCall?.match(/"(static\/chunks\/[^"]+\.js[^"]*)"/g)
		if (paths) {
			for (const path of paths) {
				jsPaths.add(decodeURIComponent(path.slice(1, -1)))
			}
		}
	}

	// 4. Find login page chunk
	const pageChunk = Array.from(jsPaths).find((p) => p.includes('/login/page-'))

	if (!pageChunk) {
		throw new WhopParseError(
			'Login page chunk not found in extracted JS paths',
			'login_chunk',
			`Expected to find a chunk matching '/login/page-*'. Found ${jsPaths.size} total chunks.`,
		)
	}

	// 5. Fetch page chunk
	let pageJs: string
	try {
		const resp = await fetch(`https://whop.com/_next/${pageChunk}`)
		if (!resp.ok) {
			throw new WhopHTTPError(
				`Failed to fetch login page chunk: HTTP ${resp.status}`,
				`https://whop.com/_next/${pageChunk}`,
				resp.status,
			)
		}
		pageJs = await resp.text()
	} catch (error) {
		if (error instanceof WhopError) throw error

		throw new WhopNetworkError(
			'Network error while fetching login page chunk',
			`https://whop.com/_next/${pageChunk}`,
			undefined,
			error as Error,
		)
	}

	// 6. Extract bundle IDs
	const bundleIds = [...pageJs.matchAll(/s\.bind\(s,(\d+)\)|s\((\d+)\)/g)]
		.map((m) => m[1] || m[2])
		.filter((item) => item !== undefined)

	if (bundleIds.length === 0) {
		throw new WhopParseError(
			'No bundle IDs found in login page chunk',
			'bundle_ids',
			'Expected to find Next.js bundle references like s.bind(s,1234) or s(1234)',
		)
	}

	// 7. Map bundle IDs to chunk paths
	const bundleChunks = bundleIds
		.map((id) => {
			const chunk = Array.from(jsPaths).find(
				(p) => p.includes(`/${id}-`) || p.includes(`chunks/${id}-`),
			)
			return chunk ? { id, path: chunk } : null
		})
		.filter((item) => item !== null)

	if (bundleChunks.length === 0) {
		throw new WhopParseError(
			'No matching chunks found for bundle IDs',
			'bundle_chunks',
			`Found ${bundleIds.length} bundle IDs but couldn't match them to chunks`,
		)
	}

	// 8. Extract server actions from bundles
	const actions: ServerAction[] = []
	const regex =
		/(?:\(\s*0\s*,\s*)?(?:[\w$]+\.)?createServerReference\)?\(\s*["'](?<id>[0-9a-f]{32,64})["'][^)]*,\s*["'](?<name>[^"']+)["']\s*\)/gi

	for (const chunk of bundleChunks) {
		let js: string
		try {
			const resp = await fetch(`https://whop.com/_next/${chunk.path}`)
			if (!resp.ok) continue // Skip failed chunks, not critical
			js = await resp.text()
		} catch {
			continue // Skip network errors for individual chunks
		}

		if (!js.includes('createServerReference')) continue

		for (const match of js.matchAll(regex)) {
			if (match.groups?.id && match.groups?.name) {
				actions.push({
					id: match.groups.id,
					name: match.groups.name,
				})
			}
		}
	}

	// 9. Validate we found actions
	if (actions.length === 0) {
		throw new WhopServerActionError('No server actions found in any bundle', {
			stage: 'extraction',
			expected: 'createServerReference calls with action IDs',
			found: `${bundleChunks.length} chunks checked, none contained valid actions`,
		})
	}

	return actions
}
