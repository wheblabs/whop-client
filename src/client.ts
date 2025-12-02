import {
	WhopAuthError,
	WhopParseError,
	WhopServerActionError,
} from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import { serverActionRequest } from '@/lib/rsc'
import {
	extractAllServerActions,
	extractScriptUrls,
	extractServerActions,
} from '@/lib/server-actions'
import { loadSessionSync, saveSession } from '@/lib/session'
import { Access } from '@/resources/access'
import { AppStore } from '@/resources/app-store'
import { Apps } from '@/resources/apps'
import { Auth } from '@/resources/auth'
import { Companies } from '@/resources/companies'
import { CompanyBuilder } from '@/resources/company'
import { Invoices } from '@/resources/invoices'
import { Me } from '@/resources/me'
import { Members } from '@/resources/members'
import { Memberships } from '@/resources/memberships'
import { Payments } from '@/resources/payments'
import { Transfers } from '@/resources/transfers'
import { Users } from '@/resources/users'
import type { AuthTokens, ServerAction, WhopOptions } from '@/types'

/**
 * Main Whop SDK client for automating Whop account operations
 *
 * @remarks
 * The Whop client manages authentication and provides access to Whop resources.
 * Sessions are automatically persisted by default for seamless re-authentication.
 *
 * @example
 * **Basic usage (auto-loads existing session):**
 * ```typescript
 * import { Whop } from '@whop/core'
 *
 * const whop = new Whop()
 *
 * // If session exists, auto-loads. Otherwise authenticate:
 * if (!whop.isAuthenticated()) {
 *   const ticket = await whop.auth.sendOTP('your@email.com')
 *   const code = prompt('Enter OTP code:')
 *   await whop.auth.verify({ code, ticket })
 *   // Session auto-saved to .whop-session.json
 * }
 *
 * // Now use authenticated client
 * const communities = await whop.communities.list()
 * ```
 *
 * @example
 * **Custom session path:**
 * ```typescript
 * // Save/load from custom location
 * const whop = new Whop('~/.config/whop/session.json')
 *
 * await whop.auth.verify({ code, ticket })
 * // Saves to ~/.config/whop/session.json
 * ```
 *
 * @example
 * **Disable auto-load (always start fresh):**
 * ```typescript
 * const whop = new Whop({ autoLoad: false })
 *
 * // Won't auto-load, must authenticate manually
 * await whop.auth.sendOTP('your@email.com')
 * // ...
 * ```
 *
 * @example
 * **Use existing tokens directly (Layer 3 API):**
 * ```typescript
 * const tokens = {
 *   accessToken: 'your-access-token',
 *   csrfToken: 'your-csrf-token',
 *   refreshToken: 'your-refresh-token'
 * }
 *
 * const whop = Whop.fromTokens(tokens)
 * console.log(whop.isAuthenticated()) // true
 * ```
 *
 * @example
 * **Ephemeral session (don't save to disk):**
 * ```typescript
 * const whop = new Whop()
 * await whop.auth.verify({
 *   code,
 *   ticket,
 *   persist: false  // Don't save session
 * })
 *
 * // Tokens only in memory, lost when process exits
 * ```
 *
 * @public
 */
export class Whop {
	public readonly access: Access
	public readonly appStore: AppStore
	public readonly auth: Auth
	public readonly apps: Apps
	public readonly companies: Companies
	public readonly invoices: Invoices
	public readonly me: Me
	public readonly members: Members
	public readonly memberships: Memberships
	public readonly payments: Payments
	public readonly transfers: Transfers
	public readonly users: Users

	private _tokens: AuthTokens | undefined = undefined
	private _serverActions: ServerAction[] | undefined = undefined
	private readonly sessionPath: string
	private readonly onTokenRefresh?: (
		newTokens: AuthTokens,
	) => void | Promise<void>

