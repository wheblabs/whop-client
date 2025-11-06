import type { Whop } from '@/client'
import { WhopAuthError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import type { AppCredentials } from '@/types/app-credentials'

/**
 * GraphQL response structure for fetchCompanyApp
 */
interface FetchCompanyAppResponse {
	company: {
		app: {
			id: string
			apiKey: {
				token: string
			}
			baseDevUrl: string | null
			agentUsers: Array<{
				id: string
				username: string
			}>
		}
	}
}

/**
 * App builder for a specific app within a company
 */
export class AppBuilder {
	public readonly credentials: {
		get: () => Promise<AppCredentials>
	}

	public readonly url: {
		get: () => Promise<string>
	}

	constructor(
		private readonly client: Whop,
		private readonly companyId: string,
		public readonly id: string,
	) {
		this.credentials = {
			get: () => this.getCredentials(),
		}
		this.url = {
			get: () => this.getUrl(),
		}
	}

	/**
	 * Get app credentials (API key, URLs, agent users)
	 *
	 * @returns App credentials
	 *
	 * @example
	 * ```typescript
	 * const creds = await whop.company('biz_xxx').app('app_xxx').credentials.get()
	 * console.log(creds.apiKey.token)
	 * ```
	 */
	private async getCredentials(): Promise<AppCredentials> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query fetchCompanyApp($companyId: String!, $appId: String!) {
        company(id: $companyId) {
          app(id: $appId) {
            id
            apiKey {
              token
            }
            baseDevUrl
            agentUsers {
              id
              username
            }
          }
        }
      }
    `

		const response = await graphqlRequest<FetchCompanyAppResponse>(
			'fetchCompanyApp',
			{
				query,
				variables: { companyId: this.companyId, appId: this.id },
				operationName: 'fetchCompanyApp',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		// Note: This returns a simplified version. For full AppCredentials type,
		// we'd need more fields from the GraphQL query
		return response.company.app as unknown as AppCredentials
	}

	/**
	 * Get app URL for dashboard access
	 *
	 * @returns App dashboard URL
	 *
	 * @example
	 * ```typescript
	 * const url = await whop.company('biz_xxx').app('app_xxx').url.get()
	 * console.log(url) // https://whop.com/biz_xxx/app-name-123/app
	 * ```
	 */
	private async getUrl(): Promise<string> {
		// For now, we'll need to make a request to get the app's slug
		// This is a simplified version - in reality we might need to fetch the app details
		const creds = await this.getCredentials()
		return `https://whop.com/${this.companyId}/${creds.id}/app`
	}
}
