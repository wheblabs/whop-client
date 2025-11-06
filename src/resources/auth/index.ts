import type { Whop } from '@/client'
import { extractAuthTokens } from '@/lib/cookies'
import {
	WhopAuthError,
	WhopHTTPError,
	WhopNetworkError,
	WhopParseError,
} from '@/lib/errors'
import { WhopServerActionNotFoundError } from '@/lib/errors/api'
import { parseRSCResponse, serverActionRequest } from '@/lib/rsc'
import type { OTPResponse } from '@/types/auth'

export class Auth {
	constructor(private readonly client: Whop) {}

	/**
	 * Send OTP code to email
	 * Returns ticket needed for verify()
	 */
	async sendOTP(email: string): Promise<string> {
		// 1. Get server actions (caches internally)
		const serverActions = await this.client._getServerActions()

		// 2. Find the 'login' action (this sends the OTP)
		const loginAction = serverActions.find((action) => action.name === 'login')
		if (!loginAction) {
			throw new WhopServerActionNotFoundError(
				'login',
				serverActions.map((action) => action.name),
			)
		}

		// 3. Make the server action request
		let response: Response
		try {
			response = await serverActionRequest(
				'https://whop.com/login',
				loginAction.id,
				[
					['1_email', email],
					['1_logout', 'false'],
					['0', '["$K1"]'],
				],
			)
		} catch (error) {
			throw new WhopNetworkError(
				'Network error while sending OTP',
				'https://whop.com/login',
				undefined,
				error as Error,
			)
		}

		// 4. Check HTTP status
		if (!response.ok) {
			const body = await response.text()
			const bodyPreview = body.substring(0, 500)

			throw new WhopHTTPError(
				`OTP request failed with HTTP ${response.status}. Response: ${bodyPreview}`,
				'https://whop.com/login',
				response.status,
				body,
			)
		}

		// 5. Parse RSC response
		const responseText = await response.text()
		const parsed = parseRSCResponse<OTPResponse>(responseText)

		if (!parsed.success) {
			throw new WhopParseError(
				`Failed to parse OTP response: ${parsed.error}`,
				'rsc_response',
				'Whop may have changed their response format',
			)
		}

		// 6. Validate response structure
		if (!parsed.data.twoFactor?.ticket) {
			throw new WhopParseError(
				'OTP response missing twoFactor.ticket field',
				'response_structure',
				'Expected { twoFactor: { ticket: string } }',
			)
		}

		// 7. Return the ticket
		return parsed.data.twoFactor.ticket
	}

	/**
	 * Verify OTP code and authenticate
	 * @param persist - Auto-save session (default: true). Pass false to disable, or a path to customize location.
	 */
	async verify(params: {
		code: string
		ticket: string
		persist?: boolean | string
	}): Promise<void> {
		const { code, ticket, persist = true } = params

		// 1. Get server actions
		const actions = await this.client._getServerActions()

		// 2. Find verify action
		const verifyAction = actions.find((a) => a.name === 'verifyTwoFactor')
		if (!verifyAction) {
			throw new WhopServerActionNotFoundError(
				'verifyTwoFactor',
				actions.map((a) => a.name),
			)
		}

		// 3. Make verify request
		let response: Response
		try {
			response = await serverActionRequest(
				'https://whop.com/login',
				verifyAction.id,
				[
					['1_otp', code],
					['1_ticket', ticket],
					['1_next', '/'],
					['0', '["$K1"]'],
				],
			)
		} catch (error) {
			throw new WhopNetworkError(
				'Network error during OTP verification',
				'https://whop.com/login',
				undefined,
				error as Error,
			)
		}

		// 4. Check HTTP status
		// Accept 2xx (success) and 3xx (redirect) as success
		// Whop returns 303 redirect on successful auth
		const isSuccess = response.status >= 200 && response.status < 400

		if (!isSuccess) {
			const body = await response.text()

			// Check if it's invalid OTP (400/401)
			if (response.status === 400 || response.status === 401) {
				// Try to extract error message from response body
				const errorDetails = body.substring(0, 200) // First 200 chars

				throw new WhopAuthError('Invalid or expired OTP code', 'INVALID_OTP', {
					statusCode: response.status,
					responsePreview: errorDetails,
				})
			}

			// For other errors, include response preview
			const bodyPreview = body.substring(0, 500)
			throw new WhopHTTPError(
				`OTP verification failed with HTTP ${response.status}. Response: ${bodyPreview}`,
				'https://whop.com/login',
				response.status,
				body,
			)
		}

		// 5. Extract tokens from cookies
		const tokens = extractAuthTokens(response)

		// 6. Store in client (mutates client state)
		this.client.setTokens(tokens)

		// 7. Auto-save session unless explicitly disabled
		if (persist !== false) {
			const path =
				typeof persist === 'string'
					? persist
					: (this.client.getSessionPath() ?? '.whop-session.json')

			await this.client.saveSession(path)
			console.log(`✓ Session saved to ${path}`)
		}
	}
}
