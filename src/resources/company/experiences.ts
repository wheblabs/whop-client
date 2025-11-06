import type { Whop } from '@/client'
import { WhopAuthError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import type {
	ExperiencesConnection,
	ListExperiencesOptions,
} from '@/types/experiences'

/**
 * GraphQL response structure for listExperiences
 */
interface ListExperiencesResponse {
	company: {
		experiences: {
			experiences: Array<{
				id: string
				name: string
				visibility: string
				createdAt: string
				app: {
					id: string
					name: string
				}
				accessPass: {
					id: string
					title: string
				} | null
			}>
			pageInfo: {
				hasNextPage: boolean
				endCursor: string | null
			}
			totalCount: number
		}
	}
}

/**
 * Experiences collection for a specific company
 */
export class CompanyExperiences {
	constructor(
		private readonly client: Whop,
		private readonly companyId: string,
	) {}

	/**
	 * List experiences (app installations) for this company
	 *
	 * @param options - Filtering and pagination options
	 * @returns Experiences connection with pagination info
	 *
	 * @example
	 * ```typescript
	 * const result = await whop.company('biz_xxx').experiences.list()
	 * console.log(`Total: ${result.totalCount}`)
	 * for (const exp of result.experiences) {
	 *   console.log(`${exp.name} - ${exp.app.name}`)
	 * }
	 * ```
	 */
	async list(options?: ListExperiencesOptions): Promise<ExperiencesConnection> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query listExperiences($companyId: String!, $appId: String, $first: Int, $after: String) {
        company(id: $companyId) {
          experiences(appId: $appId, first: $first, after: $after) {
            experiences {
              id
              name
              description
              app {
                id
                name
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
    `

		const variables = {
			companyId: this.companyId,
			...(options?.appId && { appId: options.appId }),
			...(options?.first && { first: options.first }),
			...(options?.after && { after: options.after }),
		}

		const response = await graphqlRequest<ListExperiencesResponse>(
			'listExperiences',
			{ query, variables, operationName: 'listExperiences' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.company.experiences as unknown as ExperiencesConnection
	}
}
