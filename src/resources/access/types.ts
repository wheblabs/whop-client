/**
 * Access types for the Whop client
 */

/**
 * Access check result
 */
export interface AccessCheckResult {
	hasAccess: boolean
	userId?: string
	isAdmin?: boolean
	isMember?: boolean
}

/**
 * Experience access info
 */
export interface ExperienceAccess {
	id: string
	title?: string
	hasAccess: boolean
	isAdmin: boolean
	membership?: {
		id: string
		status: string
	}
}

/**
 * Access pass access info
 */
export interface AccessPassAccess {
	id: string
	title: string
	hasAccess: boolean
	membership?: {
		id: string
		status: string
		plan: {
			id: string
			planType: string
		}
	}
}

/**
 * User access summary for a company
 */
export interface UserAccessSummary {
	userId: string
	companyId: string
	isOwner: boolean
	isTeamMember: boolean
	memberships: Array<{
		id: string
		status: string
		accessPassId: string
		accessPassTitle: string
	}>
}

/**
 * Options for checking experience access
 */
export interface CheckExperienceAccessOptions {
	experienceId: string
	/** Optional user ID (defaults to current user) */
	userId?: string
}

/**
 * Options for checking access pass access
 */
export interface CheckAccessPassAccessOptions {
	accessPassId: string
	/** Optional user ID (defaults to current user) */
	userId?: string
}

/**
 * Bulk access check for multiple experiences
 */
export interface BulkAccessCheckResult {
	experiences: Record<
		string,
		{
			hasAccess: boolean
			isAdmin: boolean
		}
	>
}
