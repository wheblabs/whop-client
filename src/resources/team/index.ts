import type { Whop } from '@/client'
import { WhopAuthError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import type {
	AddTeamMemberInput,
	CreateTeamInviteInput,
	TeamInvite,
	TeamMember,
	TeamRole,
	UpdateTeamMemberRoleInput,
} from './types'

/**
 * Team Invites sub-resource
 */
export class TeamInvites {
	constructor(private readonly client: Whop) {}

	/**
	 * List pending team invites
	 */
	async list(companyId: string): Promise<TeamInvite[]> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query fetchTeamInvites($id: ID!) {
        company(id: $id) {
          teamInvites {
            id
            email
            role
            status
            createdAt
            expiresAt
          }
        }
      }
    `

		interface FetchInvitesResponse {
			company: {
				teamInvites: TeamInvite[]
			}
		}

		const response = await graphqlRequest<FetchInvitesResponse>(
			'fetchTeamInvites',
			{
				query,
				variables: { id: companyId },
				operationName: 'fetchTeamInvites',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.company.teamInvites
	}

	/**
	 * Create a team invite
	 */
	async create(input: CreateTeamInviteInput): Promise<TeamInvite> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation createTeamInvite($input: CreateTeamInviteInput!) {
        createTeamInvite(input: $input) {
          id
          email
          role
          status
          createdAt
          expiresAt
        }
      }
    `

		interface CreateInviteResponse {
			createTeamInvite: TeamInvite
		}

		const response = await graphqlRequest<CreateInviteResponse>(
			'createTeamInvite',
			{
				query: mutation,
				variables: { input },
				operationName: 'createTeamInvite',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.createTeamInvite
	}

	/**
	 * Revoke a team invite
	 */
	async revoke(inviteId: string): Promise<boolean> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation revokeTeamInvite($id: ID!) {
        revokeTeamInvite(input: { id: $id })
      }
    `

		interface RevokeInviteResponse {
			revokeTeamInvite: boolean
		}

		const response = await graphqlRequest<RevokeInviteResponse>(
			'revokeTeamInvite',
			{
				query: mutation,
				variables: { id: inviteId },
				operationName: 'revokeTeamInvite',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.revokeTeamInvite
	}
}

/**
 * Team resource - Manage company team members and permissions
 *
 * @example
 * ```typescript
 * const whop = new Whop()
 *
 * // List team members
 * const members = await whop.team.list('biz_xxx')
 *
 * // Add a team member
 * await whop.team.add({
 *   companyId: 'biz_xxx',
 *   userId: 'user_xxx',
 *   role: 'moderator'
 * })
 *
 * // Send an invite
 * await whop.team.invites.create({
 *   companyId: 'biz_xxx',
 *   email: 'newuser@example.com',
 *   role: 'support'
 * })
 * ```
 */
export class Team {
	public readonly invites: TeamInvites

	constructor(private readonly client: Whop) {
		this.invites = new TeamInvites(client)
	}

	/**
	 * List team members
	 */
	async list(companyId: string): Promise<TeamMember[]> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query fetchTeamMembers($id: ID!) {
        company(id: $id) {
          teamMembers {
            id
            user {
              id
              username
              profilePic
              email
            }
            role
            joinedAt
          }
        }
      }
    `

		interface FetchMembersResponse {
			company: {
				teamMembers: TeamMember[]
			}
		}

		const response = await graphqlRequest<FetchMembersResponse>(
			'fetchTeamMembers',
			{
				query,
				variables: { id: companyId },
				operationName: 'fetchTeamMembers',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.company.teamMembers
	}

	/**
	 * Add a team member
	 */
	async add(input: AddTeamMemberInput): Promise<TeamMember> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation addTeamMember($input: AddTeamMemberInput!) {
        addTeamMember(input: $input) {
          id
          user {
            id
            username
            profilePic
            email
          }
          role
          joinedAt
        }
      }
    `

		interface AddMemberResponse {
			addTeamMember: TeamMember
		}

		const response = await graphqlRequest<AddMemberResponse>(
			'addTeamMember',
			{ query: mutation, variables: { input }, operationName: 'addTeamMember' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.addTeamMember
	}

	/**
	 * Remove a team member
	 */
	async remove(companyId: string, userId: string): Promise<boolean> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation removeTeamMember($input: RemoveTeamMemberInput!) {
        removeTeamMember(input: $input)
      }
    `

		interface RemoveMemberResponse {
			removeTeamMember: boolean
		}

		const response = await graphqlRequest<RemoveMemberResponse>(
			'removeTeamMember',
			{
				query: mutation,
				variables: { input: { companyId, userId } },
				operationName: 'removeTeamMember',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.removeTeamMember
	}

	/**
	 * Update a team member's role
	 */
	async updateRole(
		companyId: string,
		userId: string,
		role: TeamRole,
	): Promise<TeamMember> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation updateTeamMemberRole($input: UpdateTeamMemberRoleInput!) {
        updateTeamMemberRole(input: $input) {
          id
          user {
            id
            username
            profilePic
            email
          }
          role
          joinedAt
        }
      }
    `

		interface UpdateRoleResponse {
			updateTeamMemberRole: TeamMember
		}

		const response = await graphqlRequest<UpdateRoleResponse>(
			'updateTeamMemberRole',
			{
				query: mutation,
				variables: {
					input: { companyId, userId, role } as UpdateTeamMemberRoleInput,
				},
				operationName: 'updateTeamMemberRole',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.updateTeamMemberRole
	}
}

export * from './types'
