import { WhopError } from './base'

/**
 * Network-related errors (HTTP failures, timeouts, etc.)
 */
export class WhopNetworkError extends WhopError {
	constructor(
		message: string,
		public readonly url: string,
		public readonly statusCode: number | undefined = undefined,
		public override readonly cause: Error | undefined = undefined,
	) {
		super(message, 'NETWORK_ERROR')
	}
}

/**
 * HTTP response was not OK (4xx, 5xx)
 */
export class WhopHTTPError extends WhopNetworkError {
	public override readonly code = 'HTTP_ERROR'

	constructor(
		message: string,
		url: string,
		statusCode: number,
		public readonly responseBody: string | undefined = undefined,
	) {
		super(message, url, statusCode)
	}
}
