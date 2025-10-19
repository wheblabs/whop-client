/**
 * Base error class for all Whop SDK errors
 * All Whop errors extend this class for easy instanceof checks
 */
export class WhopError extends Error {
	constructor(
		message: string,
		public readonly code: string,
	) {
		super(message)
		this.name = this.constructor.name

		// Maintains proper stack trace for where error was thrown (V8 engines)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor)
		}
	}
}
