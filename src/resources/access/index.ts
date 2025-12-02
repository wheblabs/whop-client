import type { Whop } from '@/client'
import { WhopAuthError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import type {
	AccessCheckResult,
	AccessPassAccess,
	CheckAccessPassAccessOptions,
	CheckExperienceAccessOptions,
	UserAccessSummary,
} from './types'

export * from './types'

/**
 * Access resource for checking user access to experiences and access passes
 *
 * @remarks
 * This is the primary resource for gating features based on user access.
 * Use this to check if a user has access to an experience or access pass
 * before allowing them to view protected content.
 *
 * @example
 * ```typescript
 * const whop = new Whop()
 *
 * // Check if current user has access to an experience
 * const access = await whop.access.checkExperience({
 *   experienceId: 'exp_xxx'
 * })
 *
 * if (access.hasAccess) {
 *   // Show protected content
 * }
 *
 * // Check if user is an admin
 * if (access.isAdmin) {
 *   // Show admin controls
 * }
 * ```
 */
export class Access {
	constructor(private readonly client: Whop) {}

	/**
	 * Check if a user has access to an experience
	 *
	 * @param options - Check options
	 * @returns Access check result
	 *
	 * @example
	 * ```typescript
	 * const access = await whop.access.checkExperience({
	 *   experienceId: 'exp_xxx'
	 * })
	 *
	 * console.log(access.hasAccess) // true/false
	 * console.log(access.isAdmin)   // true if owner/team member
	 * ```
	 */
	async checkExperience(
		options: CheckExperienceAccessOptions,
	): Promise<AccessCheckResult> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
			query checkExperienceAccess($experienceId: ID!, $userId: ID) {
				experience(id: $experienceId) {
					id
					title
					company {
						id
						ownerUserId
						viewer {
							hasAccess
							isTeamMember
							membership {
								id
								status
							}
						}
					}
				}
				${options.userId ? `user(id: $userId) { id }` : ''}
			}
		`

		const variables: Record<string, unknown> = {
			experienceId: options.experienceId,
		}
		if (options.userId) {
			variables.userId = options.userId
		}

		const response = await graphqlRequest<{
			experience: {
				id: string
				title: string
				company: {
					id: string
					ownerUserId: string
					viewer: {
						hasAccess: boolean
						isTeamMember: boolean
						membership?: {
							id: string
							status: string
						}
					}
				}
			}
		}>(
			'checkExperienceAccess',
			{ query, variables, operationName: 'checkExperienceAccess' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		const { experience } = response
		const viewer = experience.company.viewer
		const isOwner =
			tokens.userId === experience.company.ownerUserId ||
			experience.company.ownerUserId === tokens.userId

		return {
			hasAccess: viewer.hasAccess || isOwner || viewer.isTeamMember,
			isAdmin: isOwner || viewer.isTeamMember,
			isMember: viewer.hasAccess && !isOwner && !viewer.isTeamMember,
			userId: tokens.userId,
		}
	}

	/**
	 * Check if a user has access to an access pass
	 *
	 * @param options - Check options
	 * @returns Access pass access result
	 */
	async checkAccessPass(
		options: CheckAccessPassAccessOptions,
	): Promise<AccessPassAccess> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
			query checkAccessPassAccess($accessPassId: ID!) {
				accessPass(id: $accessPassId) {
					id
					title
					viewer {
						hasAccess
						membership {
							id
							status
							plan {
								id
								planType
							}
						}
					}
				}
			}
		`

		const variables = {
			accessPassId: options.accessPassId,
		}

		const response = await graphqlRequest<{
			accessPass: {
				id: string
				title: string
				viewer: {
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
			}
		}>(
			'checkAccessPassAccess',
			{ query, variables, operationName: 'checkAccessPassAccess' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		const { accessPass } = response

		return {
			id: accessPass.id,
			title: accessPass.title,
			hasAccess: accessPass.viewer.hasAccess,
			membership: accessPass.viewer.membership,
		}
	}

	/**
	 * Get detailed access information for the current user on a company
	 *
	 * @param companyId - Company ID
	 * @returns User access summary
	 */
	async getUserAccess(companyId: string): Promise<UserAccessSummary> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
			query getUserCompanyAccess($companyId: ID!) {
				company(id: $companyId) {
					id
					ownerUserId
					viewer {
						hasAccess
						isTeamMember
					}
				}
				viewer {
					user {
						id
						memberships(companyId: $companyId, first: 100) {
							nodes {
								id
								status
								accessPass {
									id
									title
								}
							}
						}
					}
				}
			}
		`

		const variables = { companyId }

		const response = await graphqlRequest<{
			company: {
				id: string
				ownerUserId: string
				viewer: {
					hasAccess: boolean
					isTeamMember: boolean
				}
			}
			viewer: {
				user: {
					id: string
					memberships: {
						nodes: Array<{
							id: string
							status: string
							accessPass: {
								id: string
								title: string
							}
						}>
					}
				}
			}
		}>(
			'getUserCompanyAccess',
			{ query, variables, operationName: 'getUserCompanyAccess' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		const { company, viewer } = response
		const user = viewer.user

		return {
			userId: user.id,
			companyId: company.id,
			isOwner: user.id === company.ownerUserId,
			isTeamMember: company.viewer.isTeamMember,
			memberships: user.memberships.nodes.map((m) => ({
				id: m.id,
				status: m.status,
				accessPassId: m.accessPass.id,
				accessPassTitle: m.accessPass.title,
			})),
		}
	}

	/**
	 * Quick check if user has any access to a company (owner, team, or member)
	 *
	 * @param companyId - Company ID
	 * @returns True if user has any access
	 */
	async hasCompanyAccess(companyId: string): Promise<boolean> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
			query hasCompanyAccess($companyId: ID!) {
				company(id: $companyId) {
					viewer {
						hasAccess
						isTeamMember
					}
				}
			}
		`

		const variables = { companyId }

		const response = await graphqlRequest<{
			company: {
				viewer: {
					hasAccess: boolean
					isTeamMember: boolean
				}
			}
		}>(
			'hasCompanyAccess',
			{ query, variables, operationName: 'hasCompanyAccess' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		const { viewer } = response.company
		return viewer.hasAccess || viewer.isTeamMember
	}
}
