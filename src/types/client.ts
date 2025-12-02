import type {
	ErrorInterceptor,
	RequestInterceptor,
	ResponseInterceptor,
} from '@/lib/interceptors'
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

	/**
	 * Request interceptor called before each request
	 * Can modify the request or throw to abort
	 *
	 * @example
	 * ```typescript
	 * const whop = new Whop({
	 *   onRequest: async (ctx) => {
	 *     console.log(`Request: ${ctx.operationName}`)
	 *     return ctx
	 *   }
	 * })
	 * ```
	 */
	onRequest?: RequestInterceptor

	/**
	 * Response interceptor called after each successful response
	 * Can modify the response or handle logging/metrics
	 *
	 * @example
	 * ```typescript
	 * const whop = new Whop({
	 *   onResponse: async (ctx) => {
	 *     console.log(`Response: ${ctx.request.operationName} took ${ctx.duration}ms`)
	 *     return ctx
	 *   }
	 * })
	 * ```
	 */
	onResponse?: ResponseInterceptor

	/**
	 * Error interceptor called when a request fails
	 * Can modify the error or handle error logging
	 *
	 * @example
	 * ```typescript
	 * const whop = new Whop({
	 *   onError: async (error, ctx) => {
	 *     console.error(`Error in ${ctx.operationName}:`, error)
	 *     return error
	 *   }
	 * })
	 * ```
	 */
	onError?: ErrorInterceptor
}
