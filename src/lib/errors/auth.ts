import { WhopError } from './base'

/**
 * Authentication-related errors
 * Thrown when auth operations fail (OTP send, verify, token refresh, etc.)
 */
export class WhopAuthError extends WhopError {
	constructor(
		message: string,
		code: string,
		public readonly details: Record<string, unknown> | undefined = undefined,
	) {
		super(message, code)
	}
}

/**
 * Auth response validation errors
 * Server responded OK but didn't return expected auth data
 */
export class WhopAuthResponseError extends WhopError {
	constructor(
		message: string,
		public readonly details: Record<string, unknown> | undefined = undefined,
	) {
		super(message, 'AUTH_RESPONSE_ERROR')
	}
}
