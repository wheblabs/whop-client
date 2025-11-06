import type { Whop } from '@/client'
import { WhopAuthError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import type { Company } from '@/types/companies'

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
 * Companies collection under current user
 */
export class MeCompanies {
	constructor(private readonly client: Whop) {}

	/**
	 * List all companies owned by the authenticated user
	 *
	 * @returns Array of companies
	 * @throws {WhopAuthError} If not authenticated
	 * @throws {WhopNetworkError} On network failures
	 * @throws {WhopHTTPError} On HTTP errors or GraphQL errors
	 *
	 * @example
	 * ```typescript
	 * const whop = new Whop()
	 * const companies = await whop.me.companies.list()
	 *
	 * for (const company of companies) {
	 *   console.log(`${company.title} (${company.id})`)
	 * }
	 * ```
	 */
	async list(): Promise<Company[]> {
		// Check authentication
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		// GraphQL query
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

		// Make request with token refresh callback
		const response = await graphqlRequest<FetchMyCompaniesResponse>(
			'fetchMyCompanies',
			{ query, operationName: 'fetchMyCompanies' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.viewer.user.companies
	}
}