	/**
	 * Create a new Whop client instance
	 *
	 * @param sessionPathOrOptions - Session file path (string) or configuration options
	 *
	 * @remarks
	 * By default, automatically loads existing session from `.whop-session.json` if it exists.
	 * The session is loaded asynchronously, so you may need to check `isAuthenticated()`
	 * or wait a moment before using the client.
	 *
	 * @example
	 * **Default (auto-loads from .whop-session.json):**
	 * ```typescript
	 * const whop = new Whop()
	 * ```
	 *
	 * @example
	 * **Custom session path:**
	 * ```typescript
	 * const whop = new Whop('./my-session.json')
	 * ```
	 *
	 * @example
	 * **Disable auto-load:**
	 * ```typescript
	 * const whop = new Whop({ autoLoad: false })
	 * ```
	 *
	 * @example
	 * **Custom path with options:**
	 * ```typescript
	 * const whop = new Whop({
	 *   sessionPath: '~/.config/whop/session.json',
	 *   autoLoad: true
	 * })
	 * ```
	 */
	constructor(sessionPathOrOptions?: string | WhopOptions) {
		// Parse options
		const options =
			typeof sessionPathOrOptions === 'string'
				? { sessionPath: sessionPathOrOptions, autoLoad: true }
				: {
						sessionPath: '.whop-session.json',
						autoLoad: true,
						...sessionPathOrOptions,
					}

		this.sessionPath = options.sessionPath
		this.onTokenRefresh = options.onTokenRefresh
		this.access = new Access(this)
		this.appStore = new AppStore(this)
		this.auth = new Auth(this)
		this.apps = new Apps(this)
		this.companies = new Companies(this)
		this.invoices = new Invoices(this)
		this.me = new Me(this)
		this.members = new Members(this)
		this.memberships = new Memberships(this)
		this.payments = new Payments(this)
		this.transfers = new Transfers(this)
		this.users = new Users(this)

		if (options.autoLoad) {
			// Load session synchronously from file
			const tokens = loadSessionSync(this.sessionPath)
			if (tokens) {
				this._tokens = tokens
			}
		}
	}

	async _getServerActions(): Promise<ServerAction[]> {
		if (this._serverActions) {
			return this._serverActions
		}

		try {
			const scriptUrls = await extractScriptUrls('https://whop.com/login')
			this._serverActions = await extractServerActions(scriptUrls)
			return this._serverActions
		} catch (error) {
			if (
				error instanceof WhopServerActionError ||
				error instanceof WhopParseError
			) {
				throw new WhopAuthError(
					'Failed to initialize Whop authentication. Whop may have updated their website. Please report this issue on GitHub: https://github.com/wheblabs/whop-core-auth',
					'AUTH_INIT_FAILED',
					{ originalError: error.message },
				)
			}
			throw error
		}
	}

	/**
	 * Check if client is authenticated (has valid access token)
	 *
	 * @returns True if client has an access token
	 *
	 * @example
	 * ```typescript
	 * const whop = new Whop()
	 *
	 * if (!whop.isAuthenticated()) {
	 *   // Need to authenticate
	 *   await whop.auth.sendOTP('your@email.com')
	 * }
	 * ```
	 */
	isAuthenticated(): boolean {
		return !!this._tokens?.accessToken
	}

	/**
	 * Get current auth tokens (returns a copy)
	 *
	 * @remarks
	 * Returns undefined if not authenticated. The returned object is a copy,
	 * so modifying it won't affect the client's internal state.
	 *
	 * @returns Auth tokens or undefined if not authenticated
	 *
	 * @example
	 * ```typescript
	 * const whop = new Whop()
	 * await whop.auth.verify({ code, ticket })
	 *
	 * const tokens = whop.getTokens()
	 * if (tokens) {
	 *   console.log('User ID:', tokens.userId)
	 *   console.log('Access Token:', tokens.accessToken)
	 * }
	 * ```
	 */
	getTokens(): AuthTokens | undefined {
		return this._tokens ? { ...this._tokens } : undefined
	}

	/**
	 * Get session path (for internal use by resources)
	 */
	getSessionPath(): string | undefined {
		return this.sessionPath
	}

	/**
	 * Update tokens and optionally save to session file
	 * Called internally when tokens are refreshed
	 */
	_updateTokens(newTokens: AuthTokens): void {
		this._tokens = newTokens

		// Call custom callback if provided
		if (this.onTokenRefresh) {
			Promise.resolve(this.onTokenRefresh(newTokens)).catch((error) => {
				// Log error but don't throw - token refresh should not fail the request
				console.error('Error in onTokenRefresh callback:', error)
			})
		}

		// Auto-save to session file if path exists
		if (this.sessionPath) {
			saveSession(this.sessionPath, newTokens).catch(() => {
				// Silently ignore save errors during auto-refresh
			})
		}
	}

