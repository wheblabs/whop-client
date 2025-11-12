import type { Whop } from '@/client'
import { WhopAuthError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import type { Company, ListCompaniesOptions } from '@/types/companies'

/**
 * GraphQL response structure for fetchMyCompanies
 */
interface FetchMyCompaniesResponse {
	viewer: {
		user: {
			companies: Company[]
		}
	}
}

/**
 * GraphQL response structure for fetchMyMemberships
 */
interface FetchMyMembershipsResponse {
	viewer: {
		user: {
			validMemberships: {
				totalCount: number
				nodes: Array<{
					id: string
					status: string
					createdAt: string
					expiresAt: string | null
					company: {
						id: string
						title: string
						route: string
						logo: {
							source: {
								url: string
							}
						} | null
					}
					accessPass: {
						id: string
						title: string
						route: string
					}
					plan: {
						id: string
						planType: string
						formattedPrice: string
					}
				}>
				pageInfo: {
					hasNextPage: boolean
					endCursor: string | null
				}
			}
		}
	}
}

/**
 * Companies collection under current user
 */
export class MeCompanies {
	constructor(private readonly client: Whop) {}

	/**
	 * List companies based on your role
	 *
	 * @param options - Options including role filter ('admin' or 'member')
	 * @returns Array of companies
	 * @throws {WhopAuthError} If not authenticated
	 * @throws {WhopNetworkError} On network failures
	 * @throws {WhopHTTPError} On HTTP errors or GraphQL errors
	 *
	 * @example
	 * **List companies you own/manage (admin):**
	 * ```typescript
	 * const whop = new Whop()
	 * const adminCompanies = await whop.me.companies.list({ role: 'admin' })
	 * // or
	 * const adminCompanies = await whop.me.companies.list() // defaults to admin
	 *
	 * for (const company of adminCompanies) {
	 *   console.log(`${company.title} (${company.id})`)
	 * }
	 * ```
	 *
	 * @example
	 * **List companies you're a customer of (member):**
	 * ```typescript
	 * const memberCompanies = await whop.me.companies.list({ role: 'member' })
	 *
	 * for (const company of memberCompanies) {
	 *   console.log(`${company.title} (${company.id})`)
	 * }
	 * ```
	 *
	 * @example
	 * **List only active member companies:**
	 * ```typescript
	 * const activeMemberCompanies = await whop.me.companies.list({
	 *   role: 'member',
	 *   status: 'active'
	 * })
	 * ```
	 */
	async list(options: ListCompaniesOptions = {}): Promise<Company[]> {
		// Check authentication
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const { role = 'admin', first, after, status } = options

		// If role is 'member', fetch from validMemberships
		if (role === 'member') {
			return this.listMemberCompanies(tokens, { first, after, status })
		}

		// Default: fetch admin companies
		return this.listAdminCompanies(tokens)
	}

	/**
	 * List companies where user is an admin/owner
	 */
	private async listAdminCompanies(
		tokens: Parameters<typeof graphqlRequest>[2],
	): Promise<Company[]> {
		const query = `
      query fetchMyCompanies {
        viewer {
          user {
            companies {
              id
              title
              image: imageSrcset(style: s64, allowAnimation: false) {
                original
                isVideo
              }
              staticImage: imageSrcset(style: s64, allowAnimation: false) {
                original
                isVideo
              }
            }
          }
        }
      }
    `

		const response = await graphqlRequest<FetchMyCompaniesResponse>(
			'fetchMyCompanies',
			{ query, operationName: 'fetchMyCompanies' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.viewer.user.companies
	}

	/**
	 * List companies where user is a member/customer
	 */
	private async listMemberCompanies(
		tokens: Parameters<typeof graphqlRequest>[2],
		options: { first?: number; after?: string; status?: 'active' | 'inactive' },
	): Promise<Company[]> {
		const { first = 100, after, status } = options

		const query = `
      query fetchMyMemberships(
        $first: Int
        $after: String
        $status: HubMembershipStatus
      ) {
        viewer {
          user {
            validMemberships(
              first: $first
              after: $after
              status: $status
            ) {
              totalCount
              nodes {
                id
                status
                createdAt
                expiresAt
                company {
                  id
                  title
                  route
                  logo {
                    source(variant: s64) {
                      url
                    }
                  }
                }
                accessPass {
                  id
                  title
                  route
                }
                plan {
                  id
                  planType
                  formattedPrice
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      }
    `

		const variables: Record<string, unknown> = {
			first,
		}

		if (after) {
			variables.after = after
		}

		if (status) {
			variables.status = status.toUpperCase()
		}

		const response = await graphqlRequest<FetchMyMembershipsResponse>(
			'fetchMyMemberships',
			{ query, variables, operationName: 'fetchMyMemberships' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		// Extract unique companies from memberships
		const companiesMap = new Map<string, Company>()

		for (const membership of response.viewer.user.validMemberships.nodes) {
			if (membership.company && !companiesMap.has(membership.company.id)) {
				companiesMap.set(membership.company.id, {
					id: membership.company.id,
					title: membership.company.title,
					image: membership.company.logo
						? {
								original: membership.company.logo.source.url,
								isVideo: false,
							}
						: null,
					staticImage: membership.company.logo
						? {
								original: membership.company.logo.source.url,
								isVideo: false,
							}
						: null,
				})
			}
		}

		return Array.from(companiesMap.values())
	}
}
