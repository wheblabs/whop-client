import type { Whop } from '@/client'
import { WhopAuthError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import type {
	CancelMembershipOptions,
	ListMembershipsOptions,
	Membership,
	MembershipListResponse,
	PauseMembershipOptions,
	PauseResumeResult,
	ResumeMembershipOptions,
	TransferMembershipOptions,
} from './types'

export * from './types'

/**
 * Memberships resource for managing subscription memberships
 *
 * @example
 * ```typescript
 * const whop = new Whop()
 *
 * // List memberships for a company
 * const { memberships } = await whop.memberships.list('biz_xxx')
 *
 * // Get specific membership
 * const membership = await whop.memberships.get('mem_xxx')
 *
 * // Pause a membership
 * await whop.memberships.pause({ membershipId: 'mem_xxx' })
 *
 * // Resume a membership
 * await whop.memberships.resume({ membershipId: 'mem_xxx' })
 *
 * // Cancel a membership
 * await whop.memberships.cancel({ membershipId: 'mem_xxx' })
 * ```
 */
export class Memberships {
	constructor(private readonly client: Whop) {}

	/**
	 * List memberships for a company
	 *
	 * @param companyId - Company ID
	 * @param options - List options (pagination, filters)
	 * @returns Paginated list of memberships
	 */
	async list(
		companyId: string,
		options?: ListMembershipsOptions,
	): Promise<MembershipListResponse> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
			query fetchCompanyMemberships($id: ID!, $filters: JSON!, $first: Int, $after: String) {
				company(id: $id) {
					creatorDashboardTable(tableFilters: $filters) {
						memberships(first: $first, after: $after) {
							nodes {
								id
								createdAt
								header
								splitPayCurrentPayments
								splitPayRequiredPayments
								plan {
									id
									planType
									formattedPrice
								}
								accessPass {
									id
									title
								}
								totalSpend
								actions
								licenseKey
								renewalPeriodEnd
								expiresAt
								companyMember {
									id
									joinedAt
									phone
									bannedAt
									imageSrcset(style: s40) {
										original
										double
									}
									user {
										id
										email
										city
										name
										username
										countryName
										stateName
									}
								}
								mostRecentAction {
									timestamp
									name
								}
								usesBillingEngine
							}
							totalCount
							pageInfo {
								endCursor
								hasNextPage
							}
						}
					}
				}
			}
		`

		// Build filters object
		const filters: Record<string, unknown> = {}
		if (options?.status) {
			filters.status = Array.isArray(options.status)
				? options.status
				: [options.status]
		}
		if (options?.accessPassId) {
			filters.accessPassId = options.accessPassId
		}
		if (options?.query) {
			filters.query = options.query
		}

		const variables = {
			id: companyId,
			filters,
			first: options?.first ?? 25,
			after: options?.after,
		}

		const response = await graphqlRequest<{
			company: {
				creatorDashboardTable: {
					memberships: {
						nodes: Membership[]
						totalCount: number
						pageInfo: {
							endCursor?: string
							hasNextPage: boolean
						}
					}
				}
			}
		}>(
			'fetchCompanyMemberships',
			{ query, variables, operationName: 'fetchCompanyMemberships' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		const { nodes, totalCount, pageInfo } =
			response.company.creatorDashboardTable.memberships

		return {
			memberships: nodes,
			totalCount,
			pageInfo,
		}
	}

	/**
	 * Get a specific membership by ID
	 *
	 * @param membershipId - Membership ID
	 * @returns Membership details
	 */
	async get(membershipId: string): Promise<Membership> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
			query fetchMembership($id: ID!) {
				membership(id: $id) {
					id
					createdAt
					renewableNow
					cancelAtPeriodEnd
					trialDaysRemaining
					renewalPeriodEnd
					formattedRenewalPrice
					formattedUpcomingRenewalAmount
					paymentProcessor
					expiresAt
					licenseKey
					paymentCollectionPaused
					mostRecentAction {
						name
						timestamp
					}
					plan {
						id
						releaseMethod
						free
						formattedPrice
						planType
					}
					accessPass {
						title
						route
						name
						id
					}
					company {
						id
						title
						ownerUserId
						logo {
							sourceUrl
						}
					}
					member {
						id
					}
				}
			}
		`

		const variables = { id: membershipId }

		const response = await graphqlRequest<{
			membership: Membership
		}>(
			'fetchMembership',
			{ query, variables, operationName: 'fetchMembership' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.membership
	}

	/**
	 * Get current user's memberships
	 *
	 * @param options - List options
	 * @returns List of user's memberships
	 */
	async listForUser(options?: {
		first?: number
		after?: string
		companyId?: string
	}): Promise<MembershipListResponse> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
			query fetchMyMemberships($first: Int, $after: String, $companyId: ID) {
				viewer {
					user {
						memberships(first: $first, after: $after, companyId: $companyId) {
							nodes {
								id
								renewableNow
								cancelAtPeriodEnd
								createdAt
								trialDaysRemaining
								renewalPeriodEnd
								formattedRenewalPrice
								formattedUpcomingRenewalAmount
								paymentProcessor
								expiresAt
								mostRecentAction {
									name
									timestamp
								}
								plan {
									id
									releaseMethod
									free
									formattedPrice
									planType
								}
								accessPass {
									title
									route
									name
									id
								}
								company {
									id
									title
									ownerUserId
									logo {
										sourceUrl
									}
								}
							}
							totalCount
							pageInfo {
								endCursor
								hasNextPage
							}
						}
					}
				}
			}
		`

		const variables = {
			first: options?.first ?? 25,
			after: options?.after,
			companyId: options?.companyId,
		}

		const response = await graphqlRequest<{
			viewer: {
				user: {
					memberships: {
						nodes: Membership[]
						totalCount: number
						pageInfo: {
							endCursor?: string
							hasNextPage: boolean
						}
					}
				}
			}
		}>(
			'fetchMyMemberships',
			{ query, variables, operationName: 'fetchMyMemberships' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		const { nodes, totalCount, pageInfo } = response.viewer.user.memberships

		return {
			memberships: nodes,
			totalCount,
			pageInfo,
		}
	}

	/**
	 * Pause payment collection on a membership
	 *
	 * @param options - Pause options
	 * @returns Updated membership info
	 */
	async pause(options: PauseMembershipOptions): Promise<PauseResumeResult> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
			mutation PauseMembership($input: PauseMembershipInput!) {
				pauseMembership(input: $input) {
					id
					paymentCollectionPaused
				}
			}
		`

		const variables = {
			input: {
				membershipId: options.membershipId,
			},
		}

		const response = await graphqlRequest<{
			pauseMembership: PauseResumeResult
		}>(
			'PauseMembership',
			{ query: mutation, variables, operationName: 'PauseMembership' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.pauseMembership
	}

	/**
	 * Resume payment collection on a paused membership
	 *
	 * @param options - Resume options
	 * @returns Updated membership info
	 */
	async resume(options: ResumeMembershipOptions): Promise<PauseResumeResult> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
			mutation ResumeMembership($input: ResumeMembershipInput!) {
				resumeMembership(input: $input) {
					id
					paymentCollectionPaused
				}
			}
		`

		const variables = {
			input: {
				membershipId: options.membershipId,
			},
		}

		const response = await graphqlRequest<{
			resumeMembership: PauseResumeResult
		}>(
			'ResumeMembership',
			{ query: mutation, variables, operationName: 'ResumeMembership' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.resumeMembership
	}

	/**
	 * Cancel a membership
	 *
	 * @param options - Cancel options
	 * @returns True if successful
	 */
	async cancel(options: CancelMembershipOptions): Promise<boolean> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
			mutation cancelMyMembership($input: ToggleCancelMyMembershipInput!) {
				toggleCancelMyMembership(input: $input)
			}
		`

		const variables = {
			input: {
				membershipId: options.membershipId,
				cancel: true,
				...(options.reason && { reason: options.reason }),
			},
		}

		const response = await graphqlRequest<{
			toggleCancelMyMembership: boolean
		}>(
			'cancelMyMembership',
			{ query: mutation, variables, operationName: 'cancelMyMembership' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.toggleCancelMyMembership
	}

	/**
	 * Transfer a membership to another user
	 *
	 * @param options - Transfer options
	 * @returns True if successful
	 */
	async transfer(options: TransferMembershipOptions): Promise<boolean> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
			mutation transferMyMembership($input: TransferMyMembershipInput!) {
				transferMyMembership(input: $input)
			}
		`

		const variables = {
			input: {
				membershipId: options.membershipId,
				toUserId: options.toUserId,
			},
		}

		const response = await graphqlRequest<{
			transferMyMembership: boolean
		}>(
			'transferMyMembership',
			{ query: mutation, variables, operationName: 'transferMyMembership' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.transferMyMembership
	}

	/**
	 * Update a membership (admin operation)
	 *
	 * @param membershipId - Membership ID
	 * @param updates - Updates to apply
	 * @returns Updated membership
	 */
	async update(
		membershipId: string,
		updates: {
			status?: string
			expiresAt?: string
			renewalPeriodEnd?: string
		},
	): Promise<Membership> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
			mutation updateCompanyMembership($input: UpdateCompanyMembershipInput!) {
				updateCompanyMembership(input: $input) {
					id
					expiresAt
					renewalPeriodEnd
				}
			}
		`

		const variables = {
			input: {
				membershipId,
				...updates,
			},
		}

		const response = await graphqlRequest<{
			updateCompanyMembership: Membership
		}>(
			'updateCompanyMembership',
			{ query: mutation, variables, operationName: 'updateCompanyMembership' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.updateCompanyMembership
	}
}
