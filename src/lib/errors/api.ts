import { WhopError } from './base'

/**
 * API-level errors from Whop
 * The request succeeded but Whop rejected it (invalid input, rate limit, etc.)
 */
export class WhopAPIError extends WhopError {
	constructor(
		message: string,
		public readonly whopErrorCode: string | undefined = undefined,
		public readonly whopErrorMessage: string | undefined = undefined,
	) {
		super(message, 'API_ERROR')
	}
}

/**
 * Specific server action not found after extraction
 */
export class WhopServerActionNotFoundError extends WhopError {
	constructor(
		public readonly actionName: string,
		public readonly availableActions: string[],
	) {
		super(
			`Server action '${actionName}' not found. Available actions: ${availableActions.join(', ')}`,
			'SERVER_ACTION_NOT_FOUND',
		)
	}
}
