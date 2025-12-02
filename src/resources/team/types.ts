/**
 * Team member role
 */
export type TeamRole = 'owner' | 'admin' | 'moderator' | 'support'

/**
 * Team member user info
 */
export interface TeamMemberUser {
	id: string
	username: string
	profilePic?: string
	email?: string
}

/**
 * Team member
 */
export interface TeamMember {
	id: string
	user: TeamMemberUser
	role: TeamRole
	joinedAt: string
}

/**
 * Team invite status
 */
export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'revoked'

/**
 * Team invite
 */
export interface TeamInvite {
	id: string
	email: string
	role: TeamRole
	status: InviteStatus
	createdAt: string
	expiresAt: string
}

/**
 * Input for adding a team member
 */
export interface AddTeamMemberInput {
	/** Company ID */
	companyId: string
	/** User ID to add */
	userId: string
	/** Role to assign */
	role: TeamRole
}

/**
 * Input for updating a team member's role
 */
export interface UpdateTeamMemberRoleInput {
	/** Company ID */
	companyId: string
	/** User ID */
	userId: string
	/** New role */
	role: TeamRole
}

/**
 * Input for creating a team invite
 */
export interface CreateTeamInviteInput {
	/** Company ID */
	companyId: string
	/** Email to invite */
	email: string
	/** Role to assign */
	role: TeamRole
}
