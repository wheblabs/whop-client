import {
	WhopAuthError,
	WhopParseError,
	WhopServerActionError,
} from '@/lib/errors'
import { extractServerActions } from '@/lib/server-actions'
import { loadSessionSync, saveSession } from '@/lib/session'
import { Apps } from '@/resources/apps'
import { Auth } from '@/resources/auth'
import { Companies } from '@/resources/companies'
import { Me } from '@/resources/me'
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
	public readonly auth: Auth
	public readonly apps: Apps
	public readonly companies: Companies
	public readonly me: Me

	private _tokens: AuthTokens | undefined = undefined
	private _serverActions: ServerAction[] | undefined = undefined
	private readonly sessionPath: string

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
		this.auth = new Auth(this)
		this.apps = new Apps(this)
		this.companies = new Companies(this)
		this.me = new Me(this)

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
			this._serverActions = await extractServerActions('https://whop.com/login')
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

		// Auto-save if session was loaded from file
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
	 * @returns Authenticated Whop client
	 *
	 * @example
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
	 */
	static fromTokens(tokens: AuthTokens): Whop {
		const client = new Whop()
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
}
