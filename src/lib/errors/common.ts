import { WhopError } from './base'

/**
 * Error thrown when a resource is not found
 *
 * @example
 * ```typescript
 * try {
 *   await whop.courses.get('course_nonexistent')
 * } catch (e) {
 *   if (e instanceof WhopResourceNotFoundError) {
 *     console.log(`Resource ${e.resourceType} not found: ${e.resourceId}`)
 *   }
 * }
 * ```
 */
export class WhopResourceNotFoundError extends WhopError {
	constructor(
		public readonly resourceType: string,
		public readonly resourceId: string,
	) {
		super(`${resourceType} not found: ${resourceId}`, 'RESOURCE_NOT_FOUND')
	}
}

/**
 * Error thrown when the user doesn't have permission to perform an action
 *
 * @example
 * ```typescript
 * try {
 *   await whop.team.remove('biz_xxx', 'user_xxx')
 * } catch (e) {
 *   if (e instanceof WhopPermissionError) {
 *     console.log(`Permission denied: ${e.action}`)
 *   }
 * }
 * ```
 */
export class WhopPermissionError extends WhopError {
	constructor(
		public readonly action: string,
		message?: string,
	) {
		super(
			message || `Permission denied for action: ${action}`,
			'PERMISSION_DENIED',
		)
	}
}

/**
 * Error thrown when rate limited by Whop API
 *
 * @example
 * ```typescript
 * try {
 *   // Many rapid requests...
 * } catch (e) {
 *   if (e instanceof WhopRateLimitError) {
 *     console.log(`Rate limited, retry after ${e.retryAfter}s`)
 *     await sleep(e.retryAfter * 1000)
 *   }
 * }
 * ```
 */
export class WhopRateLimitError extends WhopError {
	constructor(
		message: string,
		public readonly retryAfter?: number,
	) {
		super(message, 'RATE_LIMITED')
	}
}

/**
 * Error thrown when input validation fails
 *
 * @example
 * ```typescript
 * try {
 *   await whop.courses.create({
 *     experienceId: '',  // Invalid
 *     title: ''
 *   })
 * } catch (e) {
 *   if (e instanceof WhopValidationError) {
 *     console.log('Validation errors:', e.errors)
 *   }
 * }
 * ```
 */
export class WhopValidationError extends WhopError {
	constructor(
		message: string,
		public readonly errors: Array<{
			field: string
			message: string
		}> = [],
	) {
		super(message, 'VALIDATION_ERROR')
	}
}

/**
 * Error thrown when a resource already exists (conflict)
 *
 * @example
 * ```typescript
 * try {
 *   await whop.promoCodes.create({
 *     code: 'EXISTING_CODE',
 *     // ...
 *   })
 * } catch (e) {
 *   if (e instanceof WhopConflictError) {
 *     console.log('Resource already exists')
 *   }
 * }
 * ```
 */
export class WhopConflictError extends WhopError {
	constructor(
		message: string,
		public readonly conflictingResourceId?: string,
	) {
		super(message, 'CONFLICT')
	}
}

/**
 * Error thrown when a payment operation fails
 *
 * @example
 * ```typescript
 * try {
 *   await whop.payments.refund('receipt_xxx')
 * } catch (e) {
 *   if (e instanceof WhopPaymentError) {
 *     console.log(`Payment error: ${e.reason}`)
 *   }
 * }
 * ```
 */
export class WhopPaymentError extends WhopError {
	constructor(
		message: string,
		public readonly reason:
			| 'insufficient_funds'
			| 'already_refunded'
			| 'refund_not_allowed'
			| 'payment_failed'
			| 'card_declined'
			| 'unknown',
		public readonly receiptId?: string,
	) {
		super(message, 'PAYMENT_ERROR')
	}
}