	/**
	 * Set auth tokens directly (Layer 3 API)
	 *
	 * @remarks
	 * Advanced API for setting tokens manually. Most users should use
	 * `Whop.fromTokens()` or the auth flow instead.
	 *
	 * @param tokens - Auth tokens to set
	 *
	 * @example
	 * ```typescript
	 * const whop = new Whop()
	 * whop.setTokens({
	 *   accessToken: 'your-access-token',
	 *   csrfToken: 'your-csrf-token',
	 *   refreshToken: 'your-refresh-token'
	 * })
	 * ```
	 */
	setTokens(tokens: AuthTokens): void {
		this._tokens = tokens
	}

	/**
	 * Create authenticated client from existing tokens (Layer 3 API)
	 *
	 * @remarks
	 * Use this when you have tokens from another source (e.g., stored in a database,
	 * environment variables, or retrieved from an external system).
	 *
	 * @param tokens - Auth tokens to initialize the client with
	 * @param options - Optional configuration (e.g., onTokenRefresh callback)
	 * @returns Authenticated Whop client
	 *
	 * @example
	 * **Basic usage:**
	 * ```typescript
	 * const tokens = {
	 *   accessToken: process.env.WHOP_ACCESS_TOKEN,
	 *   csrfToken: process.env.WHOP_CSRF_TOKEN,
	 *   refreshToken: process.env.WHOP_REFRESH_TOKEN
	 * }
	 *
	 * const whop = Whop.fromTokens(tokens)
	 * console.log(whop.isAuthenticated()) // true
	 * ```
	 *
	 * @example
	 * **With database persistence:**
	 * ```typescript
	 * const tokens = await db.getWhopTokens(userId)
	 * const whop = Whop.fromTokens(tokens, {
	 *   onTokenRefresh: async (newTokens) => {
	 *     await db.saveWhopTokens(userId, newTokens)
	 *   }
	 * })
	 * ```
	 */
	static fromTokens(
		tokens: AuthTokens,
		options?: Omit<WhopOptions, 'autoLoad'>,
	): Whop {
		const client = new Whop({
			autoLoad: false,
			...options,
		})
		client.setTokens(tokens)
		return client
	}

	/**
	 * Save current session to file
	 *
	 * @remarks
	 * Sessions are usually auto-saved after successful authentication.
	 * Use this for manual control or to save to a different location.
	 *
	 * @param path - Optional custom path (defaults to constructor path or .whop-session.json)
	 * @throws {WhopAuthError} If not authenticated
	 *
	 * @example
	 * ```typescript
	 * const whop = new Whop()
	 * await whop.auth.verify({ code, ticket, persist: false })
	 *
	 * // Manually save to custom location
	 * await whop.saveSession('./backup/session.json')
	 * ```
	 */
	async saveSession(path?: string): Promise<void> {
		if (!this._tokens) {
			throw new WhopAuthError(
				'Cannot save session: not authenticated',
				'NOT_AUTHENTICATED',
			)
		}

		const sessionPath = path ?? this.sessionPath ?? '.whop-session.json'
		await saveSession(sessionPath, this._tokens)
	}

	/**
	 * Get a company builder for chaining operations
	 *
	 * @param companyId - Company ID
	 * @returns CompanyBuilder instance
	 *
	 * @example
	 * ```typescript
	 * const whop = new Whop()
	 *
	 * // List apps for a company
	 * const apps = await whop.company('biz_xxx').apps.list()
	 *
	 * // Create a product
	 * const product = await whop.company('biz_xxx').products.create({
	 *   title: 'Premium Membership'
	 * })
	 *
	 * // Update a plan
	 * await whop
	 *   .company('biz_xxx')
	 *   .product('prod_xxx')
	 *   .plan('plan_xxx')
	 *   .update({ renewalPrice: '39.99' })
	 * ```
	 */
	company(companyId: string): CompanyBuilder {
		return new CompanyBuilder(this, companyId)
	}

