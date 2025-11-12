import type { Whop } from '@/client'
import { WhopAuthError, WhopForumError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import type { Experience } from '@/types/experiences'
import type { ForumExperience } from '@/types/forums'

/**
 * GraphQL response structure for listExperiences
 */
interface ListExperiencesResponse {
	company: {
		experiencesV2: {
			nodes: Array<{
				id: string
				name: string
				description: string | null
				logo: {
					sourceUrl: string
				} | null
				app: {
					id: string
					name: string
					internalIdentifier: string | null
					icon: {
						sourceUrl: string
					} | null
				}
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
 * Forums collection for a specific company
 */
export class CompanyForums {
	constructor(
		private readonly client: Whop,
		private readonly companyId: string,
	) {}

	/**
	 * List forum experiences for this company
	 *
	 * @returns Array of forum experiences
	 * @throws {WhopAuthError} If not authenticated
	 * @throws {WhopForumError} On forum-specific errors
	 *
	 * @example
	 * ```typescript
	 * const forums = await whop.company('biz_xxx').forums.list()
	 * for (const forum of forums) {
	 *   console.log(`${forum.name} - ${forum.app.name}`)
	 * }
	 * ```
	 */
	async list(): Promise<ForumExperience[]> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query listExperiences($companyId: ID!, $first: Int, $after: String) {
        company(id: $companyId) {
          experiencesV2(first: $first, after: $after) {
            nodes {
              id
              name
              description
              logo: imageSrcset(style: s80) {
                sourceUrl: original
              }
              app {
                id
                name
                internalIdentifier
                icon {
                  sourceUrl
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
            totalCount
          }
        }
      }
    `

		try {
			// Fetch all experiences (we'll filter client-side)
			const allExperiences: Experience[] = []
			let after: string | null = null
			let hasNextPage = true

			while (hasNextPage) {
				const variables: {
					companyId: string
					first: number
					after: string | null
				} = {
					companyId: this.companyId,
					first: 100,
					after,
				}

				const response: ListExperiencesResponse =
					await graphqlRequest<ListExperiencesResponse>(
						'listExperiences',
						{ query, variables, operationName: 'listExperiences' },
						tokens,
						(newTokens) => this.client._updateTokens(newTokens),
					)

				const experiences = response.company.experiencesV2.nodes.map(
					(
						node: ListExperiencesResponse['company']['experiencesV2']['nodes'][0],
					) =>
						({
							id: node.id,
							name: node.name,
							description: node.description,
							logo: node.logo ? { sourceUrl: node.logo.sourceUrl } : null,
							app: {
								id: node.app.id,
								name: node.app.name,
								icon: node.app.icon
									? { sourceUrl: node.app.icon.sourceUrl }
									: null,
								internalIdentifier: node.app.internalIdentifier,
							},
						}) satisfies Experience,
				)

				allExperiences.push(...experiences)

				hasNextPage = response.company.experiencesV2.pageInfo.hasNextPage
				after = response.company.experiencesV2.pageInfo.endCursor
			}

			// Filter to only forum experiences
			return allExperiences.filter(
				(exp) => exp.app.internalIdentifier === 'forums',
			) as ForumExperience[]
		} catch (error) {
			throw new WhopForumError(
				`Failed to list forum experiences for company ${this.companyId}`,
				undefined,
				undefined,
				undefined,
				undefined,
				error as Error,
			)
		}
	}
}
