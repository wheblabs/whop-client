/**
 * Audit log action type
 */
export type AuditLogAction =
	| 'create'
	| 'update'
	| 'delete'
	| 'login'
	| 'logout'
	| 'ban'
	| 'unban'
	| 'refund'
	| 'transfer'
	| 'invite'
	| 'remove'

/**
 * Audit log resource type
 */
export type AuditLogResource =
	| 'membership'
	| 'member'
	| 'payment'
	| 'webhook'
	| 'promo_code'
	| 'team_member'
	| 'access_pass'
	| 'plan'
	| 'experience'
	| 'course'
	| 'lesson'
	| 'affiliate'

/**
 * Audit log actor info
 */
export interface AuditLogActor {
	id: string
	username: string
	profilePic?: string
	role?: string
}

/**
 * Audit log entry
 */
export interface AuditLog {
	id: string
	action: AuditLogAction
	resource: AuditLogResource
	resourceId: string
	createdAt: string
	actor: AuditLogActor
	metadata?: Record<string, unknown>
	ipAddress?: string
	userAgent?: string
}

/**
 * Options for listing audit logs
 */
export interface ListAuditLogsOptions {
	/** Company ID */
	companyId: string
	/** Number of logs to fetch */
	first?: number
	/** Cursor for pagination */
	after?: string
	/** Filter by action */
	action?: AuditLogAction
	/** Filter by resource type */
	resource?: AuditLogResource
	/** Filter by actor ID */
	actorId?: string
	/** Filter by date range start */
	startDate?: string
	/** Filter by date range end */
	endDate?: string
}

/**
 * Paginated audit logs response
 */
export interface AuditLogsConnection {
	logs: AuditLog[]
	totalCount: number
	pageInfo: {
		hasNextPage: boolean
		endCursor: string | null
	}
}
