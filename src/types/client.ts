export interface WhopOptions {
	/**
	 * Path to session file for persistence
	 * @default '.whop-session.json'
	 */
	sessionPath?: string

	/**
	 * Auto-load session on construction if file exists
	 * @default true
	 */
	autoLoad?: boolean
}
