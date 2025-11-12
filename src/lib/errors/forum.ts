import { WhopError } from './base'

/**
 * Forum-specific error with explicit IDs for debugging
 */
export class WhopForumError extends WhopError {
	constructor(
		message: string,
		public readonly experienceId?: string,
		public readonly feedId?: string,
		public readonly postId?: string,
		public readonly commentId?: string,
		cause?: Error,
	) {
		super(message, 'FORUM_ERROR')
		this.name = 'WhopForumError'

		// Include cause if provided
		if (cause) {
			this.cause = cause
		}
	}

	/**
	 * Get a detailed error message with all available IDs
	 */
	getDetailedMessage(): string {
		const parts = [this.message]
		if (this.experienceId) parts.push(`Experience ID: ${this.experienceId}`)
		if (this.feedId) parts.push(`Feed ID: ${this.feedId}`)
		if (this.postId) parts.push(`Post ID: ${this.postId}`)
		if (this.commentId) parts.push(`Comment ID: ${this.commentId}`)
		return parts.join('\n')
	}
}
