import type { Whop } from '@/client'
import { WhopAuthError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import type { AppInstallExperience, InstallAppOptions } from '@/types/apps'
import type { App } from '@/types/companies'
import { AppBuilder } from './app'

/**
 * GraphQL response structure for fetchCompanyApps
 */
interface FetchCompanyAppsResponse {
	company: {
		apps: {
			edges: Array<{
				node: App
			}>
		}
	}
}

/**
 * GraphQL response structure for installApp
 */
interface InstallAppResponse {
	createExperience: {
		experience: AppInstallExperience
	}
}

/**
 * Apps collection for a specific company
 */
export class CompanyApps {
	constructor(
		private readonly client: Whop,
		private readonly companyId: string,
	) {}

	/**
	 * List all apps for this company
	 *
	 * @returns Array of apps
	 * @throws {WhopAuthError} If not authenticated
	 *
	 * @example
	 * ```typescript
	 * const apps = await whop.company('biz_xxx').apps.list()
	 * ```
	 */
	async list(): Promise<App[]> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query fetchCompanyApps($companyId: String!) {
        company(id: $companyId) {
          apps {
            edges {
              node {
                id
                name
                status
              }
            }
          }
        }
      }
    `

		const response = await graphqlRequest<FetchCompanyAppsResponse>(
			'fetchCompanyApps',
			{
				query,
				variables: { companyId: this.companyId },
				operationName: 'fetchCompanyApps',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.company.apps.edges.map((edge) => edge.node)
	}

	/**
	 * Install an app to this company
	 *
	 * @param appId - App ID to install
	 * @param options - Installation options
	 * @returns The created experience
	 *
	 * @example
	 * ```typescript
	 * const exp = await whop.company('biz_xxx').apps.install('app_xxx')
	 * ```
	 */
	async install(
		appId: string,
		options?: InstallAppOptions,
	): Promise<AppInstallExperience> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation installApp($input: CreateExperienceInput!) {
        createExperience(input: $input) {
          experience {
            id
            app {
              id
              name
            }
            accessPass {
              id
              title
            }
          }
        }
      }
    `

		const input = {
			appId,
			companyId: this.companyId,
			...(options?.shouldCreateExperience !== undefined && {
				shouldCreateExperience: options.shouldCreateExperience,
			}),
		}

		const response = await graphqlRequest<InstallAppResponse>(
			'installApp',
			{ query: mutation, variables: { input }, operationName: 'installApp' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.createExperience.experience
	}

	/**
	 * Get a specific app builder for this company
	 *
	 * @param appId - App ID
	 * @returns AppBuilder instance
	 *
	 * @example
	 * ```typescript
	 * const app = whop.company('biz_xxx').app('app_xxx')
	 * await app.credentials.get()
	 * ```
	 */
	app(appId: string): AppBuilder {
		return new AppBuilder(this.client, this.companyId, appId)
	}
}
