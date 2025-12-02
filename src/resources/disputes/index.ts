import type { Whop } from '@/client'
import { WhopAuthError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import type {
	Dispute,
	DisputesConnection,
	ListDisputesOptions,
	ResolutionCenterSettings,
	SupportCase,
} from './types'

/**
 * Settings sub-resource for disputes configuration
 */
export class DisputeSettings {
	constructor(private readonly client: Whop) {}

	/**
	 * Get resolution center settings
	 */
	async get(companyId: string): Promise<ResolutionCenterSettings> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query fetchResolutionSettings($id: ID!) {
        company(id: $id) {
          resolutionCenterSettings {
            autoRefundDisputes
            autoRefundLimit
            disputeEmailNotifications
          }
        }
      }
    `

		interface FetchSettingsResponse {
			company: {
				resolutionCenterSettings: ResolutionCenterSettings
			}
		}

		const response = await graphqlRequest<FetchSettingsResponse>(
			'fetchResolutionSettings',
			{
				query,
				variables: { id: companyId },
				operationName: 'fetchResolutionSettings',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.company.resolutionCenterSettings
	}

	/**
	 * Update resolution center settings
	 */
	async update(
		companyId: string,
		settings: Partial<ResolutionCenterSettings>,
	): Promise<ResolutionCenterSettings> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation updateResolutionSettings($input: UpdateResolutionCenterSettingsInput!) {
        updateResolutionCenterSettings(input: $input) {
          autoRefundDisputes
          autoRefundLimit
          disputeEmailNotifications
        }
      }
    `

		interface UpdateSettingsResponse {
			updateResolutionCenterSettings: ResolutionCenterSettings
		}

		const response = await graphqlRequest<UpdateSettingsResponse>(
			'updateResolutionSettings',
			{
				query: mutation,
				variables: { input: { companyId, ...settings } },
				operationName: 'updateResolutionSettings',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.updateResolutionCenterSettings
	}
}

/**
 * Cases sub-resource for support cases
 */
export class DisputeCases {
	constructor(private readonly client: Whop) {}

	/**
	 * List support cases
	 */
	async list(
		companyId: string,
		options?: { first?: number; after?: string },
	): Promise<SupportCase[]> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query fetchSupportCases($id: ID!, $first: Int, $after: String) {
        company(id: $id) {
          supportCases(first: $first, after: $after) {
            nodes {
              id
              subject
              status
              priority
              createdAt
              updatedAt
              user {
                id
                username
                email
                profilePic
              }
              memberships {
                id
                plan {
                  title
                }
              }
            }
          }
        }
      }
    `

		interface FetchCasesResponse {
			company: {
				supportCases: { nodes: SupportCase[] }
			}
		}

		const response = await graphqlRequest<FetchCasesResponse>(
			'fetchSupportCases',
			{
				query,
				variables: {
					id: companyId,
					first: options?.first || 50,
					after: options?.after || null,
				},
				operationName: 'fetchSupportCases',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.company.supportCases.nodes
	}
}

/**
 * Disputes resource - Manage disputes and resolution center
 *
 * @example
 * ```typescript
 * const whop = new Whop()
 *
 * // List disputes
 * const { disputes } = await whop.disputes.list({ companyId: 'biz_xxx' })
 *
 * // Get resolution center settings
 * const settings = await whop.disputes.settings.get('biz_xxx')
 *
 * // List support cases
 * const cases = await whop.disputes.cases.list('biz_xxx')
 * ```
 */
export class Disputes {
	public readonly settings: DisputeSettings
	public readonly cases: DisputeCases

	constructor(private readonly client: Whop) {
		this.settings = new DisputeSettings(client)
		this.cases = new DisputeCases(client)
	}

	/**
	 * List disputes for a company
	 */
	async list(options: ListDisputesOptions): Promise<DisputesConnection> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query fetchCompanyDisputes($id: ID!, $filters: JSON!, $first: Int, $after: String) {
        company(id: $id) {
          creatorDashboardTable(tableFilters: $filters) {
            disputes(first: $first, after: $after) {
              nodes {
                id
                status
                reason
                amount
                currency
                createdAt
                respondBy
                receiptId
                isChargeback
                user {
                  id
                  username
                  email
                  profilePic
                }
              }
              totalCount
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      }
    `

		const filters: Record<string, unknown> = {}
		if (options.status) filters.status = options.status

		interface FetchDisputesResponse {
			company: {
				creatorDashboardTable: {
					disputes: {
						nodes: Dispute[]
						totalCount: number
						pageInfo: { hasNextPage: boolean; endCursor: string | null }
					}
				}
			}
		}

		const response = await graphqlRequest<FetchDisputesResponse>(
			'fetchCompanyDisputes',
			{
				query,
				variables: {
					id: options.companyId,
					first: options.first || 50,
					after: options.after || null,
					filters,
				},
				operationName: 'fetchCompanyDisputes',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		const data = response.company.creatorDashboardTable.disputes
		return {
			disputes: data.nodes,
			totalCount: data.totalCount,
			pageInfo: data.pageInfo,
		}
	}

	/**
	 * Get a specific dispute
	 */
	async get(companyId: string, disputeId: string): Promise<Dispute> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query fetchDispute($companyId: ID!, $disputeId: ID!) {
        company(id: $companyId) {
          dispute(id: $disputeId) {
            id
            status
            reason
            amount
            currency
            createdAt
            respondBy
            receiptId
            isChargeback
            user {
              id
              username
              email
              profilePic
            }
          }
        }
      }
    `

		interface FetchDisputeResponse {
			company: {
				dispute: Dispute
			}
		}

		const response = await graphqlRequest<FetchDisputeResponse>(
			'fetchDispute',
			{
				query,
				variables: { companyId, disputeId },
				operationName: 'fetchDispute',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.company.dispute
	}
}

export * from './types'
