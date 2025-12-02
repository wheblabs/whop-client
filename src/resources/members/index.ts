import type { Whop } from '@/client'
import { WhopAuthError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import type {
	BanResult,
	ListMembersOptions,
	Member,
	MemberListResponse,
	UnbanResult,
} from './types'

export * from './types'

/**
 * Members resource for managing company members
 *
 * @remarks
 * Members are users who have purchased or been granted access to a company.
 * This resource allows listing members, getting member details, and
 * managing member bans.
 *
 * @example
 * ```typescript
 * const whop = new Whop()
 *
 * // List all members
 * const { members } = await whop.members.list('biz_xxx')
 *
 * // Search members
 * const { members } = await whop.members.list('biz_xxx', {
 *   query: 'john@example.com'
 * })
 *
 * // Ban a member
 * await whop.members.ban('biz_xxx', 'member_xxx')
 *
 * // Unban a member
 * await whop.members.unban('biz_xxx', 'member_xxx')
 * ```
 */
export class Members {
	constructor(private readonly client: Whop) {}

	/**
	 * List members for a company
	 *
	 * @param companyId - Company ID
	 * @param options - List options
	 * @returns Paginated list of members
	 */
	async list(
		companyId: string,
		options?: ListMembersOptions,
	): Promise<MemberListResponse> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
			query fetchCompanyMembers($id: ID!, $first: Int, $after: String, $filters: JSON!) {
				company(id: $id) {
					creatorDashboardTable(tableFilters: $filters) {
						companyMembers(first: $first, after: $after) {
							nodes {
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
									name
									username
									profilePicUrl
									city
									countryName
									stateName
									discord {
										username
										id
									}
									telegramAccount {
										telegramUsername
										telegramAccountId
									}
									twitterAccount {
										username
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

		// Build filters object
		const filters: Record<string, unknown> = {}
		if (options?.query) {
			filters.query = options.query
		}
		if (options?.banned !== undefined) {
			filters.banned = options.banned
		}
		if (options?.accessPassId) {
			filters.accessPassId = options.accessPassId
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
					companyMembers: {
						nodes: Member[]
						totalCount: number
						pageInfo: {
							endCursor?: string
							hasNextPage: boolean
						}
					}
				}
			}
		}>(
			'fetchCompanyMembers',
			{ query, variables, operationName: 'fetchCompanyMembers' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		const { nodes, totalCount, pageInfo } =
			response.company.creatorDashboardTable.companyMembers

		return {
			members: nodes,
			totalCount,
			pageInfo,
		}
	}

	/**
	 * Get a specific member by ID
	 *
	 * @param companyId - Company ID
	 * @param memberId - Member ID
	 * @returns Member details
	 */
	async get(companyId: string, memberId: string): Promise<Member> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
			query fetchCompanyMember($companyId: ID!, $memberId: ID!) {
				company(id: $companyId) {
					companyMember(id: $memberId) {
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
							name
							username
							profilePicUrl
							city
							countryName
							stateName
							discord {
								username
								id
							}
							telegramAccount {
								telegramUsername
								telegramAccountId
							}
							twitterAccount {
								username
							}
						}
					}
				}
			}
		`

		const variables = {
			companyId,
			memberId,
		}

		const response = await graphqlRequest<{
			company: {
				companyMember: Member
			}
		}>(
			'fetchCompanyMember',
			{ query, variables, operationName: 'fetchCompanyMember' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.company.companyMember
	}

	/**
	 * Ban a member from a company
	 *
	 * @param companyId - Company ID
	 * @param memberId - Member ID to ban
	 * @returns Ban result with timestamp
	 */
	async ban(companyId: string, memberId: string): Promise<BanResult> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
			mutation banCompanyMember($input: BanCompanyMemberInput!) {
				banCompanyMember(input: $input) {
					id
					bannedAt
				}
			}
		`

		const variables = {
			input: {
				companyId,
				companyMemberId: memberId,
			},
		}

		const response = await graphqlRequest<{
			banCompanyMember: BanResult
		}>(
			'banCompanyMember',
			{ query: mutation, variables, operationName: 'banCompanyMember' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.banCompanyMember
	}

	/**
	 * Unban a member from a company
	 *
	 * @param companyId - Company ID
	 * @param memberId - Member ID to unban
	 * @returns Unban result
	 */
	async unban(companyId: string, memberId: string): Promise<UnbanResult> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
			mutation unbanCompanyMember($input: UnbanCompanyMemberInput!) {
				unbanCompanyMember(input: $input) {
					id
					bannedAt
				}
			}
		`

		const variables = {
			input: {
				companyId,
				companyMemberId: memberId,
			},
		}

		const response = await graphqlRequest<{
			unbanCompanyMember: UnbanResult
		}>(
			'unbanCompanyMember',
			{ query: mutation, variables, operationName: 'unbanCompanyMember' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.unbanCompanyMember
	}

	/**
	 * Search members by email, name, or username
	 *
	 * @param companyId - Company ID
	 * @param searchQuery - Search query string
	 * @param options - Additional options
	 * @returns Matching members
	 */
	async search(
		companyId: string,
		searchQuery: string,
		options?: { first?: number },
	): Promise<Member[]> {
		const result = await this.list(companyId, {
			query: searchQuery,
			first: options?.first ?? 25,
		})

		return result.members
	}
}
