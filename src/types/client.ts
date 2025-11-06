import type { AuthTokens } from './auth'

export interface WhopOptions {
	/**
	 * Path to session file for persistence
	 * @default '.whop-session.json'
	 */
	sessionPath?: string

	/**
	 * Auto-load session on construction if file exists
	 * @default true
	 */
	autoLoad?: boolean

	/**
	 * Custom callback when tokens are refreshed
	 * Called whenever Whop's API returns new tokens (access token refresh)
	 * Useful for persisting tokens to a database or custom storage
	 *
	 * @param newTokens - The refreshed authentication tokens
	 * @returns Promise or void
	 *
	 * @example
	 * ```typescript
	 * const whop = new Whop({
	 *   onTokenRefresh: async (newTokens) => {
	 *     await db.saveWhopTokens(userId, newTokens)
	 *   }
	 * })
	 * ```
	 */
	onTokenRefresh?: (newTokens: AuthTokens) => void | Promise<void>
}
