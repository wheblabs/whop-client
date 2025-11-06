import type { Whop } from '@/client'
import { WhopAuthError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import type {
	ListMembershipsOptions,
	Membership,
	MembershipsConnection,
} from '@/types/memberships'

/**
 * GraphQL response structure for fetchCompanyMemberships
 */
interface FetchCompanyMembershipsResponse {
	company: {
		creatorDashboardTable: {
			memberships: {
				nodes: Membership[]
				totalCount: number
			}
		}
	}
}

/**
 * Memberships collection for a specific company
 */
export class CompanyMemberships {
	constructor(
		private readonly client: Whop,
		private readonly companyId: string,
	) {}

	/**
	 * List memberships for this company
	 *
	 * @param options - Filtering and pagination options
	 * @returns Memberships connection with pagination info
	 *
	 * @example
	 * ```typescript
	 * // Get all memberships
	 * const result = await client.company('biz_xxx').memberships.list()
	 * console.log(`Total: ${result.totalCount}`)
	 *
	 * for (const membership of result.nodes) {
	 *   console.log(`${membership.companyMember.user.username}: $${membership.totalSpend}`)
	 * }
	 *
	 * // With filters
	 * const active = await client.company('biz_xxx').memberships.list({
	 *   filters: { status: 'active' }
	 * })
	 * ```
	 */
	async list(options?: ListMembershipsOptions): Promise<MembershipsConnection> {
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
                    discord {
                      username
                      id
                    }
                    telegramAccount {
                      telegramUsername
                      telegramAccountId
                    }
                    tradingViewUsername
                    twitterAccount {
                      username
                    }
                    disputesAcrossWhop
                    reviewsAcrossWhop
                    usdSpendAcrossWhop
                    resolutionsAcrossWhop
                  }
                }
                mostRecentAction {
                  timestamp
                  name
                }
              }
              totalCount
            }
          }
        }
      }
    `

		const variables = {
			id: this.companyId,
			filters: options?.filters || {},
			...(options?.first && { first: options.first }),
			...(options?.after && { after: options.after }),
		}

		const response = await graphqlRequest<FetchCompanyMembershipsResponse>(
			'fetchCompanyMemberships',
			{ query, variables, operationName: 'fetchCompanyMemberships' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.company.creatorDashboardTable.memberships
	}
}