	/**
	 * Execute an arbitrary GraphQL query against Whop's API
	 *
	 * @param options - GraphQL query options
	 * @param options.query - The GraphQL query string
	 * @param options.variables - Optional query variables
	 * @param options.operationName - Optional operation name
	 * @returns Typed GraphQL response data
	 * @throws {WhopAuthError} If not authenticated
	 *
	 * @example
	 * ```typescript
	 * const whop = new Whop()
	 *
	 * // Execute a custom query
	 * const result = await whop.graphql({
	 *   query: `
	 *     query GetCompany($id: ID!) {
	 *       company(id: $id) {
	 *         id
	 *         name
	 *       }
	 *     }
	 *   `,
	 *   variables: { id: 'biz_xxx' },
	 *   operationName: 'GetCompany'
	 * })
	 *
	 * console.log(result.company.name)
	 * ```
	 *
	 * @example
	 * **With TypeScript typing:**
	 * ```typescript
	 * interface CompanyResponse {
	 *   company: {
	 *     id: string
	 *     name: string
	 *   }
	 * }
	 *
	 * const result = await whop.graphql<CompanyResponse>({
	 *   query: `...`,
	 *   variables: { id: 'biz_xxx' }
	 * })
	 *
	 * // result.company is now typed
	 * ```
	 */
	async graphql<T = any>(options: {
		query: string
		variables?: Record<string, unknown>
		operationName?: string
	}): Promise<T> {
		if (!this._tokens) {
			throw new WhopAuthError(
				'Cannot execute GraphQL query: not authenticated',
				'NOT_AUTHENTICATED',
			)
		}

		// Use operation name from options or extract from query (for URL)
		const operationName = options.operationName || 'graphql'

		return graphqlRequest<T>(
			operationName,
			{
				query: options.query,
				variables: options.variables,
				operationName: options.operationName,
			},
			this._tokens,
			(newTokens) => this._updateTokens(newTokens),
		)
	}

	/**
	 * Get server actions from a Whop page
	 *
	 * @param url - The URL of the Whop page to extract actions from
	 * @param options - Optional configuration including auth tokens for authenticated requests
	 * @returns Array of server actions found on the page
	 *
	 * @example
	 * ```typescript
	 * const whop = new Whop()
	 *
	 * // Get actions from login page
	 * const actions = await whop.getActions('https://whop.com/login')
	 *
	 * // Get actions with authentication using getTokens()
	 * const tokens = whop.getTokens()
	 * if (tokens) {
	 *   const actions = await whop.getActions('https://whop.com/dashboard', {
	 *     tokens
	 *   })
	 * }
	 *
	 * // Or inline
	 * const actions = await whop.getActions('https://whop.com/dashboard', {
	 *   tokens: whop.getTokens()
	 * })
	 * ```
	 */
	async getActions(
		url: string,
		options?: { tokens?: AuthTokens },
	): Promise<ServerAction[]> {
		const scriptUrls = await extractScriptUrls(url, options?.tokens)
		return extractAllServerActions(scriptUrls, options?.tokens)
	}

	/**
	 * Execute a server action
	 *
	 * @param url - The URL where the server action should be executed
	 * @param actionId - The server action ID (from getActions)
	 * @param fieldsOrBody - Form fields as key-value pairs, or raw body (string/object)
	 * @param options - Optional configuration including auth tokens
	 * @returns Raw fetch Response
	 *
	 * @example
	 * ```typescript
	 * const whop = new Whop()
	 *
	 * // Execute action with form fields (multipart)
	 * const response = await whop.executeAction(
	 *   'https://whop.com/login',
	 *   'action-id-here',
	 *   [['1_email', 'user@example.com']]
	 * )
	 *
	 * // Execute action with raw JSON body
	 * const response = await whop.executeAction(
	 *   'https://whop.com/dashboard',
	 *   'action-id-here',
	 *   '[{"resourceId":"biz_xxx","resourceType":"Company"}]'
	 * )
	 *
	 * // Execute action with JSON object
	 * const response = await whop.executeAction(
	 *   'https://whop.com/dashboard',
	 *   'action-id-here',
	 *   [{ resourceId: 'biz_xxx', resourceType: 'Company' }],
	 *   { tokens: whop.getTokens() }
	 * )
	 * ```
	 */
	async executeAction(
		url: string,
		actionId: string,
		fieldsOrBody: Array<[string, string]> | string | object,
		options?: { tokens?: AuthTokens },
	): Promise<Response> {
		return serverActionRequest(url, actionId, fieldsOrBody, options?.tokens)
	}
}
