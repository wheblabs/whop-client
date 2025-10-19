import { WhopError } from './base'

/**
 * Parsing/extraction errors when scraping Whop's website
 * Usually indicates Whop has updated their website structure
 */
export class WhopParseError extends WhopError {
	constructor(
		message: string,
		/**
		 * What we were trying to parse/extract
		 * e.g., 'script_tags', 'login_chunk', 'server_actions'
		 */
		public readonly context: string,
		/**
		 * Optional hint for users on what to do
		 */
		public readonly hint: string | undefined = undefined,
	) {
		super(message, 'PARSE_ERROR')
	}
}

/**
 * Specific error for when server actions cannot be extracted
 * This is a critical failure - can't proceed with auth
 */
export class WhopServerActionError extends WhopError {
	constructor(
		message: string,
		public readonly details:
			| {
					stage?: string // Where extraction failed
					expected?: string // What we expected to find
					found?: string // What we actually found
			  }
			| undefined = undefined,
	) {
		super(message, 'SERVER_ACTION_ERROR')
	}
}
